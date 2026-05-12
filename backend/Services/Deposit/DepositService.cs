using Hangfire;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Enums;
using VexPay.Exceptions;
using VexPay.Models.Response.Deposit;
using VexPay.Settings;

namespace VexPay.Services.Deposit
{
    public class DepositService : IDepositService
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IWebHostEnvironment _env;
        private readonly SepaySettings _sepay;
        private readonly GlobalSettings _global;
        private readonly Dictionary<string, (string Name, string ShortName)> _bankByBin;
        public DepositService(AppDbContext db, IHttpClientFactory httpClientFactory, IWebHostEnvironment env, IOptions<SepaySettings> sepay, IOptions<GlobalSettings> global)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _env = env;
            _sepay = sepay.Value;
            _global = global.Value;
            _bankByBin = LoadBankByBin();
        }

        public DepositQrConfigResponse GetQrConfig()
        {
            _bankByBin.TryGetValue(_sepay.BankCode, out var bank);
            var shortName = bank.ShortName ?? string.Empty;
            var iconBase = (_sepay.LinkIcon ?? string.Empty).Trim();
            if (!string.IsNullOrWhiteSpace(iconBase) && !iconBase.EndsWith('/'))
            {
                iconBase += "/";
            }

            var iconUrl = !string.IsNullOrWhiteSpace(shortName)
                ? $"{iconBase}{shortName.ToLowerInvariant()}-icon.png"
                : string.Empty;

            return new DepositQrConfigResponse
            {
                AccountName = _sepay.AccountName,
                AccountNumber = _sepay.AccountNumber,
                BankCode = _sepay.BankCode,
                BankName = bank.Name ?? string.Empty,
                BankShortName = shortName,
                BankIconUrl = iconUrl,
                QrImageExpirationMinutes = _global.QrImageExpirationMinutes,
            };
        }

        public async Task<(CreateDepositQrResponse Response, byte[] ImageBytes)> CreateQrAsync(string userId, decimal amount, CancellationToken cancellationToken = default)
        {
            if (amount < 10000)
            {
                throw new AppException("Số tiền nạp tối thiểu là 10.000 VNĐ.", 400);
            }

            var deposit = new DepositHistory
            {
                UserId = userId,
                Amount = amount,
                Status = DepositStatus.Pending,
                Method = DepositMethod.QrCode,
            };

            _db.DepositHistories.Add(deposit);
            await _db.SaveChangesAsync(cancellationToken);

            var qrUrl = BuildQrUrl(_sepay.AccountNumber, _sepay.BankCode, amount, deposit.Code, _sepay.QrTemplate, true);
            var client = _httpClientFactory.CreateClient();
            var bytes = await client.GetByteArrayAsync(qrUrl, cancellationToken);

            var webRoot = !string.IsNullOrWhiteSpace(_env.WebRootPath)
                ? _env.WebRootPath
                : Path.Combine(_env.ContentRootPath, "wwwroot");
            var dir = Path.Combine(webRoot, "qrs");
            Directory.CreateDirectory(dir);
            var fileName = $"{deposit.Code}.png";
            var fullPath = Path.Combine(dir, fileName);
            await File.WriteAllBytesAsync(fullPath, bytes, cancellationToken);

            deposit.QrImagePath = $"qrs/{fileName}";
            await _db.SaveChangesAsync(cancellationToken);

            BackgroundJob.Schedule(() => DeleteFile(fullPath), TimeSpan.FromMinutes(_global.QrImageExpirationMinutes));

            return (new CreateDepositQrResponse
            {
                DepositCode = deposit.Code,
                Amount = deposit.Amount,
                Status = deposit.Status,
            }, bytes);
        }

        public async Task<DepositStatus> GetStatusAsync(string userId, string code, CancellationToken cancellationToken = default)
        {
            var status = await _db.DepositHistories
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.Code == code)
                .Select(x => (DepositStatus?)x.Status)
                .FirstOrDefaultAsync(cancellationToken);

            if (status is null)
            {
                throw new AppException("Không tìm thấy lịch sử nạp tiền.", 404);
            }

            return status.Value;
        }

        public async Task<DepositHistoryPagedResponse> GetHistoryAsync(string userId, int page = 1, int pageSize = 5, CancellationToken cancellationToken = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var query = _db.DepositHistories
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt);

            var totalItems = await query.CountAsync(cancellationToken);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new DepositHistoryResponse
                {
                    Id = x.Id,
                    Code = x.Code,
                    Amount = x.Amount,
                    Status = x.Status,
                    Method = x.Method,
                    CreatedAt = x.CreatedAt,
                    PaidAt = x.PaidAt,
                })
                .ToListAsync(cancellationToken);

            var now = DateTime.Now;
            foreach (var item in items)
            {
                if (item.Status == DepositStatus.Pending)
                {
                    var expiresAt = item.CreatedAt.AddMinutes(_global.QrImageExpirationMinutes);
                    item.RemainingSeconds = Math.Max(0, (int)(expiresAt - now).TotalSeconds);
                }
                else
                {
                    item.RemainingSeconds = null;
                }
            }

            return new DepositHistoryPagedResponse
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }

        public async Task<byte[]> GetQrImageByCodeAsync(string userId, string code, CancellationToken cancellationToken = default)
        {
            var qrImagePath = await _db.DepositHistories
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.Code == code && x.Status == DepositStatus.Pending)
                .Select(x => x.QrImagePath)
                .FirstOrDefaultAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(qrImagePath))
            {
                throw new AppException("Không tìm thấy QR cho giao dịch đang chờ.", 404);
            }

            var fullPath = GetQrImageFullPath(qrImagePath);
            if (!File.Exists(fullPath))
            {
                throw new AppException("Ảnh QR không còn tồn tại.", 404);
            }

            return await File.ReadAllBytesAsync(fullPath, cancellationToken);
        }

        public async Task CancelAsync(string userId, string code, CancellationToken cancellationToken = default)
        {
            var deposit = await _db.DepositHistories
                .FirstOrDefaultAsync(x => x.UserId == userId && x.Code == code, cancellationToken);

            if (deposit is null)
            {
                throw new AppException("Không tìm thấy giao dịch nạp.", 404);
            }

            if (deposit.Status != DepositStatus.Pending)
            {
                throw new AppException("Chỉ có thể hủy giao dịch đang chờ thanh toán.", 400);
            }

            var qrPath = deposit.QrImagePath;
            deposit.Status = DepositStatus.Cancelled;
            deposit.QrImagePath = null;
            await _db.SaveChangesAsync(cancellationToken);

            DeleteQrImageFileByRelativePath(qrPath);
        }

        public async Task MarkPaidFromSepayAsync(long sepayTransactionId, string content, long transferAmount, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(content)) return;

            var candidates = await _db.DepositHistories
                .Where(x => x.Status == DepositStatus.Pending)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            var matched = candidates.FirstOrDefault(x => content.Contains(x.Code, StringComparison.OrdinalIgnoreCase));
            if (matched is null) return;

            if (matched.SepayTransactionId.HasValue) return;

            matched.SepayTransactionId = sepayTransactionId;
            matched.Status = matched.Amount == transferAmount ? DepositStatus.Completed : DepositStatus.Failed;
            matched.PaidAt = DateTime.Now;

            if (matched.Status == DepositStatus.Completed)
            {
                var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.UserId == matched.UserId, cancellationToken);
                if (wallet is null)
                {
                    wallet = new Entities.Wallet
                    {
                        UserId = matched.UserId,
                        Balance = 0m,
                    };
                    _db.Wallets.Add(wallet);
                }

                wallet.Balance += matched.Amount;
                var qrPath = matched.QrImagePath;
                matched.QrImagePath = null;
                DeleteQrImageFileByRelativePath(qrPath);
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        private Dictionary<string, (string Name, string ShortName)> LoadBankByBin()
        {
            try
            {
                var path = Path.Combine(_env.ContentRootPath, "Data", "Seed", "banks.json");
                if (!File.Exists(path)) return new Dictionary<string, (string Name, string ShortName)>();

                var json = File.ReadAllText(path);
                var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
                {
                    return new Dictionary<string, (string Name, string ShortName)>();
                }

                var result = new Dictionary<string, (string Name, string ShortName)>();
                foreach (var item in data.EnumerateArray())
                {
                    var bin = item.TryGetProperty("bin", out var binEl) ? binEl.GetString() : null;
                    if (string.IsNullOrWhiteSpace(bin)) continue;
                    var name = item.TryGetProperty("name", out var nameEl) ? nameEl.GetString() ?? string.Empty : string.Empty;
                    var shortName = item.TryGetProperty("short_name", out var shortEl) ? shortEl.GetString() ?? string.Empty : string.Empty;
                    result[bin] = (name, shortName);
                }

                return result;
            }
            catch
            {
                return new Dictionary<string, (string Name, string ShortName)>();
            }
        }

        public void DeleteFile(string fullPath)
        {
            var shouldDeleteFile = false;
            var relativePath = GetQrImageRelativePath(fullPath);
            if (!string.IsNullOrWhiteSpace(relativePath))
            {
                var pendingDeposit = _db.DepositHistories
                    .FirstOrDefault(x => x.QrImagePath == relativePath && x.Status == DepositStatus.Pending);

                if (pendingDeposit is null)
                {
                    return;
                }

                pendingDeposit.Status = DepositStatus.Expired;
                pendingDeposit.QrImagePath = null;
                _db.SaveChanges();
                shouldDeleteFile = true;
            }
            else
            {
                shouldDeleteFile = true;
            }

            if (shouldDeleteFile && File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        private void DeleteQrImageFileByRelativePath(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                return;
            }

            var fullPath = GetQrImageFullPath(relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        private string GetQrImageFullPath(string relativePath)
        {
            var webRoot = !string.IsNullOrWhiteSpace(_env.WebRootPath)
                ? _env.WebRootPath
                : Path.Combine(_env.ContentRootPath, "wwwroot");

            var normalized = relativePath.Replace('/', Path.DirectorySeparatorChar);
            return Path.Combine(webRoot, normalized);
        }

        private string? GetQrImageRelativePath(string fullPath)
        {
            var webRoot = !string.IsNullOrWhiteSpace(_env.WebRootPath)
                ? _env.WebRootPath
                : Path.Combine(_env.ContentRootPath, "wwwroot");

            if (!fullPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var relative = Path.GetRelativePath(webRoot, fullPath);
            return relative.Replace(Path.DirectorySeparatorChar, '/');
        }

        private static string BuildQrUrl(string acc, string bank, decimal amount, string description, string template, bool download)
        {
            var query = new Dictionary<string, string>
            {
                ["acc"] = acc,
                ["bank"] = bank,
                ["amount"] = decimal.Truncate(amount).ToString(),
                ["des"] = description,
                ["template"] = template,
                ["download"] = download ? "true" : "false",
            };

            var queryString = string.Join("&", query.Select(x => $"{Uri.EscapeDataString(x.Key)}={Uri.EscapeDataString(x.Value)}"));
            return $"https://qr.sepay.vn/img?{queryString}";
        }
    }
}

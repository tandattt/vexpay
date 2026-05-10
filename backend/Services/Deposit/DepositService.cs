using Hangfire;
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

        public DepositService(AppDbContext db, IHttpClientFactory httpClientFactory, IWebHostEnvironment env, IOptions<SepaySettings> sepay)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _env = env;
            _sepay = sepay.Value;
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

            BackgroundJob.Schedule(() => DeleteFile(fullPath), TimeSpan.FromMinutes(10));

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

        public async Task<IReadOnlyList<DepositHistoryResponse>> GetHistoryAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await _db.DepositHistories
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
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
                .Take(20)
                .ToListAsync(cancellationToken);
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

            DeleteQrImageByRelativePath(matched.QrImagePath);
            matched.QrImagePath = null;

            await _db.SaveChangesAsync(cancellationToken);
        }

        public void DeleteFile(string fullPath)
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        private void DeleteQrImageByRelativePath(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                return;
            }

            var webRoot = !string.IsNullOrWhiteSpace(_env.WebRootPath)
                ? _env.WebRootPath
                : Path.Combine(_env.ContentRootPath, "wwwroot");

            var normalized = relativePath.Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(webRoot, normalized);
            DeleteFile(fullPath);
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

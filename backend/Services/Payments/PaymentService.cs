using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VexPay.Base.Helpers;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Enums;
using VexPay.Exceptions;
using VexPay.Models.Requests.Payments;
using VexPay.Models.Response.Payments;
using VexPay.Settings;

namespace VexPay.Services.Payments
{
    public class PaymentService : IPaymentService
    {
        private const string TransferCodePrefix = "VP";
        private const decimal MinBankTransferAmount = 10000m;
        private const decimal MinWalletAmount = 1m;

        private readonly AppDbContext _db;
        private readonly ISepayQrService _qrService;
        private readonly IProjectWebhookDispatcher _webhookDispatcher;
        private readonly GlobalSettings _global;
        private readonly IHttpContextAccessor _httpContext;

        public PaymentService(
            AppDbContext db,
            ISepayQrService qrService,
            IProjectWebhookDispatcher webhookDispatcher,
            IOptions<GlobalSettings> global,
            IHttpContextAccessor httpContext)
        {
            _db = db;
            _qrService = qrService;
            _webhookDispatcher = webhookDispatcher;
            _global = global.Value;
            _httpContext = httpContext;
        }

        public async Task<PaymentIntentResponse> CreateAsync(string projectId, CreatePaymentRequest request, CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

            var method = request.Method ?? PaymentMethod.BankTransfer;
            var minAmount = method == PaymentMethod.Wallet ? MinWalletAmount : MinBankTransferAmount;
            if (request.Amount < minAmount)
            {
                throw new AppException($"Số tiền tối thiểu là {minAmount:N0} VND.", 400);
            }

            var amount = decimal.Round(request.Amount, 2);
            var merchantRef = string.IsNullOrWhiteSpace(request.MerchantRef) ? null : request.MerchantRef.Trim();
            var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

            if (merchantRef is not null)
            {
                var duplicate = await _db.PaymentIntents
                    .AnyAsync(x => x.ProjectId == projectId && x.MerchantRef == merchantRef, cancellationToken);
                if (duplicate)
                {
                    throw new AppException("merchant_ref đã tồn tại cho project này.", 409);
                }
            }

            var ttlSeconds = request.ExpiresInSeconds is > 0
                ? Math.Min(request.ExpiresInSeconds.Value, 60 * 60 * 24)
                : _global.QrImageExpirationMinutes * 60;

            var entity = new PaymentIntent
            {
                ProjectId = projectId,
                MerchantRef = merchantRef,
                Amount = amount,
                Currency = "VND",
                Status = PaymentIntentStatus.AwaitingTransfer,
                Method = method,
                Description = description,
                ExpiresAt = DateTime.Now.AddSeconds(ttlSeconds),
                TransferCode = await GenerateUniqueTransferCodeAsync(cancellationToken),
            };

            _db.PaymentIntents.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);

            if (method == PaymentMethod.BankTransfer)
            {
                var (relativePath, _, _) = await _qrService.GenerateAsync(
                    entity.TransferCode, amount, entity.TransferCode, cancellationToken);
                entity.QrImagePath = relativePath;
                await _db.SaveChangesAsync(cancellationToken);
            }

            ScheduleExpirationJob(entity);

            return MapToResponse(entity);
        }

        public async Task<PaymentIntentResponse> GetAsync(string projectId, string id, CancellationToken cancellationToken = default)
        {
            var entity = await _db.PaymentIntents
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, cancellationToken)
                ?? throw new AppException("Không tìm thấy payment.", 404);

            return MapToResponse(entity);
        }

        public async Task<PaymentIntentPagedResponse> ListAsync(string projectId, int page, int pageSize, PaymentIntentStatus? status = null, CancellationToken cancellationToken = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var baseQuery = _db.PaymentIntents
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId);

            if (status.HasValue)
            {
                baseQuery = baseQuery.Where(x => x.Status == status.Value);
            }

            var query = baseQuery.OrderByDescending(x => x.CreatedAt);

            var totalItems = await query.CountAsync(cancellationToken);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return new PaymentIntentPagedResponse
            {
                Items = items.Select(MapToResponse).ToList(),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }

        public async Task<byte[]> GetQrImageAsync(string projectId, string id, CancellationToken cancellationToken = default)
        {
            var path = await _db.PaymentIntents
                .AsNoTracking()
                .Where(x => x.Id == id && x.ProjectId == projectId && x.Status == PaymentIntentStatus.AwaitingTransfer)
                .Where(x => x.ExpiresAt == null || x.ExpiresAt > DateTime.Now)
                .Select(x => x.QrImagePath)
                .FirstOrDefaultAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(path))
            {
                throw new AppException("QR không tồn tại hoặc payment đã hoàn tất.", 404);
            }

            var fullPath = _qrService.GetFullPath(path);
            if (!File.Exists(fullPath))
            {
                throw new AppException("Ảnh QR không còn tồn tại.", 404);
            }

            return await File.ReadAllBytesAsync(fullPath, cancellationToken);
        }

        public async Task<PaymentIntentResponse> CancelAsync(string projectId, string id, CancellationToken cancellationToken = default)
        {
            var entity = await _db.PaymentIntents
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.ProjectId == projectId, cancellationToken)
                ?? throw new AppException("Không tìm thấy payment.", 404);

            var qrPath = entity.QrImagePath;
            var now = DateTime.Now;
            var cancelled = await _db.PaymentIntents
                .Where(x => x.Id == id
                    && x.ProjectId == projectId
                    && x.Status == PaymentIntentStatus.AwaitingTransfer
                    && (x.ExpiresAt == null || x.ExpiresAt > now))
                .ExecuteUpdateAsync(
                    s => s
                        .SetProperty(x => x.Status, PaymentIntentStatus.Cancelled)
                        .SetProperty(x => x.QrImagePath, (string?)null)
                        .SetProperty(x => x.UpdatedAt, now),
                    cancellationToken);

            if (cancelled == 0)
            {
                throw new AppException("Chỉ có thể hủy payment đang chờ thanh toán.", 409);
            }

            _qrService.DeleteRelative(qrPath);
            _webhookDispatcher.EnqueuePaymentEvent(id, PaymentWebhookEvents.Cancelled);

            return await GetAsync(projectId, id, cancellationToken);
        }

        public async Task ExpireIfStillAwaitingAsync(string paymentIntentId)
        {
            var entity = await _db.PaymentIntents.FirstOrDefaultAsync(x => x.Id == paymentIntentId);
            if (entity is null) return;
            if (entity.Status != PaymentIntentStatus.AwaitingTransfer) return;
            if (entity.ExpiresAt is not null && entity.ExpiresAt > DateTime.Now) return;

            var qrPath = entity.QrImagePath;
            entity.Status = PaymentIntentStatus.Expired;
            entity.QrImagePath = null;
            await _db.SaveChangesAsync();

            _qrService.DeleteRelative(qrPath);
            _webhookDispatcher.EnqueuePaymentEvent(entity.Id, PaymentWebhookEvents.Expired);
        }

        public async Task<ProjectPaymentStatsResponse> GetStatsAsync(string projectId, DateTime fromInclusive, DateTime toExclusive, CancellationToken cancellationToken = default)
        {
            var items = await _db.PaymentIntents
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId && x.CreatedAt >= fromInclusive && x.CreatedAt < toExclusive)
                .Select(x => new { x.Status, x.Amount, x.PaidAt, x.CreatedAt })
                .ToListAsync(cancellationToken);

            var paid = items.Where(x => x.Status == PaymentIntentStatus.Paid).ToList();
            var paidAmount = paid.Sum(x => x.Amount);
            var totalCreated = items.Count;

            var daily = paid
                .GroupBy(x => (x.PaidAt ?? x.CreatedAt).Date)
                .OrderBy(g => g.Key)
                .Select(g => new DailyPaymentBucket
                {
                    Date = g.Key,
                    Count = g.Count(),
                    Amount = g.Sum(x => x.Amount),
                })
                .ToList();

            return new ProjectPaymentStatsResponse
            {
                TotalIntents = totalCreated,
                PaidCount = paid.Count,
                FailedCount = items.Count(x => x.Status == PaymentIntentStatus.Failed),
                ExpiredCount = items.Count(x => x.Status == PaymentIntentStatus.Expired),
                CancelledCount = items.Count(x => x.Status == PaymentIntentStatus.Cancelled),
                AwaitingCount = items.Count(x => x.Status == PaymentIntentStatus.AwaitingTransfer),
                PaidAmount = paidAmount,
                AverageAmount = paid.Count == 0 ? 0 : decimal.Round(paidAmount / paid.Count, 2),
                SuccessRate = totalCreated == 0 ? 0 : Math.Round(paid.Count * 100.0 / totalCreated, 2),
                Daily = daily,
            };
        }

        public async Task<PaymentIntentPagedResponse> ListForUserAsync(
            string userId,
            string? projectId,
            int page,
            int pageSize,
            PaymentIntentStatus? status = null,
            CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                return await ListAsync(projectId, page, pageSize, status, cancellationToken);
            }

            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var baseQuery = _db.PaymentIntents
                .AsNoTracking()
                .Where(x => _db.Projects.Any(p => p.Id == x.ProjectId && p.UserId == userId));

            if (status.HasValue)
            {
                baseQuery = baseQuery.Where(x => x.Status == status.Value);
            }

            var query = baseQuery.OrderByDescending(x => x.CreatedAt);

            var totalItems = await query.CountAsync(cancellationToken);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return new PaymentIntentPagedResponse
            {
                Items = items.Select(MapToResponse).ToList(),
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }

        public async Task<ProjectPaymentStatsResponse> GetStatsForUserAsync(
            string userId,
            string? projectId,
            DateTime fromInclusive,
            DateTime toExclusive,
            CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                return await GetStatsAsync(projectId, fromInclusive, toExclusive, cancellationToken);
            }

            var items = await _db.PaymentIntents
                .AsNoTracking()
                .Where(x => x.CreatedAt >= fromInclusive && x.CreatedAt < toExclusive)
                .Where(x => _db.Projects.Any(p => p.Id == x.ProjectId && p.UserId == userId))
                .Select(x => new { x.Status, x.Amount, x.PaidAt, x.CreatedAt })
                .ToListAsync(cancellationToken);

            var paid = items.Where(x => x.Status == PaymentIntentStatus.Paid).ToList();
            var paidAmount = paid.Sum(x => x.Amount);
            var totalCreated = items.Count;

            var daily = paid
                .GroupBy(x => (x.PaidAt ?? x.CreatedAt).Date)
                .OrderBy(g => g.Key)
                .Select(g => new DailyPaymentBucket
                {
                    Date = g.Key,
                    Count = g.Count(),
                    Amount = g.Sum(x => x.Amount),
                })
                .ToList();

            return new ProjectPaymentStatsResponse
            {
                TotalIntents = totalCreated,
                PaidCount = paid.Count,
                FailedCount = items.Count(x => x.Status == PaymentIntentStatus.Failed),
                ExpiredCount = items.Count(x => x.Status == PaymentIntentStatus.Expired),
                CancelledCount = items.Count(x => x.Status == PaymentIntentStatus.Cancelled),
                AwaitingCount = items.Count(x => x.Status == PaymentIntentStatus.AwaitingTransfer),
                PaidAmount = paidAmount,
                AverageAmount = paid.Count == 0 ? 0 : decimal.Round(paidAmount / paid.Count, 2),
                SuccessRate = totalCreated == 0 ? 0 : Math.Round(paid.Count * 100.0 / totalCreated, 2),
                Daily = daily,
            };
        }

        private void ScheduleExpirationJob(PaymentIntent entity)
        {
            var expiresAt = entity.ExpiresAt ?? DateTime.Now.AddMinutes(_global.QrImageExpirationMinutes);
            var delay = expiresAt - DateTime.Now;
            if (delay < TimeSpan.Zero)
            {
                delay = TimeSpan.Zero;
            }

            BackgroundJob.Schedule<PaymentService>(
                service => service.ExpireIfStillAwaitingAsync(entity.Id),
                delay);
        }

        private async Task<string> GenerateUniqueTransferCodeAsync(CancellationToken cancellationToken)
        {
            for (var i = 0; i < 10; i++)
            {
                var code = TransferCodePrefix + CodeHelper.Generate(6);
                var exists = await _db.PaymentIntents.AnyAsync(x => x.TransferCode == code, cancellationToken);
                if (!exists) return code;
            }

            throw new AppException("Không thể tạo transfer code duy nhất, vui lòng thử lại.", 500);
        }

        private PaymentIntentResponse MapToResponse(PaymentIntent entity)
        {
            var isBank = entity.Method == PaymentMethod.BankTransfer;

            return new PaymentIntentResponse
            {
                Id = entity.Id,
                ProjectId = entity.ProjectId,
                MerchantRef = entity.MerchantRef,
                Amount = entity.Amount,
                Currency = entity.Currency,
                Status = entity.Status,
                Method = entity.Method,
                TransferCode = entity.TransferCode,
                Description = entity.Description,
                QrImageUrl = isBank && entity.QrImagePath is not null
                    ? BuildStaticAssetUrl(entity.QrImagePath)
                    : null,
                CheckoutUrl = isBank ? null : BuildCheckoutUrl(entity.Id),
                CreatedAt = entity.CreatedAt,
                PaidAt = entity.PaidAt,
                ExpiresAt = entity.ExpiresAt,
            };
        }

        private string BuildStaticAssetUrl(string relativePath)
        {
            var normalized = "/" + relativePath.Replace('\\', '/').TrimStart('/');
            var ctx = _httpContext.HttpContext;
            if (ctx is null)
            {
                return normalized;
            }

            return $"{ctx.Request.Scheme}://{ctx.Request.Host}{normalized}";
        }

        private string BuildCheckoutUrl(string paymentId)
        {
            var baseUrl = (_global.FrontendUrl ?? string.Empty).TrimEnd('/');
            if (string.IsNullOrEmpty(baseUrl))
            {
                baseUrl = "http://localhost:5173";
            }

            return $"{baseUrl}/pay/{paymentId}";
        }
    }
}

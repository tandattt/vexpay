using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Exceptions;
using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public class ProjectWebhookDeliveryService : IProjectWebhookDeliveryService
    {
        private readonly AppDbContext _db;

        public ProjectWebhookDeliveryService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<ProjectWebhookDeliveryPagedResponse> ListAsync(
            string userId,
            string projectId,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            await EnsureProjectOwnedAsync(userId, projectId, cancellationToken);

            var safePage = page <= 0 ? 1 : page;
            var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

            var query = _db.ProjectWebhookDeliveries
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId);

            var totalItems = await query.CountAsync(cancellationToken);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize);

            var items = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(x => new ProjectWebhookDeliveryItemResponse
                {
                    Id = x.Id,
                    PaymentIntentId = x.PaymentIntentId,
                    EventType = x.EventType,
                    Attempt = x.Attempt,
                    WebhookUrl = x.WebhookUrl,
                    HttpStatusCode = x.HttpStatusCode,
                    Success = x.Success,
                    ResponseBody = x.ResponseBody,
                    ErrorMessage = x.ErrorMessage,
                    CreatedAt = x.CreatedAt,
                    ProjectId = x.ProjectId,
                })
                .ToListAsync(cancellationToken);

            return new ProjectWebhookDeliveryPagedResponse
            {
                Items = items,
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }

        public async Task<ProjectWebhookDeliveryPagedResponse> ListForUserAsync(
            string userId,
            string? projectId,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                return await ListAsync(userId, projectId, page, pageSize, cancellationToken);
            }

            var safePage = page <= 0 ? 1 : page;
            var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

            var query = _db.ProjectWebhookDeliveries
                .AsNoTracking()
                .Where(x => x.Project != null && x.Project.UserId == userId);

            var totalItems = await query.CountAsync(cancellationToken);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize);

            var items = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(x => new ProjectWebhookDeliveryItemResponse
                {
                    Id = x.Id,
                    PaymentIntentId = x.PaymentIntentId,
                    EventType = x.EventType,
                    Attempt = x.Attempt,
                    WebhookUrl = x.WebhookUrl,
                    HttpStatusCode = x.HttpStatusCode,
                    Success = x.Success,
                    ResponseBody = x.ResponseBody,
                    ErrorMessage = x.ErrorMessage,
                    CreatedAt = x.CreatedAt,
                    ProjectId = x.ProjectId,
                    ProjectName = x.Project!.Name,
                })
                .ToListAsync(cancellationToken);

            return new ProjectWebhookDeliveryPagedResponse
            {
                Items = items,
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }

        public async Task RecordAsync(
            string projectId,
            string paymentIntentId,
            string eventType,
            int attempt,
            string webhookUrl,
            int? httpStatusCode,
            bool success,
            string? responseBody,
            string? errorMessage,
            CancellationToken cancellationToken = default)
        {
            _db.ProjectWebhookDeliveries.Add(new ProjectWebhookDelivery
            {
                ProjectId = projectId,
                PaymentIntentId = paymentIntentId,
                EventType = eventType,
                Attempt = attempt,
                WebhookUrl = webhookUrl,
                HttpStatusCode = httpStatusCode,
                Success = success,
                ResponseBody = Truncate(responseBody, 2000),
                ErrorMessage = Truncate(errorMessage, 512),
            });

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task EnsureProjectOwnedAsync(string userId, string projectId, CancellationToken cancellationToken)
        {
            var owned = await _db.Projects
                .AsNoTracking()
                .AnyAsync(x => x.Id == projectId && x.UserId == userId, cancellationToken);
            if (!owned)
            {
                throw new AppException("Không tìm thấy project.", 404);
            }
        }

        private static string? Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrEmpty(value)) return value;
            return value.Length <= maxLength ? value : value[..maxLength];
        }
    }
}

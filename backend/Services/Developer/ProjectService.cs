using Microsoft.EntityFrameworkCore;
using VexPay.Base.Helpers;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Exceptions;
using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _db;

        public ProjectService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<ProjectItemResponse>> GetByUserAsync(string userId, CancellationToken cancellationToken = default)
        {
            var projects = await _db.Projects
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            return projects.Select(MapToResponse).ToList();
        }

        public async Task<ProjectItemResponse> CreateAsync(string userId, string name, CancellationToken cancellationToken = default)
        {
            var normalizedName = name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(normalizedName)) throw new AppException("Tên project không hợp lệ.", 400);

            var userExists = await _db.Users.AnyAsync(x => x.Id == userId, cancellationToken);
            if (!userExists) throw new AppException("Không tìm thấy người dùng.", 404);

            var exists = await _db.Projects.AnyAsync(x => x.UserId == userId && x.Name == normalizedName, cancellationToken);
            if (exists) throw new AppException("Project đã tồn tại.", 400);

            var entity = new Project
            {
                UserId = userId,
                Name = normalizedName,
            };

            _db.Projects.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);

            return MapToResponse(entity);
        }

        public Task<bool> IsOwnedByAsync(string userId, string projectId, CancellationToken cancellationToken = default)
        {
            return _db.Projects
                .AsNoTracking()
                .AnyAsync(x => x.Id == projectId && x.UserId == userId, cancellationToken);
        }

        public async Task<ProjectItemResponse> UpdateWebhookAsync(
            string userId,
            string projectId,
            string? webhookUrl,
            bool webhookSecretEnabled,
            bool webhookRetryEnabled,
            string? webhookSecretKey,
            CancellationToken cancellationToken = default)
        {
            var entity = await _db.Projects
                .FirstOrDefaultAsync(x => x.Id == projectId && x.UserId == userId, cancellationToken);
            if (entity is null) throw new AppException("Không tìm thấy project.", 404);

            var normalizedUrl = webhookUrl?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedUrl))
            {
                entity.WebhookUrl = null;
            }
            else
            {
                if (!Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var uri)
                    || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
                {
                    throw new AppException("Webhook URL phải là http hoặc https hợp lệ.", 400);
                }

                entity.WebhookUrl = normalizedUrl;
            }

            entity.WebhookSecretEnabled = webhookSecretEnabled;
            entity.WebhookRetryEnabled = webhookRetryEnabled;

            var normalizedSecret = webhookSecretKey?.Trim();
            if (!string.IsNullOrWhiteSpace(normalizedSecret))
            {
                if (normalizedSecret.Length > 512)
                {
                    throw new AppException("Webhook secret key tối đa 512 ký tự.", 400);
                }

                entity.WebhookSecretKey = normalizedSecret;
                ApplySecretHints(entity, normalizedSecret);
            }
            else if (webhookSecretEnabled && string.IsNullOrEmpty(entity.WebhookSecretKey))
            {
                throw new AppException("Vui lòng nhập secret key khi bật xác thực webhook.", 400);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return MapToResponse(entity);
        }

        private static void ApplySecretHints(Project entity, string secret)
        {
            var hints = WebhookSecretHelper.ExtractHints(secret);
            entity.WebhookSecretPrefix = hints.Prefix;
            entity.WebhookSecretLast4 = hints.Last4;
        }

        private static ProjectItemResponse MapToResponse(Project entity) => new()
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Name = entity.Name,
            WebhookUrl = entity.WebhookUrl,
            WebhookSecretEnabled = entity.WebhookSecretEnabled,
            WebhookRetryEnabled = entity.WebhookRetryEnabled,
            WebhookSecretConfigured = !string.IsNullOrEmpty(entity.WebhookSecretKey),
            WebhookSecretMask = WebhookSecretHelper.BuildMask(
                entity.WebhookSecretPrefix,
                entity.WebhookSecretLast4,
                entity.WebhookSecretKey),
            CreatedAt = entity.CreatedAt,
        };
    }
}

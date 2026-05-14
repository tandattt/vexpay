using Microsoft.EntityFrameworkCore;
using VexPay.Base.Helpers;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Exceptions;
using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public class ProjectApiKeyService : IProjectApiKeyService
    {
        private readonly AppDbContext _db;

        public ProjectApiKeyService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<ProjectApiKeyResponse>> ListAsync(string userId, string projectId, CancellationToken cancellationToken = default)
        {
            await EnsureProjectOwnedAsync(userId, projectId, cancellationToken);

            return await _db.ProjectApiKeys
                .AsNoTracking()
                .Where(x => x.ProjectId == projectId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new ProjectApiKeyResponse
                {
                    Id = x.Id,
                    ProjectId = x.ProjectId,
                    KeyPrefix = x.KeyPrefix,
                    Last4 = x.KeyLast4,
                    Name = x.Name,
                    CreatedAt = x.CreatedAt,
                    RevokedAt = x.RevokedAt,
                    LastUsedAt = x.LastUsedAt,
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<IssueProjectApiKeyResponse> IssueAsync(string userId, string projectId, string? name, CancellationToken cancellationToken = default)
        {
            await EnsureProjectOwnedAsync(userId, projectId, cancellationToken);

            ApiKeyHelper.GeneratedKey generated;
            ProjectApiKey entity;

            while (true)
            {
                generated = ApiKeyHelper.Generate();
                var prefix = generated.PublicPrefix;
                var prefixTaken = await _db.ProjectApiKeys.AnyAsync(x => x.KeyPrefix == prefix, cancellationToken);
                if (prefixTaken) continue;

                entity = new ProjectApiKey
                {
                    ProjectId = projectId,
                    KeyPrefix = generated.PublicPrefix,
                    KeyLast4 = generated.Last4,
                    KeyHash = generated.Hash,
                    Name = string.IsNullOrWhiteSpace(name) ? null : name.Trim(),
                };

                _db.ProjectApiKeys.Add(entity);

                try
                {
                    await _db.SaveChangesAsync(cancellationToken);
                    break;
                }
                catch (DbUpdateException)
                {
                    _db.Entry(entity).State = EntityState.Detached;
                    var collision = await _db.ProjectApiKeys.AnyAsync(x => x.KeyPrefix == prefix, cancellationToken);
                    if (!collision) throw;
                }
            }

            return new IssueProjectApiKeyResponse
            {
                Id = entity.Id,
                ProjectId = entity.ProjectId,
                KeyPrefix = entity.KeyPrefix,
                Last4 = entity.KeyLast4,
                Name = entity.Name,
                CreatedAt = entity.CreatedAt,
                RevokedAt = entity.RevokedAt,
                LastUsedAt = entity.LastUsedAt,
                SecretKey = generated.Raw,
            };
        }

        public async Task RevokeAsync(string userId, string projectId, string keyId, CancellationToken cancellationToken = default)
        {
            await EnsureProjectOwnedAsync(userId, projectId, cancellationToken);

            var key = await _db.ProjectApiKeys
                .FirstOrDefaultAsync(x => x.Id == keyId && x.ProjectId == projectId, cancellationToken);

            if (key is null)
            {
                throw new AppException("Không tìm thấy API key.", 404);
            }

            if (key.RevokedAt is not null)
            {
                throw new AppException("API key đã bị thu hồi.", 400);
            }

            key.RevokedAt = DateTime.Now;
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<string?> ResolveProjectIdAsync(string rawKey, CancellationToken cancellationToken = default)
        {
            if (!ApiKeyHelper.TryExtractPublicPrefix(rawKey, out var publicPrefix))
            {
                return null;
            }

            var candidate = await _db.ProjectApiKeys
                .Where(x => x.KeyPrefix == publicPrefix && x.RevokedAt == null)
                .Select(x => new { x.Id, x.ProjectId, x.KeyHash })
                .FirstOrDefaultAsync(cancellationToken);

            if (candidate is null) return null;

            var incomingHash = ApiKeyHelper.ComputeHash(rawKey);
            if (!ApiKeyHelper.FixedTimeEquals(incomingHash, candidate.KeyHash))
            {
                return null;
            }

            var now = DateTime.Now;
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE project_api_keys SET last_used_at = {now} WHERE Id = {candidate.Id}");

            return candidate.ProjectId;
        }

        private async Task EnsureProjectOwnedAsync(string userId, string projectId, CancellationToken cancellationToken)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);
            ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

            var owned = await _db.Projects
                .AsNoTracking()
                .AnyAsync(x => x.Id == projectId && x.UserId == userId, cancellationToken);

            if (!owned)
            {
                throw new AppException("Không tìm thấy project.", 404);
            }
        }
    }
}

using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public interface IProjectApiKeyService
    {
        Task<IReadOnlyList<ProjectApiKeyResponse>> ListAsync(string userId, string projectId, CancellationToken cancellationToken = default);

        Task<IssueProjectApiKeyResponse> IssueAsync(string userId, string projectId, string? name, CancellationToken cancellationToken = default);

        Task RevokeAsync(string userId, string projectId, string keyId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns the project id when the raw key matches an active key. Updates LastUsedAt on hit.
        /// </summary>
        Task<string?> ResolveProjectIdAsync(string rawKey, CancellationToken cancellationToken = default);
    }
}

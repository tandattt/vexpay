using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public interface IProjectService
    {
        Task<IReadOnlyList<ProjectItemResponse>> GetByUserAsync(string userId, CancellationToken cancellationToken = default);
        Task<ProjectItemResponse> CreateAsync(string userId, string name, CancellationToken cancellationToken = default);
        Task<bool> IsOwnedByAsync(string userId, string projectId, CancellationToken cancellationToken = default);
        Task<ProjectItemResponse> UpdateWebhookAsync(
            string userId,
            string projectId,
            string? webhookUrl,
            bool webhookSecretEnabled,
            bool webhookRetryEnabled,
            string? webhookSecretKey,
            CancellationToken cancellationToken = default);
    }
}

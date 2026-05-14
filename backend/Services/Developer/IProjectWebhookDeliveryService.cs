using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public interface IProjectWebhookDeliveryService
    {
        Task<ProjectWebhookDeliveryPagedResponse> ListAsync(
            string userId,
            string projectId,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);

        Task<ProjectWebhookDeliveryPagedResponse> ListForUserAsync(
            string userId,
            string? projectId,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);

        Task RecordAsync(
            string projectId,
            string paymentIntentId,
            string eventType,
            int attempt,
            string webhookUrl,
            int? httpStatusCode,
            bool success,
            string? responseBody,
            string? errorMessage,
            CancellationToken cancellationToken = default);
    }
}

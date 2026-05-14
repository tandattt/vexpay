using VexPay.Enums;
using VexPay.Models.Requests.Payments;
using VexPay.Models.Response.Payments;

namespace VexPay.Services.Payments
{
    public interface IPaymentService
    {
        Task<PaymentIntentResponse> CreateAsync(string projectId, CreatePaymentRequest request, CancellationToken cancellationToken = default);

        Task<PaymentIntentResponse> GetAsync(string projectId, string id, CancellationToken cancellationToken = default);

        Task<PaymentIntentPagedResponse> ListAsync(string projectId, int page, int pageSize, PaymentIntentStatus? status = null, CancellationToken cancellationToken = default);

        Task<PaymentIntentPagedResponse> ListForUserAsync(
            string userId,
            string? projectId,
            int page,
            int pageSize,
            PaymentIntentStatus? status = null,
            CancellationToken cancellationToken = default);

        Task<byte[]> GetQrImageAsync(string projectId, string id, CancellationToken cancellationToken = default);

        Task<PaymentIntentResponse> CancelAsync(string projectId, string id, CancellationToken cancellationToken = default);

        /// <summary>Hangfire: đánh dấu hết hạn nếu vẫn đang chờ thanh toán.</summary>
        Task ExpireIfStillAwaitingAsync(string paymentIntentId);

        Task<ProjectPaymentStatsResponse> GetStatsAsync(string projectId, DateTime fromInclusive, DateTime toExclusive, CancellationToken cancellationToken = default);

        Task<ProjectPaymentStatsResponse> GetStatsForUserAsync(
            string userId,
            string? projectId,
            DateTime fromInclusive,
            DateTime toExclusive,
            CancellationToken cancellationToken = default);
    }
}

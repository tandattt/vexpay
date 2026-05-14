using VexPay.Models.Response.Payments;

namespace VexPay.Services.Payments
{
    public interface ICheckoutService
    {
        Task<CheckoutResponse> GetAsync(string paymentId, CancellationToken cancellationToken = default);

        Task<CheckoutResponse> EnsureBankQrAsync(string paymentId, CancellationToken cancellationToken = default);

        Task<CheckoutResponse> PayWithWalletAsync(string paymentId, string userId, CancellationToken cancellationToken = default);

        Task<CheckoutResponse> CancelAsync(string paymentId, CancellationToken cancellationToken = default);
    }
}

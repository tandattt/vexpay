using VexPay.Entities;

namespace VexPay.Services.Payments
{
    public interface IPaymentSettlementService
    {
        /// <summary>Ghi có số tiền giao dịch vào ví chủ dự án. Gọi trong transaction đang mở của caller.</summary>
        Task CreditDeveloperForPaymentAsync(PaymentIntent payment, CancellationToken cancellationToken = default);
    }
}

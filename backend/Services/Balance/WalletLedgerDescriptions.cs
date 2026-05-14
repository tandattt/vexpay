using VexPay.Entities;

namespace VexPay.Services.Balance
{
    internal static class WalletLedgerDescriptions
    {
        public static string ForPaymentDebit(PaymentIntent payment)
        {
            var order = string.IsNullOrWhiteSpace(payment.MerchantRef)
                ? payment.TransferCode
                : payment.MerchantRef;
            var project = payment.Project?.Name ?? "Merchant";
            return $"Thanh toán đơn {order} — {project}";
        }

        public static string ForPaymentCredit(PaymentIntent payment)
        {
            var order = string.IsNullOrWhiteSpace(payment.MerchantRef)
                ? payment.TransferCode
                : payment.MerchantRef;
            var project = payment.Project?.Name ?? "Dự án";
            return $"Nhận thanh toán đơn {order} — {project}";
        }

        public static string ForDeposit(string code) => $"Nạp tiền vào ví — {code}";
    }
}

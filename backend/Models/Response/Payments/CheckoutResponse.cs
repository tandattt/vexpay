using VexPay.Enums;

namespace VexPay.Models.Response.Payments
{
    public class CheckoutResponse
    {
        public string Id { get; set; } = string.Empty;

        public string ProjectName { get; set; } = string.Empty;

        public string? MerchantRef { get; set; }

        public string? Description { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "VND";

        public PaymentIntentStatus Status { get; set; }

        public PaymentMethod Method { get; set; }

        public string TransferCode { get; set; } = string.Empty;

        /// <summary>URL ảnh QR tĩnh (png) — có sau khi tạo hoặc bật tab chuyển khoản.</summary>
        public string? QrImageUrl { get; set; }

        public string? BankAccountName { get; set; }

        public string? BankAccountNumber { get; set; }

        public string? BankCode { get; set; }

        public string? BankName { get; set; }

        public string? BankIconUrl { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}

using VexPay.Enums;

namespace VexPay.Models.Response.Payments
{
    public class PaymentIntentResponse
    {
        public string Id { get; set; } = string.Empty;

        public string ProjectId { get; set; } = string.Empty;

        public string? MerchantRef { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "VND";

        public PaymentIntentStatus Status { get; set; }

        public PaymentMethod Method { get; set; }

        public string TransferCode { get; set; } = string.Empty;

        public string? Description { get; set; }

        /// <summary>
        /// BankTransfer: URL ảnh QR PNG tĩnh (hiển thị trực tiếp, không cần gọi /qr).
        /// Wallet: null — dùng checkout_url.
        /// </summary>
        public string? QrImageUrl { get; set; }

        /// <summary>
        /// Wallet: URL trang checkout VexPay để redirect khách hàng.
        /// BankTransfer: null.
        /// </summary>
        public string? CheckoutUrl { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? PaidAt { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }

    public class PaymentIntentPagedResponse
    {
        public IReadOnlyList<PaymentIntentResponse> Items { get; set; } = Array.Empty<PaymentIntentResponse>();

        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalItems { get; set; }

        public int TotalPages { get; set; }
    }
}

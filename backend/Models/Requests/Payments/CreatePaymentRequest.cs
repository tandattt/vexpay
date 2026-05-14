using System.ComponentModel.DataAnnotations;
using VexPay.Enums;

namespace VexPay.Models.Requests.Payments
{
    /// <summary>
    /// Yêu cầu tạo payment intent.
    /// </summary>
    public class CreatePaymentRequest
    {
        /// <summary>
        /// Số tiền thanh toán (VND). Chuyển khoản tối thiểu 10.000; ví tối thiểu 1.
        /// </summary>
        /// <example>50000</example>
        [Required]
        [Range(1, double.MaxValue)]
        public decimal Amount { get; set; }

        /// <summary>
        /// Phương thức thanh toán: <c>0</c> = BankTransfer (chuyển khoản ngân hàng), <c>1</c> = Wallet (số dư ví).
        /// Bỏ trống hoặc <c>0</c> nếu dùng chuyển khoản.
        /// </summary>
        /// <example>0</example>
        public PaymentMethod? Method { get; set; }

        /// <summary>
        /// Mã tham chiếu phía merchant (tùy chọn, duy nhất trong dự án).
        /// </summary>
        /// <example>ORDER-2026-001</example>
        public string? MerchantRef { get; set; }

        /// <summary>
        /// Mô tả hiển thị trên nội dung chuyển khoản.
        /// </summary>
        /// <example>Thanh toán đơn hàng #001</example>
        public string? Description { get; set; }

        /// <summary>
        /// Thời gian hết hạn (giây). Mặc định 900 (15 phút).
        /// </summary>
        /// <example>900</example>
        [Range(60, 86400)]
        public int? ExpiresInSeconds { get; set; }
    }
}

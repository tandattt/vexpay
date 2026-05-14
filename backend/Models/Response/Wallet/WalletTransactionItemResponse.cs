using VexPay.Enums;

namespace VexPay.Models.Response.Wallet
{
    public class WalletTransactionItemResponse
    {
        public string Id { get; set; } = string.Empty;

        public WalletTransactionDirection Direction { get; set; }

        public WalletTransactionType Type { get; set; }

        public decimal Amount { get; set; }

        public string ReferenceId { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        /// <summary>Chỉ có khi dòng lấy từ lịch sử nạp chưa ghi sổ (pending/failed/...).</summary>
        public DepositStatus? DepositStatus { get; set; }
    }
}

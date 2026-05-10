using VexPay.Enums;

namespace VexPay.Models.Response.Deposit
{
    public class DepositHistoryResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DepositStatus Status { get; set; }
        public DepositMethod Method { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}

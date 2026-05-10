using VexPay.Enums;

namespace VexPay.Models.Response.Deposit
{
    public class CreateDepositQrResponse
    {
        public string DepositCode { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DepositStatus Status { get; set; }
    }
}

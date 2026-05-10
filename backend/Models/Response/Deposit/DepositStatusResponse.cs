using VexPay.Enums;

namespace VexPay.Models.Response.Deposit
{
    public class DepositStatusResponse
    {
        public string Code { get; set; } = string.Empty;
        public DepositStatus Status { get; set; }
    }
}

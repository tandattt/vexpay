namespace VexPay.Models.Response.Deposit
{
    public class DepositQrConfigResponse
    {
        public string AccountName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string BankCode { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string BankShortName { get; set; } = string.Empty;
        public string BankIconUrl { get; set; } = string.Empty;
        public int QrImageExpirationMinutes { get; set; }
    }
}

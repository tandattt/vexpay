namespace VexPay.Settings
{
    public class SepaySettings
    {
        public string MerchantId { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = "761234569999";
        public string BankCode { get; set; } = "970422";
        public string QrTemplate { get; set; } = "qronly";
    }
}

namespace VexPay.Models.Response.Wallet
{
    public class WalletBalanceResponse
    {
        public string WalletId { get; set; } = string.Empty;

        public decimal Balance { get; set; }
    }
}

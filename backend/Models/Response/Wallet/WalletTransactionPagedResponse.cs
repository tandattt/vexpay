namespace VexPay.Models.Response.Wallet
{
    public class WalletTransactionPagedResponse
    {
        public IReadOnlyList<WalletTransactionItemResponse> Items { get; set; } = Array.Empty<WalletTransactionItemResponse>();

        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalItems { get; set; }

        public int TotalPages { get; set; }
    }
}

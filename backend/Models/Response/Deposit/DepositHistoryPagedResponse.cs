namespace VexPay.Models.Response.Deposit
{
    public class DepositHistoryPagedResponse
    {
        public IReadOnlyList<DepositHistoryResponse> Items { get; set; } = Array.Empty<DepositHistoryResponse>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
    }
}

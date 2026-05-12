namespace VexPay.Models.Response.Admin
{
    public class AdminSummaryResponse
    {
        public int TotalUsers { get; set; }
        public int TotalDeposits { get; set; }
        public decimal TotalDepositAmount { get; set; }
        public int PendingDeposits { get; set; }
        public int PendingDeveloperRequests { get; set; }
    }
}

namespace VexPay.Models.Response.Payments
{
    public class ProjectPaymentStatsResponse
    {
        public int TotalIntents { get; set; }
        public int PaidCount { get; set; }
        public int FailedCount { get; set; }
        public int ExpiredCount { get; set; }
        public int CancelledCount { get; set; }
        public int AwaitingCount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal AverageAmount { get; set; }
        public double SuccessRate { get; set; }
        public IReadOnlyList<DailyPaymentBucket> Daily { get; set; } = Array.Empty<DailyPaymentBucket>();
    }

    public class DailyPaymentBucket
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public decimal Amount { get; set; }
    }
}

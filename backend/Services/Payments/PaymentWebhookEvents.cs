namespace VexPay.Services.Payments
{
    public static class PaymentWebhookEvents
    {
        public const string Paid = "payment_paid";
        public const string Failed = "payment_failed";
        public const string Expired = "payment_expired";
        public const string Cancelled = "payment_cancelled";
    }
}

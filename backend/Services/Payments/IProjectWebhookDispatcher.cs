namespace VexPay.Services.Payments
{
    public interface IProjectWebhookDispatcher
    {
        void EnqueuePaymentEvent(string paymentIntentId, string eventType);
    }
}

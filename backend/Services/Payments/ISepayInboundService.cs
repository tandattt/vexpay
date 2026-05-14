namespace VexPay.Services.Payments
{
    public interface ISepayInboundService
    {
        Task HandleAsync(SepayInboundNotification notification, CancellationToken cancellationToken = default);
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Enums;
using VexPay.Services.Deposit;

namespace VexPay.Services.Payments
{
    public class SepayInboundService : ISepayInboundService
    {
        private readonly AppDbContext _db;
        private readonly ISepayQrService _qrService;
        private readonly IProjectWebhookDispatcher _webhookDispatcher;
        private readonly IPaymentSettlementService _settlementService;
        private readonly IDepositService _depositService;
        private readonly ILogger<SepayInboundService> _logger;

        public SepayInboundService(
            AppDbContext db,
            ISepayQrService qrService,
            IProjectWebhookDispatcher webhookDispatcher,
            IPaymentSettlementService settlementService,
            IDepositService depositService,
            ILogger<SepayInboundService> logger)
        {
            _db = db;
            _qrService = qrService;
            _webhookDispatcher = webhookDispatcher;
            _settlementService = settlementService;
            _depositService = depositService;
            _logger = logger;
        }

        public async Task HandleAsync(SepayInboundNotification notification, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(notification.SearchText) && string.IsNullOrWhiteSpace(notification.Code))
            {
                _logger.LogWarning(
                    "SePay inbound ignored: empty content/code (tx={TxId})",
                    notification.TransactionId);
                return;
            }

            if (await TryReconcilePaymentAsync(notification, cancellationToken))
            {
                return;
            }

            await _depositService.MarkPaidFromSepayAsync(notification, cancellationToken);

            _logger.LogInformation(
                "SePay inbound finished without payment match (tx={TxId}, amount={Amount}, code={Code}, search={Search})",
                notification.TransactionId,
                notification.TransferAmount,
                notification.Code,
                notification.SearchText);
        }

        private async Task<bool> TryReconcilePaymentAsync(
            SepayInboundNotification notification,
            CancellationToken cancellationToken)
        {
            var candidates = await _db.PaymentIntents
                .Include(x => x.Project)
                .Where(x => x.Status == PaymentIntentStatus.AwaitingTransfer)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            var matched = candidates.FirstOrDefault(x =>
                SepayTransferMatcher.MatchesTransferCode(x.TransferCode, notification));
            if (matched is null)
            {
                return false;
            }

            if (matched.SepayTransactionId.HasValue)
            {
                _logger.LogInformation(
                    "Payment already reconciled: id={Id}, sepayTx={TxId}",
                    matched.Id,
                    notification.TransactionId);
                return true;
            }

            await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                matched.SepayTransactionId = notification.TransactionId;
                var isPaid = matched.Amount == notification.TransferAmount;
                matched.Status = isPaid ? PaymentIntentStatus.Paid : PaymentIntentStatus.Failed;
                matched.PaidAt = DateTime.Now;

                if (isPaid)
                {
                    await _settlementService.CreditDeveloperForPaymentAsync(matched, cancellationToken);
                }

                var qrPath = matched.QrImagePath;
                matched.QrImagePath = null;

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _qrService.DeleteRelative(qrPath);

                var eventType = matched.Status == PaymentIntentStatus.Paid
                    ? PaymentWebhookEvents.Paid
                    : PaymentWebhookEvents.Failed;
                _webhookDispatcher.EnqueuePaymentEvent(matched.Id, eventType);

                _logger.LogInformation(
                    "Payment reconciled: id={Id}, transferCode={TransferCode}, status={Status}, expected={Expected}, transfer={Transfer}, sepayCode={SepayCode}",
                    matched.Id,
                    matched.TransferCode,
                    matched.Status,
                    matched.Amount,
                    notification.TransferAmount,
                    notification.Code);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }

            return true;
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Enums;
using VexPay.Exceptions;
using VexPay.Models.Response.Payments;
using VexPay.Services.Balance;
using VexPay.Services.Deposit;
using VexPay.Settings;

namespace VexPay.Services.Payments
{
    public class CheckoutService : ICheckoutService
    {
        private readonly AppDbContext _db;
        private readonly ISepayQrService _qrService;
        private readonly IBalanceService _balanceService;
        private readonly IProjectWebhookDispatcher _webhookDispatcher;
        private readonly IPaymentSettlementService _settlementService;
        private readonly IDepositService _depositService;
        private readonly SepaySettings _sepay;
        private readonly IHttpContextAccessor _httpContext;

        public CheckoutService(
            AppDbContext db,
            ISepayQrService qrService,
            IBalanceService balanceService,
            IProjectWebhookDispatcher webhookDispatcher,
            IPaymentSettlementService settlementService,
            IDepositService depositService,
            IOptions<SepaySettings> sepay,
            IHttpContextAccessor httpContext)
        {
            _db = db;
            _qrService = qrService;
            _balanceService = balanceService;
            _webhookDispatcher = webhookDispatcher;
            _settlementService = settlementService;
            _depositService = depositService;
            _sepay = sepay.Value;
            _httpContext = httpContext;
        }

        public async Task<CheckoutResponse> GetAsync(string paymentId, CancellationToken cancellationToken = default)
        {
            var payment = await LoadPaymentAsync(paymentId, asNoTracking: true, cancellationToken);
            return MapCheckout(payment);
        }

        public async Task<CheckoutResponse> EnsureBankQrAsync(string paymentId, CancellationToken cancellationToken = default)
        {
            var payment = await LoadPaymentAsync(paymentId, asNoTracking: false, cancellationToken);
            EnsureAwaiting(payment);

            if (string.IsNullOrWhiteSpace(payment.QrImagePath))
            {
                var (relativePath, _, _) = await _qrService.GenerateAsync(
                    payment.TransferCode,
                    payment.Amount,
                    payment.TransferCode,
                    cancellationToken);
                payment.QrImagePath = relativePath;
                await _db.SaveChangesAsync(cancellationToken);
            }

            return MapCheckout(payment);
        }

        public async Task<CheckoutResponse> PayWithWalletAsync(string paymentId, string userId, CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);

            PaymentIntent payment;
            await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                payment = await LoadPaymentAsync(paymentId, asNoTracking: false, cancellationToken);
                EnsureAwaiting(payment);

                var now = DateTime.Now;
                var claimed = await _db.PaymentIntents
                    .Where(x => x.Id == paymentId
                        && x.Status == PaymentIntentStatus.AwaitingTransfer
                        && (x.ExpiresAt == null || x.ExpiresAt > now))
                    .ExecuteUpdateAsync(
                        s => s
                            .SetProperty(x => x.Status, PaymentIntentStatus.Paid)
                            .SetProperty(x => x.PaidAt, now)
                            .SetProperty(x => x.UpdatedAt, now),
                        cancellationToken);

                if (claimed == 0)
                {
                    throw new AppException("Giao dịch không còn ở trạng thái chờ thanh toán.", 400);
                }

                await _db.Entry(payment).ReloadAsync(cancellationToken);

                await _balanceService.DebitAsync(
                    userId,
                    payment.Amount,
                    new WalletLedgerEntry(
                        WalletTransactionType.PaymentDebit,
                        payment.Id,
                        WalletLedgerDescriptions.ForPaymentDebit(payment)),
                    cancellationToken);
                await _settlementService.CreditDeveloperForPaymentAsync(payment, cancellationToken);

                var qrPath = payment.QrImagePath;
                payment.QrImagePath = null;

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _qrService.DeleteRelative(qrPath);
                _webhookDispatcher.EnqueuePaymentEvent(payment.Id, PaymentWebhookEvents.Paid);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }

            return MapCheckout(payment);
        }

        public async Task<CheckoutResponse> CancelAsync(string paymentId, CancellationToken cancellationToken = default)
        {
            var payment = await LoadPaymentAsync(paymentId, asNoTracking: false, cancellationToken);
            EnsureAwaiting(payment);

            var qrPath = payment.QrImagePath;
            payment.Status = PaymentIntentStatus.Cancelled;
            payment.QrImagePath = null;
            await _db.SaveChangesAsync(cancellationToken);

            _qrService.DeleteRelative(qrPath);
            _webhookDispatcher.EnqueuePaymentEvent(payment.Id, PaymentWebhookEvents.Cancelled);

            return MapCheckout(payment);
        }

        private async Task<PaymentIntent> LoadPaymentAsync(
            string paymentId,
            bool asNoTracking,
            CancellationToken cancellationToken)
        {
            var query = _db.PaymentIntents
                .Include(x => x.Project)
                .AsQueryable();

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(x => x.Id == paymentId, cancellationToken)
                ?? throw new AppException("Không tìm thấy giao dịch thanh toán.", 404);
        }

        private static void EnsureAwaiting(PaymentIntent payment)
        {
            if (payment.Status != PaymentIntentStatus.AwaitingTransfer)
            {
                throw new AppException("Giao dịch không còn ở trạng thái chờ thanh toán.", 400);
            }

            if (payment.ExpiresAt is not null && payment.ExpiresAt <= DateTime.Now)
            {
                throw new AppException("Giao dịch đã hết hạn.", 400);
            }
        }

        private CheckoutResponse MapCheckout(PaymentIntent payment)
        {
            var bank = _depositService.GetQrConfig();
            return new CheckoutResponse
            {
                Id = payment.Id,
                ProjectName = payment.Project?.Name ?? "VexPay",
                MerchantRef = payment.MerchantRef,
                Description = payment.Description,
                Amount = payment.Amount,
                Currency = payment.Currency,
                Status = payment.Status,
                Method = payment.Method,
                TransferCode = payment.TransferCode,
                QrImageUrl = payment.QrImagePath is null ? null : BuildStaticAssetUrl(payment.QrImagePath),
                BankAccountName = bank.AccountName,
                BankAccountNumber = bank.AccountNumber,
                BankCode = bank.BankCode,
                BankName = bank.BankName,
                BankIconUrl = bank.BankIconUrl,
                ExpiresAt = payment.ExpiresAt,
                CreatedAt = payment.CreatedAt,
            };
        }

        private string BuildStaticAssetUrl(string relativePath)
        {
            var normalized = "/" + relativePath.Replace('\\', '/').TrimStart('/');
            var ctx = _httpContext.HttpContext;
            if (ctx is null)
            {
                return normalized;
            }

            return $"{ctx.Request.Scheme}://{ctx.Request.Host}{normalized}";
        }
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Exceptions;
using VexPay.Enums;
using VexPay.Services.Balance;

namespace VexPay.Services.Payments
{
    public class PaymentSettlementService : IPaymentSettlementService
    {
        private readonly AppDbContext _db;
        private readonly IBalanceService _balanceService;

        public PaymentSettlementService(AppDbContext db, IBalanceService balanceService)
        {
            _db = db;
            _balanceService = balanceService;
        }

        public async Task CreditDeveloperForPaymentAsync(
            PaymentIntent payment,
            CancellationToken cancellationToken = default)
        {
            var developerId = payment.Project?.UserId;
            if (string.IsNullOrWhiteSpace(developerId))
            {
                developerId = await _db.Projects
                    .AsNoTracking()
                    .Where(p => p.Id == payment.ProjectId)
                    .Select(p => p.UserId)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (string.IsNullOrWhiteSpace(developerId))
            {
                throw new AppException("Không tìm thấy chủ dự án để ghi có số dư.", 500);
            }

            await _balanceService.CreditAsync(
                developerId,
                payment.Amount,
                new WalletLedgerEntry(
                    WalletTransactionType.PaymentCredit,
                    payment.Id,
                    WalletLedgerDescriptions.ForPaymentCredit(payment)),
                cancellationToken);
        }
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Enums;
using VexPay.Models.Response.Wallet;
using VexPay.Services.Balance;

namespace VexPay.Services.Wallet
{
    public class WalletService : IWalletService
    {
        private readonly AppDbContext _db;
        private readonly IBalanceService _balanceService;

        public WalletService(AppDbContext db, IBalanceService balanceService)
        {
            _db = db;
            _balanceService = balanceService;
        }

        public async Task<WalletBalanceResponse> GetMyBalanceAsync(string userId, CancellationToken cancellationToken = default)
        {
            await _balanceService.EnsureWalletAsync(userId, cancellationToken);

            var wallet = await _db.Wallets
                .AsNoTracking()
                .FirstAsync(w => w.UserId == userId, cancellationToken);

            return new WalletBalanceResponse
            {
                WalletId = wallet.Id,
                Balance = wallet.Balance,
            };
        }

        public async Task<WalletTransactionPagedResponse> GetTransactionsAsync(
            string userId,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var safePage = page <= 0 ? 1 : page;
            var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

            var creditedDepositIds = _db.WalletTransactions
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.Type == WalletTransactionType.Deposit)
                .Select(x => x.ReferenceId);

            var ledgerQuery = _db.WalletTransactions
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new WalletTransactionItemResponse
                {
                    Id = x.Id,
                    Direction = x.Direction,
                    Type = x.Type,
                    Amount = x.Amount,
                    ReferenceId = x.ReferenceId,
                    Description = x.Description,
                    CreatedAt = x.CreatedAt,
                    DepositStatus = null,
                });

            var openDepositQuery = _db.DepositHistories
                .AsNoTracking()
                .Where(x => x.UserId == userId && !creditedDepositIds.Contains(x.Id))
                .Select(x => new WalletTransactionItemResponse
                {
                    Id = x.Id,
                    Direction = WalletTransactionDirection.Credit,
                    Type = WalletTransactionType.Deposit,
                    Amount = x.Amount,
                    ReferenceId = x.Id,
                    Description = "Nạp tiền vào ví — " + x.Code,
                    CreatedAt = x.PaidAt ?? x.CreatedAt,
                    DepositStatus = x.Status,
                });

            var unified = ledgerQuery.Concat(openDepositQuery);

            var totalItems = await unified.CountAsync(cancellationToken);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)safePageSize);

            var items = await unified
                .OrderByDescending(x => x.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .ToListAsync(cancellationToken);

            return new WalletTransactionPagedResponse
            {
                Items = items,
                Page = safePage,
                PageSize = safePageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }
    }
}

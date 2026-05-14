using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Enums;
using VexPay.Exceptions;

namespace VexPay.Services.Balance
{
    public class BalanceService : IBalanceService
    {
        private readonly AppDbContext _db;

        public BalanceService(AppDbContext db)
        {
            _db = db;
        }

        public async Task EnsureWalletAsync(string userId, CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);

            var now = DateTime.Now;
            var walletId = Guid.NewGuid().ToString();

            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"""
                INSERT INTO wallets (Id, user_id, balance, created_at, updated_at)
                VALUES ({walletId}, {userId}, 0, {now}, {now})
                ON DUPLICATE KEY UPDATE updated_at = {now}
                """);
        }

        public async Task<decimal> GetBalanceAsync(string userId, CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);

            await EnsureWalletAsync(userId, cancellationToken);

            var balance = await _db.Wallets
                .AsNoTracking()
                .Where(w => w.UserId == userId)
                .Select(w => w.Balance)
                .FirstAsync(cancellationToken);

            return balance;
        }

        public async Task<decimal> CreditAsync(
            string userId,
            decimal amount,
            WalletLedgerEntry? ledger = null,
            CancellationToken cancellationToken = default)
        {
            ValidateAmount(amount);
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);

            return await RunAtomicAsync(userId, async ct =>
            {
                var now = DateTime.Now;
                var rows = await _db.Database.ExecuteSqlInterpolatedAsync(
                    $"""
                    UPDATE wallets
                    SET balance = balance + {amount}, updated_at = {now}
                    WHERE user_id = {userId}
                    """);

                if (rows == 0)
                {
                    await EnsureWalletAsync(userId, ct);
                    rows = await _db.Database.ExecuteSqlInterpolatedAsync(
                        $"""
                        UPDATE wallets
                        SET balance = balance + {amount}, updated_at = {now}
                        WHERE user_id = {userId}
                        """);

                    if (rows == 0)
                    {
                        throw new AppException("Không thể cập nhật số dư ví.", 500);
                    }
                }

                await AppendLedgerAsync(userId, WalletTransactionDirection.Credit, amount, ledger, ct);
                return await ReadBalanceAsync(userId, ct);
            }, cancellationToken);
        }

        public async Task<decimal> DebitAsync(
            string userId,
            decimal amount,
            WalletLedgerEntry? ledger = null,
            CancellationToken cancellationToken = default)
        {
            ValidateAmount(amount);
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);

            return await RunAtomicAsync(userId, async ct =>
            {
                var now = DateTime.Now;
                var rows = await _db.Database.ExecuteSqlInterpolatedAsync(
                    $"""
                    UPDATE wallets
                    SET balance = balance - {amount}, updated_at = {now}
                    WHERE user_id = {userId} AND balance >= {amount}
                    """);

                if (rows == 0)
                {
                    throw new AppException("Số dư không đủ.", 400);
                }

                await AppendLedgerAsync(userId, WalletTransactionDirection.Debit, amount, ledger, ct);
                return await ReadBalanceAsync(userId, ct);
            }, cancellationToken);
        }

        private async Task<decimal> ReadBalanceAsync(string userId, CancellationToken cancellationToken)
        {
            return await _db.Wallets
                .AsNoTracking()
                .Where(w => w.UserId == userId)
                .Select(w => w.Balance)
                .FirstAsync(cancellationToken);
        }

        private static void ValidateAmount(decimal amount)
        {
            if (amount <= 0)
            {
                throw new AppException("Số tiền phải lớn hơn 0.", 400);
            }
        }

        private async Task AppendLedgerAsync(
            string userId,
            WalletTransactionDirection direction,
            decimal amount,
            WalletLedgerEntry? ledger,
            CancellationToken cancellationToken)
        {
            if (ledger is null)
            {
                return;
            }

            var now = DateTime.Now;
            _db.WalletTransactions.Add(new WalletTransaction
            {
                UserId = userId,
                Direction = direction,
                Type = ledger.Type,
                Amount = amount,
                ReferenceId = ledger.ReferenceId,
                Description = ledger.Description,
                CreatedAt = now,
                UpdatedAt = now,
            });

            if (_db.Database.CurrentTransaction is null)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task<decimal> RunAtomicAsync(
            string userId,
            Func<CancellationToken, Task<decimal>> action,
            CancellationToken cancellationToken)
        {
            if (_db.Database.CurrentTransaction is not null)
            {
                return await action(cancellationToken);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var balance = await action(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return balance;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }
}

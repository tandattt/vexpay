namespace VexPay.Services.Balance
{
    /// <summary>
    /// Shared service for wallet balance mutations. All credit/debit paths must go through here
    /// so updates stay atomic under concurrency.
    /// </summary>
    public interface IBalanceService
    {
        Task EnsureWalletAsync(string userId, CancellationToken cancellationToken = default);

        Task<decimal> GetBalanceAsync(string userId, CancellationToken cancellationToken = default);

        Task<decimal> CreditAsync(
            string userId,
            decimal amount,
            WalletLedgerEntry? ledger = null,
            CancellationToken cancellationToken = default);

        Task<decimal> DebitAsync(
            string userId,
            decimal amount,
            WalletLedgerEntry? ledger = null,
            CancellationToken cancellationToken = default);
    }
}

using VexPay.Models.Response.Wallet;

namespace VexPay.Services.Wallet
{
    public interface IWalletService
    {
        Task<WalletBalanceResponse> GetMyBalanceAsync(string userId, CancellationToken cancellationToken = default);

        Task<WalletTransactionPagedResponse> GetTransactionsAsync(
            string userId,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);
    }
}

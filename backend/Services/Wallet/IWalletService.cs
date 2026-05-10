using VexPay.Models.Response.Wallet;

namespace VexPay.Services.Wallet
{
    public interface IWalletService
    {
        Task<WalletBalanceResponse> GetMyBalanceAsync(string userId, CancellationToken cancellationToken = default);
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Models.Response.Wallet;

namespace VexPay.Services.Wallet
{
    public class WalletService : IWalletService
    {
        private readonly AppDbContext _db;

        public WalletService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<WalletBalanceResponse> GetMyBalanceAsync(string userId, CancellationToken cancellationToken = default)
        {
            var wallet = await _db.Wallets
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

            if (wallet is null)
            {
                wallet = new Entities.Wallet
                {
                    UserId = userId,
                    Balance = 0m,
                };
                _db.Wallets.Add(wallet);
                await _db.SaveChangesAsync(cancellationToken);
            }

            return new WalletBalanceResponse
            {
                WalletId = wallet.Id,
                Balance = wallet.Balance,
            };
        }
    }
}

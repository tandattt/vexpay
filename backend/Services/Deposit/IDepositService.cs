using VexPay.Enums;
using VexPay.Models.Response.Deposit;

namespace VexPay.Services.Deposit
{
    public interface IDepositService
    {
        Task<(CreateDepositQrResponse Response, byte[] ImageBytes)> CreateQrAsync(string userId, decimal amount, CancellationToken cancellationToken = default);
        Task<DepositStatus> GetStatusAsync(string userId, string code, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DepositHistoryResponse>> GetHistoryAsync(string userId, CancellationToken cancellationToken = default);
        Task MarkPaidFromSepayAsync(long sepayTransactionId, string content, long transferAmount, CancellationToken cancellationToken = default);
    }
}

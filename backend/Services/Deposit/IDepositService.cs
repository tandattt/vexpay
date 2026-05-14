using VexPay.Enums;
using VexPay.Models.Response.Deposit;
using VexPay.Services.Payments;

namespace VexPay.Services.Deposit
{
    public interface IDepositService
    {
        DepositQrConfigResponse GetQrConfig();
        Task<(CreateDepositQrResponse Response, byte[] ImageBytes)> CreateQrAsync(string userId, decimal amount, CancellationToken cancellationToken = default);
        Task<DepositStatus> GetStatusAsync(string userId, string code, CancellationToken cancellationToken = default);
        Task<DepositHistoryPagedResponse> GetHistoryAsync(string userId, int page = 1, int pageSize = 5, CancellationToken cancellationToken = default);
        Task<byte[]> GetQrImageByCodeAsync(string userId, string code, CancellationToken cancellationToken = default);
        Task CancelAsync(string userId, string code, CancellationToken cancellationToken = default);
        Task MarkPaidFromSepayAsync(SepayInboundNotification notification, CancellationToken cancellationToken = default);
    }
}

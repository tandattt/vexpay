using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public interface IDeveloperRequestService
    {
        Task<DeveloperRequestStatusResponse> GetStatusAsync(string userId, CancellationToken cancellationToken = default);
        Task<DeveloperRequestStatusResponse> CreateRequestAsync(string userId, CancellationToken cancellationToken = default);
    }
}

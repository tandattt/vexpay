using VexPay.Models.Requests.Admin;
using VexPay.Models.Response.Admin;

namespace VexPay.Services.Admin
{
    public interface IAdminService
    {
        Task<AdminSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default);
        Task<AdminPagedResponse<AdminUserItemResponse>> GetUsersAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
        Task<AdminUserItemResponse> CreateUserAsync(AdminCreateUserRequest request, CancellationToken cancellationToken = default);
        Task<AdminUserItemResponse> UpdateUserAsync(string userId, AdminUpdateUserRequest request, CancellationToken cancellationToken = default);
        Task<AdminUserItemResponse> SetUserLockAsync(string userId, string actorUserId, bool isLocked, CancellationToken cancellationToken = default);

        Task<AdminPagedResponse<AdminDepositItemResponse>> GetDepositsAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
        Task<AdminDepositItemResponse> UpdateDepositStatusAsync(string depositId, AdminUpdateDepositStatusRequest request, CancellationToken cancellationToken = default);
        Task DeleteDepositAsync(string depositId, CancellationToken cancellationToken = default);

        Task<AdminPagedResponse<AdminDeveloperRequestItemResponse>> GetDeveloperRequestsAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
        Task<AdminDeveloperRequestItemResponse> UpdateDeveloperRequestStatusAsync(string requestId, AdminUpdateDeveloperRequestStatusRequest request, CancellationToken cancellationToken = default);
        Task DeleteDeveloperRequestAsync(string requestId, CancellationToken cancellationToken = default);
    }
}

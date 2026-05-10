using VexPay.Models.Dtos.Auth;
using VexPay.Models.Requests.Auth;
using VexPay.Models.Response.Auth;

namespace VexPay.Services.Auth
{
    public interface IAuthService
    {
        Task<LoginResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

        Task<LoginResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);
    }
}

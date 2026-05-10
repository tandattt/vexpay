using System.Security.Claims;
using VexPay.Entities;

namespace VexPay.Services.Auth
{
    public interface IJwtTokenService
    {
        (string Token, long ExpiresInSeconds) GenerateAccessToken(User user, IEnumerable<string> roles);

        (string Token, long ExpiresInSeconds) GenerateRefreshToken(User user);

        ClaimsPrincipal ValidateToken(string token, bool validateLifetime = true);
    }
}

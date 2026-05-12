using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VexPay.Base.Helpers;
using VexPay.Data;
using VexPay.Models.Dtos.Auth;
using VexPay.Exceptions;
using VexPay.Models.Requests.Auth;
using VexPay.Models.Response.Auth;

namespace VexPay.Services.Auth
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthService(AppDbContext db, IJwtTokenService jwtTokenService)
        {
            _db = db;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<LoginResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var user = await _db.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);

            if (user is null || !PasswordHelper.Verify(request.Password, user.Password))
            {
                throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
            }
            if (user.IsLocked)
            {
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa.");
            }

            var roles = user.UserRoles
                .Where(ur => ur.Role != null)
                .Select(ur => ur.Role!.Name)
                .ToList();

            var (accessToken, accessExpiresIn) = _jwtTokenService.GenerateAccessToken(user, roles);
            var (refreshToken, refreshExpiresIn) = _jwtTokenService.GenerateRefreshToken(user);

            return new LoginResult
            {
                RefreshToken = refreshToken,
                RefreshTokenExpiresIn = refreshExpiresIn,
                Response = new LoginResponse
                {
                    AccessToken = accessToken,
                    ExpiresIn = accessExpiresIn,
                    User = new UserInfoResponse
                    {
                        Id = user.Id,
                        Username = user.Username,
                        FullName = user.FullName,
                        Email = user.Email,
                        Roles = roles,
                    },
                },
            };
        }

        public async Task<LoginResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                throw new UnauthorizedException("Refresh token không hợp lệ.");
            }

            System.Security.Claims.ClaimsPrincipal principal;
            try
            {
                principal = _jwtTokenService.ValidateToken(refreshToken, validateLifetime: true);
            }
            catch
            {
                throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn.");
            }

            var tokenType = principal.FindFirst("tokenType")?.Value;
            if (!string.Equals(tokenType, "refresh", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedException("Sai loại token refresh.");
            }

            var userId = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? principal.FindFirst("sub")?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal.Identity?.Name;

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedException("Không xác định được người dùng từ refresh token.");
            }

            var user = await _db.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
            {
                throw new UnauthorizedException("Người dùng không tồn tại.");
            }
            if (user.IsLocked)
            {
                throw new UnauthorizedException("Tài khoản của bạn đã bị khóa.");
            }

            var roles = user.UserRoles
                .Where(ur => ur.Role != null)
                .Select(ur => ur.Role!.Name)
                .ToList();

            var (accessToken, accessExpiresIn) = _jwtTokenService.GenerateAccessToken(user, roles);

            return new LoginResponse
            {
                AccessToken = accessToken,
                ExpiresIn = accessExpiresIn,
                User = new UserInfoResponse
                {
                    Id = user.Id,
                    Username = user.Username,
                    FullName = user.FullName,
                    Email = user.Email,
                    Roles = roles,
                },
            };
        }
    }
}

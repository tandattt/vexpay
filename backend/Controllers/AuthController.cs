using Microsoft.AspNetCore.Mvc;
using VexPay.Exceptions;
using VexPay.Models.Requests.Auth;
using VexPay.Services.Auth;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private const string RefreshTokenCookie = "refresh_token";

        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _authService.LoginAsync(request, cancellationToken);

                SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresIn);

                return Ok(result.Response);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
        {
            try
            {
                var refreshToken = Request.Cookies[RefreshTokenCookie];
                var result = await _authService.RefreshAsync(refreshToken ?? string.Empty, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        private void SetRefreshTokenCookie(string refreshToken, long expiresInSeconds)
        {
            var isHttps = Request.IsHttps;
            var options = new CookieOptions
            {
                HttpOnly = true,
                Secure = isHttps,
                SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromSeconds(expiresInSeconds),
                Expires = DateTimeOffset.Now.AddSeconds(expiresInSeconds),
            };

            Response.Cookies.Append(RefreshTokenCookie, refreshToken, options);
        }
    }
}

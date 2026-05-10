using VexPay.Models.Response.Auth;

namespace VexPay.Models.Dtos.Auth
{
    public class LoginResult
    {
        public LoginResponse Response { get; set; } = new();

        public string RefreshToken { get; set; } = string.Empty;

        public long RefreshTokenExpiresIn { get; set; }
    }
}

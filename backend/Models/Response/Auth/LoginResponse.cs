namespace VexPay.Models.Response.Auth
{
    public class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;

        public long ExpiresIn { get; set; }

        public UserInfoResponse User { get; set; } = new();
    }
}

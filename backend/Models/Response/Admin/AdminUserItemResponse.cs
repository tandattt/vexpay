namespace VexPay.Models.Response.Admin
{
    public class AdminUserItemResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string[] Roles { get; set; } = [];
        public bool IsLocked { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

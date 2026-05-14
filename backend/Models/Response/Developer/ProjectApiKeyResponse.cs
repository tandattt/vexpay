namespace VexPay.Models.Response.Developer
{
    public class ProjectApiKeyResponse
    {
        public string Id { get; set; } = string.Empty;
        public string ProjectId { get; set; } = string.Empty;
        public string KeyPrefix { get; set; } = string.Empty;
        public string Last4 { get; set; } = string.Empty;
        public string? Name { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public bool IsActive => RevokedAt is null;
    }

    public class IssueProjectApiKeyResponse : ProjectApiKeyResponse
    {
        /// <summary>
        /// Returned only once at issue time. Never persisted in plaintext.
        /// </summary>
        public string SecretKey { get; set; } = string.Empty;
    }
}

namespace VexPay.Models.Response.Developer
{
    public class ProjectItemResponse
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? WebhookUrl { get; set; }
        public bool WebhookSecretEnabled { get; set; }
        public bool WebhookRetryEnabled { get; set; }
        public bool WebhookSecretConfigured { get; set; }
        public string? WebhookSecretMask { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

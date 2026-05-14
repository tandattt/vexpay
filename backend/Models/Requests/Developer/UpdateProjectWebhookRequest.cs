namespace VexPay.Models.Requests.Developer
{
    public class UpdateProjectWebhookRequest
    {
        public string? WebhookUrl { get; set; }
        public bool WebhookSecretEnabled { get; set; }
        public bool WebhookRetryEnabled { get; set; }
        public string? WebhookSecretKey { get; set; }
    }
}

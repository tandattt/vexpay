namespace VexPay.Models.Response.Developer
{
    public class ProjectWebhookDeliveryItemResponse
    {
        public string Id { get; set; } = string.Empty;

        public string PaymentIntentId { get; set; } = string.Empty;

        public string EventType { get; set; } = string.Empty;

        public int Attempt { get; set; }

        public string WebhookUrl { get; set; } = string.Empty;

        public int? HttpStatusCode { get; set; }

        public bool Success { get; set; }

        public string? ResponseBody { get; set; }

        public string? ErrorMessage { get; set; }

        public DateTime CreatedAt { get; set; }

        public string? ProjectId { get; set; }

        public string? ProjectName { get; set; }
    }
}

namespace VexPay.Models.Response.Developer
{
    public class ProjectWebhookDeliveryPagedResponse
    {
        public IReadOnlyList<ProjectWebhookDeliveryItemResponse> Items { get; set; } = Array.Empty<ProjectWebhookDeliveryItemResponse>();

        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalItems { get; set; }

        public int TotalPages { get; set; }
    }
}

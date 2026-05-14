using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("project_webhook_deliveries")]
    public class ProjectWebhookDelivery : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("project_id", TypeName = "varchar(36)")]
        public string ProjectId { get; set; } = string.Empty;

        [Required]
        [MaxLength(36)]
        [Column("payment_intent_id", TypeName = "varchar(36)")]
        public string PaymentIntentId { get; set; } = string.Empty;

        [Required]
        [MaxLength(64)]
        [Column("event_type", TypeName = "varchar(64)")]
        public string EventType { get; set; } = string.Empty;

        [Column("attempt")]
        public int Attempt { get; set; } = 1;

        [Required]
        [MaxLength(2048)]
        [Column("webhook_url", TypeName = "varchar(2048)")]
        public string WebhookUrl { get; set; } = string.Empty;

        [Column("http_status_code")]
        public int? HttpStatusCode { get; set; }

        [Column("success")]
        public bool Success { get; set; }

        [MaxLength(2000)]
        [Column("response_body", TypeName = "varchar(2000)")]
        public string? ResponseBody { get; set; }

        [MaxLength(512)]
        [Column("error_message", TypeName = "varchar(512)")]
        public string? ErrorMessage { get; set; }

        public Project? Project { get; set; }
    }
}

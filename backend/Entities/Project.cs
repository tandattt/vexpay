using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("projects")]
    public class Project : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("user_id", TypeName = "varchar(36)")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("name", TypeName = "varchar(255)")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2048)]
        [Column("webhook_url", TypeName = "varchar(2048)")]
        public string? WebhookUrl { get; set; }

        [Column("webhook_secret_enabled")]
        public bool WebhookSecretEnabled { get; set; }

        [MaxLength(512)]
        [Column("webhook_secret_key", TypeName = "varchar(512)")]
        public string? WebhookSecretKey { get; set; }

        [MaxLength(8)]
        [Column("webhook_secret_prefix", TypeName = "varchar(8)")]
        public string? WebhookSecretPrefix { get; set; }

        [MaxLength(4)]
        [Column("webhook_secret_last4", TypeName = "varchar(4)")]
        public string? WebhookSecretLast4 { get; set; }

        [Column("webhook_retry_enabled")]
        public bool WebhookRetryEnabled { get; set; }

        [Required]
        public User User { get; set; } = null!;
    }
}

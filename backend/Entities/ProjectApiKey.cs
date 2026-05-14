using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("project_api_keys")]
    public class ProjectApiKey : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("project_id", TypeName = "varchar(36)")]
        public string ProjectId { get; set; } = string.Empty;

        [Required]
        [MaxLength(32)]
        [Column("key_prefix", TypeName = "varchar(32)")]
        public string KeyPrefix { get; set; } = string.Empty;

        [Required]
        [MaxLength(4)]
        [Column("key_last4", TypeName = "varchar(4)")]
        public string KeyLast4 { get; set; } = string.Empty;

        [Required]
        [MaxLength(64)]
        [Column("key_hash", TypeName = "varchar(64)")]
        public string KeyHash { get; set; } = string.Empty;

        [MaxLength(150)]
        [Column("name", TypeName = "varchar(150)")]
        public string? Name { get; set; }

        [Column("revoked_at")]
        public DateTime? RevokedAt { get; set; }

        [Column("last_used_at")]
        public DateTime? LastUsedAt { get; set; }

        public Project? Project { get; set; }
    }
}

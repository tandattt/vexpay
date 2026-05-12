using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VexPay.Enums;

namespace VexPay.Entities
{
    [Table("developer_requests")]
    public class DeveloperRequest : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("user_id", TypeName = "varchar(36)")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        [Column("status", TypeName = "varchar(30)")]
        public string Status { get; set; } = DeveloperRequestStatus.Pending.ToString();

        [Column("requested_at")]
        public DateTime RequestedAt { get; set; } = DateTime.Now;

        [Required]
        public User User { get; set; } = null!;
    }
}

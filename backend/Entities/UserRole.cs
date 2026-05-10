using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("user_roles")]
    public class UserRole
    {
        [Required]
        [MaxLength(36)]
        [Column("user_id", TypeName = "varchar(36)")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(36)]
        [Column("role_id", TypeName = "varchar(36)")]
        public string RoleId { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public User? User { get; set; }
        public Role? Role { get; set; }
    }
}

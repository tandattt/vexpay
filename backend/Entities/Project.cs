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

        [Required]
        public User User { get; set; } = null!;
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("roles")]
    public class Role : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        [Column("name", TypeName = "varchar(50)")]
        public string Name { get; set; } = string.Empty;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}

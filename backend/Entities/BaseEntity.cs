using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    public abstract class BaseEntity
    {
        [Key]
        [Column(TypeName = "varchar(36)")]
        [MaxLength(36)]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}

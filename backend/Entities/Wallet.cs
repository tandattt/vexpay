using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("wallets")]
    public class Wallet : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("user_id", TypeName = "varchar(36)")]
        public string UserId { get; set; } = string.Empty;

        [Column("balance", TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0m;

        public User? User { get; set; }
    }
}

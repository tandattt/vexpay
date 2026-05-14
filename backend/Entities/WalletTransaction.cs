using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VexPay.Enums;

namespace VexPay.Entities
{
    [Table("wallet_transactions")]
    public class WalletTransaction : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("user_id", TypeName = "varchar(36)")]
        public string UserId { get; set; } = string.Empty;

        [Column("direction")]
        public WalletTransactionDirection Direction { get; set; }

        [Column("type")]
        public WalletTransactionType Type { get; set; }

        [Column("amount", TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(36)]
        [Column("reference_id", TypeName = "varchar(36)")]
        public string ReferenceId { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("description", TypeName = "varchar(255)")]
        public string Description { get; set; } = string.Empty;

        public User? User { get; set; }
    }
}

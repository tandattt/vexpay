using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VexPay.Enums;

namespace VexPay.Entities
{
    [Table("deposit_histories")]
    public class DepositHistory : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("user_id", TypeName = "varchar(36)")]
        public string UserId { get; set; } = string.Empty;

        [Column("amount", TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column("status")]
        public DepositStatus Status { get; set; } = DepositStatus.Pending;

        [Column("method")]
        public DepositMethod Method { get; set; } = DepositMethod.QrCode;

        [Required]
        [MaxLength(6)]
        [Column("code", TypeName = "varchar(6)")]
        public string Code { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("qr_image_path", TypeName = "varchar(255)")]
        public string? QrImagePath { get; set; }

        [Column("sepay_transaction_id")]
        public long? SepayTransactionId { get; set; }

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        public User? User { get; set; }
    }
}

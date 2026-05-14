using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VexPay.Enums;

namespace VexPay.Entities
{
    [Table("payment_intents")]
    public class PaymentIntent : BaseEntity
    {
        [Required]
        [MaxLength(36)]
        [Column("project_id", TypeName = "varchar(36)")]
        public string ProjectId { get; set; } = string.Empty;

        [MaxLength(36)]
        [Column("project_api_key_id", TypeName = "varchar(36)")]
        public string? ProjectApiKeyId { get; set; }

        [MaxLength(120)]
        [Column("merchant_ref", TypeName = "varchar(120)")]
        public string? MerchantRef { get; set; }

        [Column("amount", TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(8)]
        [Column("currency", TypeName = "varchar(8)")]
        public string Currency { get; set; } = "VND";

        [Column("status")]
        public PaymentIntentStatus Status { get; set; } = PaymentIntentStatus.AwaitingTransfer;

        [Column("method")]
        public PaymentMethod Method { get; set; } = PaymentMethod.BankTransfer;

        [Required]
        [MaxLength(20)]
        [Column("transfer_code", TypeName = "varchar(20)")]
        public string TransferCode { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("description", TypeName = "varchar(255)")]
        public string? Description { get; set; }

        [MaxLength(255)]
        [Column("qr_image_path", TypeName = "varchar(255)")]
        public string? QrImagePath { get; set; }

        [Column("sepay_transaction_id")]
        public long? SepayTransactionId { get; set; }

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        [Column("expires_at")]
        public DateTime? ExpiresAt { get; set; }

        public Project? Project { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VexPay.Entities
{
    [Table("users")]
    public class User : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        [Column("username", TypeName = "varchar(50)")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("full_name", TypeName = "varchar(150)")]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("phone_number", TypeName = "varchar(20)")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("email", TypeName = "varchar(150)")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [Column("password", TypeName = "varchar(255)")]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(6)]
        [Column("code", TypeName = "varchar(6)")]
        public string Code { get; set; } = string.Empty;

        [Column("is_locked")]
        public bool IsLocked { get; set; } = false;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        public Wallet? Wallet { get; set; }

        public ICollection<DepositHistory> DepositHistories { get; set; } = new List<DepositHistory>();
        public DeveloperRequest? DeveloperRequest { get; set; }
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Base.Helpers;
using VexPay.Entities;

namespace VexPay.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<Wallet> Wallets => Set<Wallet>();
        public DbSet<DepositHistory> DepositHistories => Set<DepositHistory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.PhoneNumber).IsUnique();
                entity.HasIndex(u => u.Code).IsUnique();
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasIndex(r => r.Name).IsUnique();
            });

            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(ur => new { ur.UserId, ur.RoleId });

                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Wallet>(entity =>
            {
                entity.HasIndex(w => w.UserId).IsUnique();

                entity.HasOne(w => w.User)
                    .WithOne(u => u.Wallet)
                    .HasForeignKey<Wallet>(w => w.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DepositHistory>(entity =>
            {
                entity.HasIndex(d => d.Code).IsUnique();
                entity.HasIndex(d => d.SepayTransactionId).IsUnique();

                entity.HasOne(d => d.User)
                    .WithMany(u => u.DepositHistories)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        public override int SaveChanges()
        {
            TouchTimestamps();
            EnsureDepositCodes();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            TouchTimestamps();
            EnsureDepositCodes();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void TouchTimestamps()
        {
            var now = DateTime.Now;
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.CreatedAt == default) entry.Entity.CreatedAt = now;
                    if (entry.Entity.UpdatedAt == default) entry.Entity.UpdatedAt = now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = now;
                }
            }
        }

        private void EnsureDepositCodes()
        {
            var newDeposits = ChangeTracker.Entries<DepositHistory>()
                .Where(x => x.State == EntityState.Added)
                .Select(x => x.Entity);

            foreach (var deposit in newDeposits)
            {
                if (!string.IsNullOrWhiteSpace(deposit.Code))
                {
                    continue;
                }

                var code = CodeHelper.Generate();
                while (DepositHistories.Any(x => x.Code == code) || newDeposits.Any(x => x != deposit && x.Code == code))
                {
                    code = CodeHelper.Generate();
                }

                deposit.Code = code;
            }
        }
    }
}

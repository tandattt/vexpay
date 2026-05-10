using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Base.Helpers;

namespace VexPay.Base.Seeders
{
    public static class DatabaseSeeder
    {
        private const string AdminRoleName = "ADMIN";
        private const string CustomerRoleName = "CUSTOMER";
        private const string DeveloperRoleName = "DEVELOPER";
        private const string ShopOwnerRoleName = "SHOP_OWNER";

        private const string DefaultPassword = "123456";

        private static readonly SeedUser[] SeedUsers =
        {
            new(
                Username: "admin",
                FullName: "Administrator",
                Email: "admin@vexpay.local",
                PhoneNumber: "0000000001",
                RoleName: AdminRoleName),
            new(
                Username: "customer",
                FullName: "Default Customer",
                Email: "customer@vexpay.local",
                PhoneNumber: "0000000002",
                RoleName: CustomerRoleName),
            new(
                Username: "developer",
                FullName: "Default Developer",
                Email: "developer@vexpay.local",
                PhoneNumber: "0000000003",
                RoleName: DeveloperRoleName),
            new(
                Username: "shop_owner",
                FullName: "Default Shop Owner",
                Email: "shop_owner@vexpay.local",
                PhoneNumber: "0000000004",
                RoleName: ShopOwnerRoleName),
        };

        private static readonly string[] RoleNames =
        {
            AdminRoleName,
            CustomerRoleName,
            DeveloperRoleName,
            ShopOwnerRoleName,
        };

        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await db.Database.EnsureCreatedAsync();

            var roles = await SeedRolesAsync(db);

            foreach (var seed in SeedUsers)
            {
                await SeedUserAsync(db, seed, roles[seed.RoleName]);
            }
        }

        private static async Task<Dictionary<string, Role>> SeedRolesAsync(AppDbContext db)
        {
            var existing = await db.Roles
                .Where(r => RoleNames.Contains(r.Name))
                .ToDictionaryAsync(r => r.Name);

            var toAdd = RoleNames
                .Where(name => !existing.ContainsKey(name))
                .Select(name => new Role { Name = name })
                .ToList();

            if (toAdd.Count > 0)
            {
                db.Roles.AddRange(toAdd);
                await db.SaveChangesAsync();

                foreach (var role in toAdd)
                {
                    existing[role.Name] = role;
                }
            }

            return existing;
        }

        private static async Task SeedUserAsync(AppDbContext db, SeedUser seed, Role role)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == seed.Username);
            if (user is null)
            {
                user = new User
                {
                    Username = seed.Username,
                    FullName = seed.FullName,
                    Email = seed.Email,
                    PhoneNumber = seed.PhoneNumber,
                    Password = PasswordHelper.Hash(DefaultPassword),
                    Code = await GenerateUniqueUserCodeAsync(db),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (string.IsNullOrWhiteSpace(user.Code))
            {
                user.Code = await GenerateUniqueUserCodeAsync(db);
                await db.SaveChangesAsync();
            }

            var hasRole = await db.UserRoles
                .AnyAsync(ur => ur.UserId == user.Id && ur.RoleId == role.Id);
            if (!hasRole)
            {
                db.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id,
                });
                await db.SaveChangesAsync();
            }
        }

        private static async Task<string> GenerateUniqueUserCodeAsync(AppDbContext db)
        {
            string code;
            do
            {
                code = CodeHelper.Generate();
            }
            while (await db.Users.AnyAsync(u => u.Code == code));

            return code;
        }

        private sealed record SeedUser(
            string Username,
            string FullName,
            string Email,
            string PhoneNumber,
            string RoleName);
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Base.Helpers;
using VexPay.Constants;

namespace VexPay.Base.Seeders
{
    public static class DatabaseSeeder
    {
        private const string DefaultPassword = "123456";

        private static readonly SeedUser DefaultUser = new(
            Username: "admin",
            FullName: "Administrator",
            Email: "admin@vexpay.local",
            PhoneNumber: "0000000001");

        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await db.Database.EnsureCreatedAsync();

            var roles = await SeedRolesAsync(db);
            await SeedUserAsync(db, DefaultUser, roles);
        }

        private static async Task<Dictionary<string, Role>> SeedRolesAsync(AppDbContext db)
        {
            var existing = await db.Roles
                .Where(r => RoleNames.All.Contains(r.Name))
                .ToDictionaryAsync(r => r.Name);

            var toAdd = RoleNames.All
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

        private static async Task SeedUserAsync(AppDbContext db, SeedUser seed, IReadOnlyDictionary<string, Role> roles)
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

            foreach (var roleName in RoleNames.All)
            {
                var role = roles[roleName];
                var hasRole = await db.UserRoles.AnyAsync(ur => ur.UserId == user.Id && ur.RoleId == role.Id);
                if (hasRole) continue;

                db.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id,
                });
            }

            await db.SaveChangesAsync();
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
            string PhoneNumber);
    }
}

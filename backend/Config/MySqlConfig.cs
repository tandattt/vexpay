using Microsoft.EntityFrameworkCore;
using VexPay.Data;

namespace VexPay.Config
{
    public static class MySqlConfig
    {
        public static IServiceCollection AddMySqlConfig(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

            services.AddDbContext<AppDbContext>(options =>
            {
                if (!string.IsNullOrWhiteSpace(connectionString))
                {
                    options.UseMySql(connectionString, serverVersion);
                }
            });

            return services;
        }
    }
}

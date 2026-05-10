using VexPay.Services.Auth;
using VexPay.Services.Deposit;
using VexPay.Services.Wallet;
using VexPay.Settings;

namespace VexPay.Config
{
    public static class ServiceConfig
    {
        public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
            services.Configure<SepaySettings>(configuration.GetSection("SePay"));
            services.Configure<GlobalSettings>(configuration.GetSection("Global"));

            services.AddHttpClient();
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IWalletService, WalletService>();
            services.AddScoped<IDepositService, DepositService>();

            return services;
        }
    }
}

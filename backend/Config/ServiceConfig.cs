using VexPay.Services.Admin;
using VexPay.Services.Auth;
using VexPay.Services.Balance;
using VexPay.Services.Deposit;
using VexPay.Services.Developer;
using VexPay.Services.Payments;
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
            services.AddHttpContextAccessor();
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IAdminService, AdminService>();
            services.AddScoped<IBalanceService, BalanceService>();
            services.AddScoped<IWalletService, WalletService>();
            services.AddScoped<IDepositService, DepositService>();
            services.AddScoped<IDeveloperRequestService, DeveloperRequestService>();
            services.AddScoped<IProjectService, ProjectService>();
            services.AddScoped<IProjectApiKeyService, ProjectApiKeyService>();
            services.AddScoped<IProjectWebhookDeliveryService, ProjectWebhookDeliveryService>();
            services.AddScoped<ISepayQrService, SepayQrService>();
            services.AddScoped<IPaymentService, PaymentService>();
            services.AddScoped<IPaymentSettlementService, PaymentSettlementService>();
            services.AddScoped<ICheckoutService, CheckoutService>();
            services.AddScoped<ISepayInboundService, SepayInboundService>();
            services.AddScoped<IProjectWebhookDispatcher, ProjectWebhookDispatcher>();
            services.AddScoped<ProjectWebhookDispatcher>();

            return services;
        }
    }
}

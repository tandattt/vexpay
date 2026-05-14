namespace VexPay.Config
{
    public static class CorsConfig
    {
        private const string CorsPolicyName = "FrontendPolicy";

        public static IServiceCollection AddCorsConfig(
            this IServiceCollection services,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            var origins = configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>()
                ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
                .Select(origin => origin.Trim().TrimEnd('/'))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray()
                ?? Array.Empty<string>();

            if (origins.Length == 0 && environment.IsDevelopment())
            {
                origins =
                [
                    "http://localhost:5173",
                    "https://localhost:5173",
                    "http://127.0.0.1:5173",
                    "https://127.0.0.1:5173"
                    
                ];
            }
            else if (origins.Length == 0 && environment.IsProduction())
            {
                origins =
                [
                    "https://vexpay.tandat.site",
                ];
            }

            services.AddCors(options =>
            {
                options.AddPolicy(CorsPolicyName, policy =>
                {
                    if (origins.Length == 0)
                    {
                        return;
                    }

                    policy
                        .WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .WithExposedHeaders("X-Deposit-Code");
                });
            });

            return services;
        }

        public static IApplicationBuilder UseCorsConfig(this IApplicationBuilder app)
        {
            app.UseCors(CorsPolicyName);
            return app;
        }
    }
}

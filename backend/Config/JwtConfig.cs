using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using VexPay.Settings;

namespace VexPay.Config
{
    public static class JwtConfig
    {
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var jwt = configuration.GetSection("Jwt").Get<JwtSettings>()
                ?? throw new InvalidOperationException(
                    "Missing Jwt configuration. Set Jwt:SecretKey in appsettings.Development.json or env var Jwt__SecretKey.");

            var keyBytes = ResolveKeyBytes(jwt.SecretKey);

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
                    ValidateIssuer = !string.IsNullOrWhiteSpace(jwt.Issuer),
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = !string.IsNullOrWhiteSpace(jwt.Audience),
                    ValidAudience = jwt.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = "sub",
                    RoleClaimType = ClaimTypes.Role,
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (context.Principal?.Identity is not ClaimsIdentity identity)
                            return Task.CompletedTask;

                        foreach (var claim in identity.FindAll("authorities").ToList())
                        {
                            foreach (var part in claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                            {
                                if (!identity.HasClaim(ClaimTypes.Role, part))
                                    identity.AddClaim(new Claim(ClaimTypes.Role, part));
                            }
                        }

                        return Task.CompletedTask;
                    },
                };
            });

            return services;
        }

        /// <summary>
        /// Dùng raw UTF-8 bytes của secret string để tương thích với token phát hành từ Spring Boot.
        /// </summary>
        private static byte[] ResolveKeyBytes(string secret)
        {
            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException("Jwt:SecretKey is required.");

            return Encoding.UTF8.GetBytes(secret.Trim());
        }
    }
}

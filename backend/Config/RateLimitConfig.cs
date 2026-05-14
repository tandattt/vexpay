using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace VexPay.Config
{
    public static class RateLimitConfig
    {
        public const string CheckoutWalletPolicy = "checkout-wallet";
        public const string CheckoutPublicPolicy = "checkout-public";

        public static IServiceCollection AddRateLimitingConfig(this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.ContentType = "application/json";
                    await context.HttpContext.Response.WriteAsJsonAsync(
                        new { message = "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
                        cancellationToken);
                };

                options.AddPolicy(CheckoutWalletPolicy, context =>
                {
                    var userId = context.User.FindFirst("sub")?.Value
                        ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                    var partitionKey = userId is { Length: > 0 }
                        ? $"user:{userId}"
                        : $"ip:{context.Connection.RemoteIpAddress}";

                    return RateLimitPartition.GetSlidingWindowLimiter(partitionKey, _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 8,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                    });
                });

                options.AddPolicy(CheckoutPublicPolicy, context =>
                {
                    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    return RateLimitPartition.GetSlidingWindowLimiter($"ip:{ip}", _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 60,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 4,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                    });
                });
            });

            return services;
        }

        public static IApplicationBuilder UseRateLimitingConfig(this IApplicationBuilder app)
        {
            return app.UseRateLimiter();
        }
    }
}

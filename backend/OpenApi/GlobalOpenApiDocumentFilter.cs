using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.SwaggerGen;
using VexPay.Settings;

namespace VexPay.OpenApi
{
    /// <summary>Đưa cấu hình Global (appsettings) vào OpenAPI để FE docs hiển thị đúng giá trị runtime.</summary>
    public sealed class GlobalOpenApiDocumentFilter : IDocumentFilter
    {
        private readonly GlobalSettings _global;

        public GlobalOpenApiDocumentFilter(IOptions<GlobalSettings> global)
        {
            _global = global.Value;
        }

        public void Apply(OpenApiDocument document, DocumentFilterContext context)
        {
            if (!string.Equals(context.DocumentName, OpenApiDocumentNames.PublicV1, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var node = JsonSerializer.SerializeToNode(new
            {
                qr_image_expiration_minutes = _global.QrImageExpirationMinutes,
                webhook_max_attempts = _global.WebhookMaxAttempts,
                webhook_retry_delay_seconds = _global.WebhookRetryDelaySeconds,
            });

            if (node is null)
            {
                return;
            }

            document.Extensions ??= new Dictionary<string, IOpenApiExtension>();
            document.Extensions["x-vexpay-global"] = new JsonNodeExtension(node);
        }
    }
}

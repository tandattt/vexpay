using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using VexPay.Services.Developer;

namespace VexPay.Base.Authorization
{
    public sealed class ApiKeyAuthAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public const string ProjectIdItemKey = "VexPay.ProjectId";

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var rawKey = ExtractKey(context.HttpContext.Request);
            if (string.IsNullOrWhiteSpace(rawKey))
            {
                context.Result = Unauthorized("Missing API key. Provide via 'Authorization: Bearer <key>' or 'X-API-Key' header.");
                return;
            }

            var apiKeyService = context.HttpContext.RequestServices.GetRequiredService<IProjectApiKeyService>();
            var projectId = await apiKeyService.ResolveProjectIdAsync(rawKey, context.HttpContext.RequestAborted);

            if (string.IsNullOrEmpty(projectId))
            {
                context.Result = Unauthorized("Invalid or revoked API key.");
                return;
            }

            context.HttpContext.Items[ProjectIdItemKey] = projectId;
        }

        private static string? ExtractKey(HttpRequest request)
        {
            if (request.Headers.TryGetValue("X-API-Key", out var headerKey) && !string.IsNullOrWhiteSpace(headerKey))
            {
                return headerKey.ToString().Trim();
            }

            if (request.Headers.TryGetValue("Authorization", out var auth))
            {
                var value = auth.ToString();
                if (value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return value["Bearer ".Length..].Trim();
                }
            }

            return null;
        }

        private static IActionResult Unauthorized(string message) =>
            new ObjectResult(new { message }) { StatusCode = StatusCodes.Status401Unauthorized };
    }

    public static class HttpContextProjectExtensions
    {
        public static string GetProjectId(this HttpContext context)
        {
            if (context.Items.TryGetValue(ApiKeyAuthAttribute.ProjectIdItemKey, out var value) && value is string projectId)
            {
                return projectId;
            }

            throw new InvalidOperationException("Project id not found in context. Did you forget [ApiKeyAuth]?");
        }
    }
}

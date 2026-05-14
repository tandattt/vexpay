using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using VexPay.Base.Authorization;

namespace VexPay.OpenApi
{
    public sealed class SecurityRequirementsOperationFilter : IOperationFilter
    {
        private const string ApiKeySchemeId = "ApiKey";
        private const string BearerSchemeId = "Bearer";

        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var usesApiKey = context.ApiDescription.ActionDescriptor.FilterDescriptors
                .Any(x => x.Filter is ApiKeyAuthAttribute);

            if (usesApiKey)
            {
                operation.Security =
                [
                    new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecuritySchemeReference(ApiKeySchemeId)] = [],
                    },
                ];
                return;
            }

            var allowsAnonymous = context.ApiDescription.ActionDescriptor.EndpointMetadata
                .Any(m => m is AllowAnonymousAttribute);

            if (allowsAnonymous)
            {
                operation.Security = null;
                return;
            }

            operation.Security =
            [
                new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference(BearerSchemeId)] = [],
                },
            ];
        }
    }
}

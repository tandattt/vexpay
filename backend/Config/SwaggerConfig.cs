using System.Reflection;
using Microsoft.OpenApi;
using VexPay.OpenApi;

namespace VexPay.Config
{
    public static class SwaggerConfig
    {
        private const string BearerSchemeId = "Bearer";
        private const string ApiKeySchemeId = "ApiKey";

        public static IServiceCollection AddSwaggerConfig(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc(OpenApiDocumentNames.PublicV1, new OpenApiInfo
                {
                    Title = "VexPay Public API",
                    Version = "v1",
                    Description =
                        "API công khai để tích hợp thanh toán VexPay vào ứng dụng của bạn. " +
                        "Xác thực bằng API key dự án (header `X-API-Key` hoặc `Authorization: Bearer <key>`).",
                    Contact = new OpenApiContact
                    {
                        Name = "VexPay Developer",
                    },
                });

                options.SwaggerDoc(OpenApiDocumentNames.Internal, new OpenApiInfo
                {
                    Title = "VexPay Internal API",
                    Version = "v1",
                    Description = "Toàn bộ endpoint nội bộ (dashboard, admin, webhook). Chỉ dùng cho phát triển.",
                });

                options.DocInclusionPredicate((docName, apiDesc) =>
                {
                    var group = apiDesc.GroupName ?? OpenApiDocumentNames.Internal;
                    return string.Equals(docName, group, StringComparison.OrdinalIgnoreCase);
                });

                options.AddSecurityDefinition(ApiKeySchemeId, new OpenApiSecurityScheme
                {
                    Name = "X-API-Key",
                    Type = SecuritySchemeType.ApiKey,
                    In = ParameterLocation.Header,
                    Description = "API key dự án. Có thể dùng header `X-API-Key` hoặc `Authorization: Bearer <key>`.",
                });

                options.AddSecurityDefinition(BearerSchemeId, new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Access token JWT (không cần prefix 'Bearer ').",
                });

                options.OperationFilter<SecurityRequirementsOperationFilter>();
                options.OperationFilter<PaymentResponseOperationFilter>();
                options.DocumentFilter<GlobalOpenApiDocumentFilter>();
                options.SchemaFilter<EnumSchemaFilter>();

                var xmlPath = Path.Combine(
                    AppContext.BaseDirectory,
                    $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
                if (File.Exists(xmlPath))
                {
                    options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
                }
            });
            return services;
        }

        public static IApplicationBuilder UseOpenApiDocuments(this IApplicationBuilder app)
        {
            app.UseSwagger(options =>
            {
                options.RouteTemplate = "openapi/{documentName}.json";
            });
            return app;
        }

        public static IApplicationBuilder UseSwaggerUiInDevelopment(this IApplicationBuilder app)
        {
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint(
                    $"/openapi/{OpenApiDocumentNames.PublicV1}.json",
                    "VexPay Public API v1");
                options.SwaggerEndpoint(
                    $"/openapi/{OpenApiDocumentNames.Internal}.json",
                    "VexPay Internal API");
                options.RoutePrefix = "swagger";
            });
            return app;
        }
    }
}

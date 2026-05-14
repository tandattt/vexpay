using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using VexPay.Controllers.Public;
using VexPay.Models.Response.Common;

namespace VexPay.OpenApi
{
    /// <summary>
    /// Bổ sung mô tả response và content-type cho Payments API trong OpenAPI.
    /// </summary>
    public sealed class PaymentResponseOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            if (context.ApiDescription.ActionDescriptor is not ControllerActionDescriptor action)
            {
                return;
            }

            if (action.ControllerTypeInfo != typeof(PaymentsController))
            {
                return;
            }

            operation.Responses ??= new OpenApiResponses();

            if (action.ActionName == nameof(PaymentsController.GetQr))
            {
                operation.Responses["200"] = new OpenApiResponse
                {
                    Description = "Ảnh QR thanh toán (PNG, binary). Lưu response body thành file .png.",
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["image/png"] = new OpenApiMediaType
                        {
                            Schema = new OpenApiSchema
                            {
                                Type = JsonSchemaType.String,
                                Format = "binary",
                            },
                        },
                    },
                };
            }

            EnsureErrorResponse(operation, "400", "Yêu cầu không hợp lệ (số tiền, merchant_ref, v.v.).");
            EnsureErrorResponse(operation, "401", "Thiếu hoặc sai API key.");
            EnsureErrorResponse(operation, "404", "Không tìm thấy payment.");
            EnsureErrorResponse(operation, "409", "Xung đột (merchant_ref trùng, trạng thái không cho phép hủy).");

            if (action.ActionName == nameof(PaymentsController.Cancel)
                && operation.Responses.TryGetValue("200", out var cancelOk)
                && string.IsNullOrWhiteSpace(cancelOk.Description))
            {
                operation.Responses["200"] = new OpenApiResponse
                {
                    Description = "Payment đã hủy (status = Cancelled). Dùng khi method = BankTransfer và merchant tự tích hợp nút hủy.",
                };
            }

            if (operation.Responses.TryGetValue("204", out var noContent)
                && string.IsNullOrWhiteSpace(noContent.Description))
            {
                operation.Responses["204"] = new OpenApiResponse
                {
                    Description = "Thành công, không có response body.",
                };
            }
        }

        private static void EnsureErrorResponse(OpenApiOperation operation, string statusCode, string description)
        {
            if (!operation.Responses.TryGetValue(statusCode, out var response))
            {
                return;
            }

            var resolvedDescription = string.IsNullOrWhiteSpace(response.Description)
                ? description
                : response.Description;

            if (response.Content is { Count: > 0 })
            {
                if (string.IsNullOrWhiteSpace(response.Description))
                {
                    operation.Responses[statusCode] = new OpenApiResponse
                    {
                        Description = resolvedDescription,
                        Content = response.Content,
                    };
                }
                return;
            }

            operation.Responses[statusCode] = new OpenApiResponse
            {
                Description = resolvedDescription,
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchemaReference(nameof(ApiMessageResponse)),
                    },
                },
            };
        }
    }
}

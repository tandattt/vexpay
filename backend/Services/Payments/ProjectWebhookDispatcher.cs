using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VexPay.Data;
using VexPay.Services.Developer;
using VexPay.Settings;

namespace VexPay.Services.Payments
{
    public class ProjectWebhookDispatcher : IProjectWebhookDispatcher
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IProjectWebhookDeliveryService _deliveryLog;
        private readonly GlobalSettings _global;
        private readonly ILogger<ProjectWebhookDispatcher> _logger;

        public ProjectWebhookDispatcher(
            AppDbContext db,
            IHttpClientFactory httpClientFactory,
            IProjectWebhookDeliveryService deliveryLog,
            IOptions<GlobalSettings> global,
            ILogger<ProjectWebhookDispatcher> logger)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _deliveryLog = deliveryLog;
            _global = global.Value;
            _logger = logger;
        }

        public void EnqueuePaymentEvent(string paymentIntentId, string eventType)
        {
            BackgroundJob.Enqueue<ProjectWebhookDispatcher>(d => d.RoutePaymentEventAsync(paymentIntentId, eventType));
        }

        public async Task RoutePaymentEventAsync(string paymentIntentId, string eventType)
        {
            var payment = await _db.PaymentIntents
                .AsNoTracking()
                .Include(x => x.Project)
                .FirstOrDefaultAsync(x => x.Id == paymentIntentId);

            if (payment?.Project is null || string.IsNullOrWhiteSpace(payment.Project.WebhookUrl))
            {
                _logger.LogInformation("Webhook skipped: project has no webhook url (payment {Id})", paymentIntentId);
                return;
            }

            if (payment.Project.WebhookRetryEnabled)
            {
                BackgroundJob.Enqueue<ProjectWebhookDispatcher>(
                    d => d.SendPaymentEventWithRetryAsync(paymentIntentId, eventType, 1));
                return;
            }

            await SendPaymentEventOnceAsync(paymentIntentId, eventType);
        }

        public async Task SendPaymentEventWithRetryAsync(string paymentIntentId, string eventType, int attempt)
        {
            var maxAttempts = Math.Max(1, _global.WebhookMaxAttempts);

            try
            {
                await DeliverPaymentEventAsync(paymentIntentId, eventType, attempt);
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                var delaySeconds = GetRetryDelaySeconds(attempt - 1);
                _logger.LogWarning(
                    ex,
                    "Webhook attempt {Attempt}/{Max} failed, scheduling retry in {Delay}s (payment {PaymentId}, event {Event})",
                    attempt,
                    maxAttempts,
                    delaySeconds,
                    paymentIntentId,
                    eventType);

                BackgroundJob.Schedule<ProjectWebhookDispatcher>(
                    d => d.SendPaymentEventWithRetryAsync(paymentIntentId, eventType, attempt + 1),
                    TimeSpan.FromSeconds(delaySeconds));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Webhook delivery gave up after {Attempt} attempts (payment {PaymentId}, event {Event})",
                    attempt,
                    paymentIntentId,
                    eventType);
            }
        }

        public async Task SendPaymentEventOnceAsync(string paymentIntentId, string eventType)
        {
            try
            {
                await DeliverPaymentEventAsync(paymentIntentId, eventType, 1);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Webhook delivery failed without retry: payment {PaymentId}, event {Event}",
                    paymentIntentId,
                    eventType);
            }
        }

        private int GetRetryDelaySeconds(int delayIndex)
        {
            var delays = _global.WebhookRetryDelaySeconds;
            if (delays is null || delays.Length == 0)
            {
                return 30;
            }

            return delays[Math.Min(Math.Max(delayIndex, 0), delays.Length - 1)];
        }

        private async Task DeliverPaymentEventAsync(string paymentIntentId, string eventType, int attempt)
        {
            var payment = await _db.PaymentIntents
                .AsNoTracking()
                .Include(x => x.Project)
                .FirstOrDefaultAsync(x => x.Id == paymentIntentId);

            if (payment is null)
            {
                _logger.LogWarning("Webhook skipped: payment {Id} not found", paymentIntentId);
                return;
            }

            var project = payment.Project;
            if (project is null || string.IsNullOrWhiteSpace(project.WebhookUrl))
            {
                _logger.LogInformation("Webhook skipped: project has no webhook url (payment {Id})", paymentIntentId);
                return;
            }

            var payload = new
            {
                @event = eventType,
                created_at = DateTime.UtcNow,
                data = new
                {
                    id = payment.Id,
                    project_id = payment.ProjectId,
                    merchant_ref = payment.MerchantRef,
                    amount = payment.Amount,
                    currency = payment.Currency,
                    status = payment.Status.ToString(),
                    method = payment.Method.ToString(),
                    transfer_code = payment.TransferCode,
                    description = payment.Description,
                    paid_at = payment.PaidAt,
                },
            };

            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            });

            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);

            using var requestMsg = new HttpRequestMessage(HttpMethod.Post, project.WebhookUrl)
            {
                Content = content,
            };
            requestMsg.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (project.WebhookSecretEnabled && !string.IsNullOrEmpty(project.WebhookSecretKey))
            {
                requestMsg.Headers.TryAddWithoutValidation("api-key", project.WebhookSecretKey);
            }

            int? statusCode = null;
            string? responseBody = null;
            string? errorMessage = null;
            var success = false;

            try
            {
                var response = await client.SendAsync(requestMsg);
                statusCode = (int)response.StatusCode;
                responseBody = await response.Content.ReadAsStringAsync();
                success = statusCode is >= 200 and <= 299;

                if (!success)
                {
                    _logger.LogWarning(
                        "Webhook delivery failed: project {ProjectId}, payment {PaymentId}, status {Status}, body {Body}",
                        project.Id, payment.Id, statusCode, responseBody);

                    throw new HttpRequestException($"Webhook delivery failed with status {statusCode}.");
                }

                _logger.LogInformation(
                    "Webhook delivered: project {ProjectId}, payment {PaymentId}, event {Event}",
                    project.Id, payment.Id, eventType);
            }
            catch (Exception ex)
            {
                errorMessage = ex.Message;
                throw;
            }
            finally
            {
                try
                {
                    await _deliveryLog.RecordAsync(
                        project.Id,
                        payment.Id,
                        eventType,
                        attempt,
                        project.WebhookUrl,
                        statusCode,
                        success,
                        responseBody,
                        errorMessage);
                }
                catch (Exception logEx)
                {
                    _logger.LogError(logEx, "Failed to persist webhook delivery log for payment {PaymentId}", payment.Id);
                }
            }
        }
    }
}

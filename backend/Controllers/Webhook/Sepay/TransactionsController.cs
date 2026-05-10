using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Models.Requests.Sepay;
using VexPay.Services.Deposit;

namespace VexPay.Controllers.Webhook.Sepay
{
    [ApiController]
    [AllowAnonymous]
    [Route("webhook/sepay/transactions")]
    public class TransactionsController : ControllerBase
    {
        private static readonly ConcurrentDictionary<long, byte> ProcessedTransactionIds = new();
        private readonly ILogger<TransactionsController> _logger;
        private readonly IDepositService _depositService;

        public TransactionsController(ILogger<TransactionsController> logger, IDepositService depositService)
        {
            _logger = logger;
            _depositService = depositService;
        }

        [HttpPost]
        [Consumes("application/json", "multipart/form-data", "application/x-www-form-urlencoded")]
        public async Task<IActionResult> Receive()
        {
            var request = await ReadRequestAsync();
            if (request is null)
            {
                _logger.LogWarning("SePay webhook has unsupported or invalid payload");
                return Ok(new { success = true });
            }

            if (request.Id <= 0)
            {
                _logger.LogWarning("SePay webhook missing valid transaction id");
                return Ok(new { success = true });
            }

            var isDuplicate = !ProcessedTransactionIds.TryAdd(request.Id, 0);

            _logger.LogInformation(
                "SePay transaction webhook received: id={Id}, duplicate={Duplicate}, gateway={Gateway}, transferType={TransferType}, amount={Amount}, code={Code}, referenceCode={ReferenceCode}",
                request.Id,
                isDuplicate,
                request.Gateway,
                request.TransferType,
                request.TransferAmount,
                request.Code,
                request.ReferenceCode);

            if (!isDuplicate && !string.IsNullOrWhiteSpace(request.Content) && string.Equals(request.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            {
                await _depositService.MarkPaidFromSepayAsync(request.Id, request.Content, request.TransferAmount, HttpContext.RequestAborted);
            }

            return Ok(new { success = true });
        }

        private async Task<SepayTransactionWebhookRequest?> ReadRequestAsync()
        {
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                return new SepayTransactionWebhookRequest
                {
                    Id = TryParseLong(form["id"]),
                    Gateway = form["gateway"].ToString(),
                    TransactionDate = form["transactionDate"].ToString(),
                    AccountNumber = form["accountNumber"].ToString(),
                    SubAccount = form["subAccount"].ToString(),
                    Code = form["code"].ToString(),
                    Content = form["content"].ToString(),
                    TransferType = form["transferType"].ToString(),
                    Description = form["description"].ToString(),
                    TransferAmount = TryParseLong(form["transferAmount"]),
                    Accumulated = TryParseLong(form["accumulated"]),
                    ReferenceCode = form["referenceCode"].ToString(),
                };
            }

            return await JsonSerializer.DeserializeAsync<SepayTransactionWebhookRequest>(Request.Body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
            });
        }

        private static long TryParseLong(string? value)
        {
            return long.TryParse(value, out var result) ? result : 0;
        }
    }
}

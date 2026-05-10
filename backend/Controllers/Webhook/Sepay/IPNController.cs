using Microsoft.AspNetCore.Mvc;
using VexPay.Models.Requests.Sepay;
using Microsoft.AspNetCore.Authorization;

namespace VexPay.Controllers.Webhook.Sepay
{
    [ApiController]
    [AllowAnonymous]
    [Route("webhook/sepay/ipn")]
    public class IPNController : ControllerBase
    {
        private readonly ILogger<IPNController> _logger;

        public IPNController(ILogger<IPNController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IActionResult Receive([FromBody] IPNRequest request)
        {
            Console.WriteLine("Received Sepay IPN");
            Console.WriteLine($"NotificationType: {request.NotificationType}");
            Console.WriteLine($"Timestamp: {request.Timestamp}");
            Console.WriteLine($"OrderId: {request.Order?.OrderId}");
            Console.WriteLine($"OrderStatus: {request.Order?.OrderStatus}");
            Console.WriteLine($"OrderAmount: {request.Order?.OrderAmount}");
            Console.WriteLine($"TransactionId: {request.Transaction?.TransactionId}");
            Console.WriteLine($"TransactionStatus: {request.Transaction?.TransactionStatus}");
            Console.WriteLine($"TransactionAmount: {request.Transaction?.TransactionAmount}");

            _logger.LogInformation(
                "Received Sepay IPN: {NotificationType} - OrderId={OrderId} - TransactionId={TransactionId}",
                request.NotificationType,
                request.Order?.OrderId,
                request.Transaction?.TransactionId);

            return Ok(new { message = "IPN received" });
        }
    }
}

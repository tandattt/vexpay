using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Exceptions;
using VexPay.Models.Requests.Deposit;
using VexPay.Models.Response.Deposit;
using VexPay.Services.Deposit;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("deposit")]
    [Authorize]
    public class DepositController : ControllerBase
    {
        private readonly IDepositService _depositService;

        public DepositController(IDepositService depositService)
        {
            _depositService = depositService;
        }

        [HttpPost("qr")]
        public async Task<IActionResult> CreateQr([FromBody] CreateDepositQrRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var result = await _depositService.CreateQrAsync(userId, request.Amount, cancellationToken);
                Response.Headers["X-Deposit-Code"] = result.Response.DepositCode;
                Response.Headers["Deposit-Code"] = result.Response.DepositCode;
                Response.Headers["Access-Control-Expose-Headers"] = "X-Deposit-Code, Deposit-Code";
                return File(result.ImageBytes, "image/png", $"{result.Response.DepositCode}.png");
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("status/{code}")]
        public async Task<IActionResult> GetStatus([FromRoute] string code, CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var status = await _depositService.GetStatusAsync(userId, code, cancellationToken);
                return Ok(new DepositStatusResponse { Code = code, Status = status });
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var history = await _depositService.GetHistoryAsync(userId, cancellationToken);
                return Ok(history);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }
    }
}

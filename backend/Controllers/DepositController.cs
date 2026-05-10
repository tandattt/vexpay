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
        public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 5, CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var history = await _depositService.GetHistoryAsync(userId, page, pageSize, cancellationToken);
                return Ok(history);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPost("cancel/{code}")]
        public async Task<IActionResult> Cancel([FromRoute] string code, CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                await _depositService.CancelAsync(userId, code, cancellationToken);
                return Ok(new { success = true });
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("history/{code}/qr")]
        public async Task<IActionResult> GetHistoryQr([FromRoute] string code, CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var imageBytes = await _depositService.GetQrImageByCodeAsync(userId, code, cancellationToken);
                return File(imageBytes, "image/png", $"{code}.png");
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }
    }
}

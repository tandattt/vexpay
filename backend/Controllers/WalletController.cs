using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Exceptions;
using VexPay.Services.Wallet;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("wallet")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;

        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
        }

        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance(CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                {
                    throw new UnauthorizedException("Không xác định được người dùng từ token.");
                }

                var result = await _walletService.GetMyBalanceAsync(userId, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }
    }
}

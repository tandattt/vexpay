using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VexPay.Config;
using VexPay.Exceptions;
using VexPay.Models.Response.Common;
using VexPay.Models.Response.Payments;
using VexPay.Services.Payments;

namespace VexPay.Controllers.Public
{
    /// <summary>Trang thanh toán công khai (redirect từ merchant khi method = Wallet).</summary>
    [ApiController]
    [Route("v1/checkout")]
    [Produces("application/json")]
    public class CheckoutController : ControllerBase
    {
        private readonly ICheckoutService _checkoutService;

        public CheckoutController(ICheckoutService checkoutService)
        {
            _checkoutService = checkoutService;
        }

        /// <summary>Lấy thông tin giao dịch cho trang checkout (không cần API key).</summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitConfig.CheckoutPublicPolicy)]
        [ProducesResponseType(typeof(CheckoutResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(string id, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _checkoutService.GetAsync(id, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>Tạo/lấy QR chuyển khoản trên trang checkout.</summary>
        [HttpPost("{id}/bank-qr")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitConfig.CheckoutPublicPolicy)]
        [ProducesResponseType(typeof(CheckoutResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EnsureBankQr(string id, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _checkoutService.EnsureBankQrAsync(id, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>Thanh toán bằng số dư ví VexPay (yêu cầu đăng nhập).</summary>
        [HttpPost("{id}/wallet")]
        [Authorize]
        [EnableRateLimiting(RateLimitConfig.CheckoutWalletPolicy)]
        [ProducesResponseType(typeof(CheckoutResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status429TooManyRequests)]
        public async Task<IActionResult> PayWithWallet(string id, CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new ApiMessageResponse { Message = "Phiên đăng nhập không hợp lệ." });
                }

                var result = await _checkoutService.PayWithWalletAsync(id, userId, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>Hủy giao dịch đang chờ thanh toán trên trang checkout.</summary>
        [HttpPost("{id}/cancel")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitConfig.CheckoutPublicPolicy)]
        [ProducesResponseType(typeof(CheckoutResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Cancel(string id, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _checkoutService.CancelAsync(id, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }
    }
}

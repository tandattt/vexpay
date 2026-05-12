using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Exceptions;
using VexPay.Services.Developer;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("developer-requests")]
    [Authorize]
    public class DeveloperController : ControllerBase
    {
        private readonly IDeveloperRequestService _developerRequestService;

        public DeveloperController(IDeveloperRequestService developerRequestService)
        {
            _developerRequestService = developerRequestService;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetRequestStatus(CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var result = await _developerRequestService.GetStatusAsync(userId, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> RequestDeveloper(CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                var result = await _developerRequestService.CreateRequestAsync(userId, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }
    }
}

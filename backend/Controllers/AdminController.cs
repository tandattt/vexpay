using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Constants;
using VexPay.Exceptions;
using VexPay.Models.Requests.Admin;
using VexPay.Services.Admin;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("admin")]
    [Authorize(Roles = RoleNames.Admin)]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _adminService.GetSummaryAsync(cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        {
            try
            {
                return Ok(await _adminService.GetUsersAsync(page, pageSize, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _adminService.CreateUserAsync(request, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUser([FromRoute] string userId, [FromBody] AdminUpdateUserRequest request, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _adminService.UpdateUserAsync(userId, request, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPut("users/{userId}/lock")]
        public async Task<IActionResult> SetUserLock([FromRoute] string userId, [FromBody] AdminSetUserLockRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var actorUserId = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
                if (string.IsNullOrWhiteSpace(actorUserId)) throw new AppException("Không xác định được người dùng đăng nhập.", 401);

                return Ok(await _adminService.SetUserLockAsync(userId, actorUserId, request.IsLocked, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("deposits")]
        public async Task<IActionResult> GetDeposits([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        {
            try
            {
                return Ok(await _adminService.GetDepositsAsync(page, pageSize, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPut("deposits/{depositId}/status")]
        public async Task<IActionResult> UpdateDepositStatus([FromRoute] string depositId, [FromBody] AdminUpdateDepositStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _adminService.UpdateDepositStatusAsync(depositId, request, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpDelete("deposits/{depositId}")]
        public async Task<IActionResult> DeleteDeposit([FromRoute] string depositId, CancellationToken cancellationToken)
        {
            try
            {
                await _adminService.DeleteDepositAsync(depositId, cancellationToken);
                return Ok(new { success = true });
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("developer-requests")]
        public async Task<IActionResult> GetDeveloperRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
        {
            try
            {
                return Ok(await _adminService.GetDeveloperRequestsAsync(page, pageSize, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPut("developer-requests/{requestId}/status")]
        public async Task<IActionResult> UpdateDeveloperRequestStatus([FromRoute] string requestId, [FromBody] AdminUpdateDeveloperRequestStatusRequest request, CancellationToken cancellationToken)
        {
            try
            {
                return Ok(await _adminService.UpdateDeveloperRequestStatusAsync(requestId, request, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpDelete("developer-requests/{requestId}")]
        public async Task<IActionResult> DeleteDeveloperRequest([FromRoute] string requestId, CancellationToken cancellationToken)
        {
            try
            {
                await _adminService.DeleteDeveloperRequestAsync(requestId, cancellationToken);
                return Ok(new { success = true });
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Constants;
using VexPay.Exceptions;
using VexPay.Enums;
using VexPay.Models.Requests.Developer;
using VexPay.Services.Developer;
using VexPay.Services.Payments;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("projects")]
    [Authorize(Roles = RoleNames.Developer)]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly IProjectApiKeyService _apiKeyService;
        private readonly IPaymentService _paymentService;
        private readonly IProjectWebhookDeliveryService _webhookDeliveryService;

        public ProjectController(
            IProjectService projectService,
            IProjectApiKeyService apiKeyService,
            IPaymentService paymentService,
            IProjectWebhookDeliveryService webhookDeliveryService)
        {
            _projectService = projectService;
            _apiKeyService = apiKeyService;
            _paymentService = paymentService;
            _webhookDeliveryService = webhookDeliveryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                return Ok(await _projectService.GetByUserAsync(userId, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProjectRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrWhiteSpace(userId)) throw new UnauthorizedException("Không xác định được người dùng từ token.");

                return Ok(await _projectService.CreateAsync(userId, request.Name, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPatch("{projectId}/webhook")]
        public async Task<IActionResult> UpdateWebhook(
            string projectId,
            [FromBody] UpdateProjectWebhookRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                return Ok(await _projectService.UpdateWebhookAsync(
                    userId,
                    projectId,
                    request.WebhookUrl,
                    request.WebhookSecretEnabled,
                    request.WebhookRetryEnabled,
                    request.WebhookSecretKey,
                    cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("{projectId}/api-keys")]
        public async Task<IActionResult> ListApiKeys(string projectId, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                return Ok(await _apiKeyService.ListAsync(userId, projectId, cancellationToken));
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpPost("{projectId}/api-keys")]
        public async Task<IActionResult> IssueApiKey(string projectId, [FromBody] IssueProjectApiKeyRequest? request, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                var result = await _apiKeyService.IssueAsync(userId, projectId, request?.Name, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpDelete("{projectId}/api-keys/{keyId}")]
        public async Task<IActionResult> RevokeApiKey(string projectId, string keyId, CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                await _apiKeyService.RevokeAsync(userId, projectId, keyId, cancellationToken);
                return NoContent();
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("webhook-deliveries")]
        public async Task<IActionResult> ListAllWebhookDeliveries(
            [FromQuery] string? projectId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                var result = await _webhookDeliveryService.ListForUserAsync(
                    userId,
                    projectId,
                    page,
                    pageSize,
                    cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("{projectId}/webhook-deliveries")]
        public async Task<IActionResult> ListWebhookDeliveries(
            string projectId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                var result = await _webhookDeliveryService.ListAsync(userId, projectId, page, pageSize, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("payments")]
        public async Task<IActionResult> ListAllPayments(
            [FromQuery] string? projectId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] PaymentIntentStatus? status = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                var result = await _paymentService.ListForUserAsync(
                    userId,
                    projectId,
                    page,
                    pageSize,
                    status,
                    cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("{projectId}/payments")]
        public async Task<IActionResult> ListPayments(
            string projectId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] PaymentIntentStatus? status = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                await EnsureOwnedAsync(userId, projectId, cancellationToken);
                var result = await _paymentService.ListAsync(projectId, page, pageSize, status, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> StatsAll(
            [FromQuery] string? projectId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var userId = GetUserIdOrThrow();

                var toExclusive = (to ?? DateTime.Now.Date.AddDays(1));
                var fromInclusive = (from ?? toExclusive.AddDays(-30));
                if (fromInclusive >= toExclusive)
                {
                    return BadRequest(new { message = "Khoảng thời gian không hợp lệ." });
                }

                var stats = await _paymentService.GetStatsForUserAsync(
                    userId,
                    projectId,
                    fromInclusive,
                    toExclusive,
                    cancellationToken);
                return Ok(stats);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        [HttpGet("{projectId}/stats")]
        public async Task<IActionResult> Stats(
            string projectId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            CancellationToken cancellationToken)
        {
            try
            {
                var userId = GetUserIdOrThrow();
                await EnsureOwnedAsync(userId, projectId, cancellationToken);

                var toExclusive = (to ?? DateTime.Now.Date.AddDays(1));
                var fromInclusive = (from ?? toExclusive.AddDays(-30));
                if (fromInclusive >= toExclusive)
                {
                    return BadRequest(new { message = "Khoảng thời gian không hợp lệ." });
                }

                var stats = await _paymentService.GetStatsAsync(projectId, fromInclusive, toExclusive, cancellationToken);
                return Ok(stats);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message });
            }
        }

        private async Task EnsureOwnedAsync(string userId, string projectId, CancellationToken cancellationToken)
        {
            var owned = await _projectService.IsOwnedByAsync(userId, projectId, cancellationToken);
            if (!owned) throw new AppException("Không tìm thấy project.", 404);
        }

        private string GetUserIdOrThrow()
        {
            var userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedException("Không xác định được người dùng từ token.");
            }
            return userId;
        }
    }
}

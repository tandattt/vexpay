using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Constants;
using VexPay.Exceptions;
using VexPay.Models.Requests.Developer;
using VexPay.Services.Developer;

namespace VexPay.Controllers
{
    [ApiController]
    [Route("projects")]
    [Authorize(Roles = RoleNames.Developer)]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
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
    }
}

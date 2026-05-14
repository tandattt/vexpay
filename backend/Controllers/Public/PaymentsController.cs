using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VexPay.Base.Authorization;
using VexPay.Enums;
using VexPay.Exceptions;
using VexPay.Models.Requests.Payments;
using VexPay.Models.Response.Common;
using VexPay.Models.Response.Payments;
using VexPay.OpenApi;
using VexPay.Services.Payments;

namespace VexPay.Controllers.Public
{
    /// <summary>
    /// API thanh toán công khai cho nhà phát triển tích hợp VexPay.
    /// </summary>
    [ApiController]
    [AllowAnonymous]
    [ApiKeyAuth]
    [ApiExplorerSettings(GroupName = OpenApiDocumentNames.PublicV1)]
    [Route("v1/payments")]
    [Produces("application/json")]
    [Tags("Payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /// <summary>
        /// Tạo payment intent mới.
        /// </summary>
        /// <remarks>
        /// Tạo giao dịch chờ thanh toán.
        /// BankTransfer: trả `qr_image_url` là URL ảnh PNG tĩnh (embed/hiển thị trực tiếp).
        /// Wallet: trả `checkout_url` — redirect khách sang trang thanh toán VexPay.
        /// Chuyển khoản tối thiểu 10.000 VND; ví tối thiểu 1 VND.
        /// </remarks>
        /// <response code="200">Payment intent đã tạo.</response>
        /// <response code="400">Số tiền hoặc dữ liệu không hợp lệ.</response>
        /// <response code="401">API key không hợp lệ.</response>
        /// <response code="409">merchant_ref đã tồn tại.</response>
        [HttpPost]
        [ProducesResponseType(typeof(PaymentIntentResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var projectId = HttpContext.GetProjectId();
                var result = await _paymentService.CreateAsync(projectId, request, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>
        /// Danh sách payment intent của dự án.
        /// </summary>
        /// <response code="200">Danh sách có phân trang.</response>
        /// <response code="401">API key không hợp lệ.</response>
        [HttpGet]
        [ProducesResponseType(typeof(PaymentIntentPagedResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> List(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] PaymentIntentStatus? status = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var projectId = HttpContext.GetProjectId();
                var result = await _paymentService.ListAsync(projectId, page, pageSize, status, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy chi tiết một payment intent.
        /// </summary>
        /// <response code="200">Chi tiết payment.</response>
        /// <response code="401">API key không hợp lệ.</response>
        /// <response code="404">Không tìm thấy payment.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PaymentIntentResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(string id, CancellationToken cancellationToken)
        {
            try
            {
                var projectId = HttpContext.GetProjectId();
                var result = await _paymentService.GetAsync(projectId, id, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>
        /// Tải ảnh QR thanh toán (PNG).
        /// </summary>
        /// <response code="200">Ảnh PNG nhị phân.</response>
        /// <response code="401">API key không hợp lệ.</response>
        /// <response code="404">QR không tồn tại hoặc payment đã hoàn tất.</response>
        [HttpGet("{id}/qr")]
        [Produces("image/png")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetQr(string id, CancellationToken cancellationToken)
        {
            try
            {
                var projectId = HttpContext.GetProjectId();
                var bytes = await _paymentService.GetQrImageAsync(projectId, id, cancellationToken);
                return File(bytes, "image/png");
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }

        /// <summary>
        /// Hủy payment intent đang chờ thanh toán.
        /// </summary>
        /// <remarks>
        /// Dùng khi tích hợp <c>method = BankTransfer</c> (0): merchant tự hiển thị QR và gọi API này khi khách/bạn hủy đơn.
        /// Chỉ hủy được khi <c>status = AwaitingTransfer</c>. Xóa file QR tĩnh (nếu có) và gửi webhook <c>payment_cancelled</c>.
        /// Không cần JWT — xác thực bằng API key của project (header <c>X-API-Key</c> hoặc <c>Authorization: Bearer</c>).
        /// </remarks>
        /// <response code="200">Payment đã hủy (status = Cancelled).</response>
        /// <response code="401">API key không hợp lệ.</response>
        /// <response code="404">Không tìm thấy payment.</response>
        /// <response code="409">Payment không ở trạng thái chờ thanh toán hoặc đã hết hạn.</response>
        [HttpPost("{id}/cancel")]
        [ProducesResponseType(typeof(PaymentIntentResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Cancel(string id, CancellationToken cancellationToken)
        {
            try
            {
                var projectId = HttpContext.GetProjectId();
                var result = await _paymentService.CancelAsync(projectId, id, cancellationToken);
                return Ok(result);
            }
            catch (AppException ex)
            {
                return StatusCode(ex.StatusCode, new ApiMessageResponse { Message = ex.Message });
            }
        }
    }
}

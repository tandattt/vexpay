namespace VexPay.Models.Response.Common
{
    /// <summary>
    /// Phản hồi lỗi chuẩn.
    /// </summary>
    public class ApiMessageResponse
    {
        /// <summary>Thông báo mô tả lỗi.</summary>
        /// <example>Số tiền tối thiểu là 10.000 VND.</example>
        public string Message { get; set; } = string.Empty;
    }
}

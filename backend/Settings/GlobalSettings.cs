namespace VexPay.Settings
{
    public class GlobalSettings
    {
        public int QrImageExpirationMinutes { get; set; } = 15;

        /// <summary>Tổng số lần gửi webhook tối đa khi bật retry (gồm lần đầu).</summary>
        public int WebhookMaxAttempts { get; set; } = 5;

        /// <summary>Backoff giữa các lần retry (giây), theo thứ tự sau mỗi lần thất bại.</summary>
        public int[] WebhookRetryDelaySeconds { get; set; } = [30, 120, 600, 1800];

        /// <summary>URL gốc frontend (checkout ví), ví dụ https://app.vexpay.vn</summary>
        public string FrontendUrl { get; set; } = "http://localhost:5173";
    }
}

using System.ComponentModel;

namespace VexPay.Enums
{
    public enum PaymentIntentStatus
    {
        [Description("Đang chờ khách chuyển khoản.")]
        AwaitingTransfer = 0,

        [Description("Đã thanh toán thành công.")]
        Paid = 1,

        [Description("Thanh toán thất bại (sai số tiền, v.v.).")]
        Failed = 2,

        [Description("Hết hạn chờ thanh toán.")]
        Expired = 3,

        [Description("Đã hủy bởi merchant hoặc hệ thống.")]
        Cancelled = 4,
    }
}

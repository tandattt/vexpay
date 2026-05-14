using System.ComponentModel;

namespace VexPay.Enums
{
    public enum PaymentMethod
    {
        [Description("Chuyển khoản ngân hàng (QR). Tối thiểu 10.000 VND.")]
        BankTransfer = 0,

        [Description("Thanh toán bằng số dư ví VexPay. Tối thiểu 1 VND.")]
        Wallet = 1,
    }
}

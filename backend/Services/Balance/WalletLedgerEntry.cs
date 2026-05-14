using VexPay.Enums;

namespace VexPay.Services.Balance
{
    public record WalletLedgerEntry(
        WalletTransactionType Type,
        string ReferenceId,
        string Description);
}

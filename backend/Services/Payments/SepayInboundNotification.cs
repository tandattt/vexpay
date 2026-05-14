namespace VexPay.Services.Payments
{
    public sealed class SepayInboundNotification
    {
        public long TransactionId { get; init; }

        public string Content { get; init; } = string.Empty;

        public string? Code { get; init; }

        public string? ReferenceCode { get; init; }

        public string? Description { get; init; }

        public long TransferAmount { get; init; }

        public string SearchText { get; init; } = string.Empty;

        public static SepayInboundNotification FromWebhook(
            long transactionId,
            string content,
            string? code,
            string? referenceCode,
            string? description,
            long transferAmount)
        {
            var parts = new[] { content, code, referenceCode, description }
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim());

            return new SepayInboundNotification
            {
                TransactionId = transactionId,
                Content = content?.Trim() ?? string.Empty,
                Code = string.IsNullOrWhiteSpace(code) ? null : code.Trim(),
                ReferenceCode = string.IsNullOrWhiteSpace(referenceCode) ? null : referenceCode.Trim(),
                Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                TransferAmount = transferAmount,
                SearchText = string.Join(' ', parts),
            };
        }
    }

    internal static class SepayTransferMatcher
    {
        public static bool MatchesTransferCode(string transferCode, SepayInboundNotification notification)
        {
            if (string.IsNullOrWhiteSpace(transferCode))
            {
                return false;
            }

            if (!string.IsNullOrWhiteSpace(notification.Code)
                && MatchesCodeValue(transferCode, notification.Code))
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(notification.SearchText))
            {
                return false;
            }

            if (notification.SearchText.Contains(transferCode, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (transferCode.Length > 2
                && transferCode.StartsWith("VP", StringComparison.OrdinalIgnoreCase)
                && notification.SearchText.Contains(transferCode[2..], StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        public static bool MatchesDepositCode(string depositCode, SepayInboundNotification notification)
        {
            if (string.IsNullOrWhiteSpace(depositCode))
            {
                return false;
            }

            if (!string.IsNullOrWhiteSpace(notification.Code)
                && notification.Code.Equals(depositCode, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return !string.IsNullOrWhiteSpace(notification.SearchText)
                && notification.SearchText.Contains(depositCode, StringComparison.OrdinalIgnoreCase);
        }

        private static bool MatchesCodeValue(string transferCode, string sepayCode)
        {
            if (sepayCode.Equals(transferCode, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (transferCode.Length > 2
                && transferCode.StartsWith("VP", StringComparison.OrdinalIgnoreCase)
                && sepayCode.Equals(transferCode[2..], StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return transferCode.StartsWith("VP", StringComparison.OrdinalIgnoreCase)
                && sepayCode.StartsWith("VP", StringComparison.OrdinalIgnoreCase)
                && transferCode.AsSpan(2).Equals(sepayCode.AsSpan(2), StringComparison.OrdinalIgnoreCase);
        }
    }
}

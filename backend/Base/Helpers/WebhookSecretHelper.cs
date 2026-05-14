namespace VexPay.Base.Helpers
{
    public static class WebhookSecretHelper
    {
        private const int VisiblePrefixLength = 4;
        private const int VisibleSuffixLength = 4;
        private const string MaskToken = "••••";

        public sealed record SecretHints(string Prefix, string Last4, string Mask);

        public static SecretHints ExtractHints(string secret)
        {
            ArgumentException.ThrowIfNullOrEmpty(secret);

            if (secret.Length <= VisiblePrefixLength)
            {
                var prefix = secret[..1];
                var last4 = secret[^1..];
                return new SecretHints(prefix, last4, $"{prefix}{MaskToken}");
            }

            if (secret.Length <= VisiblePrefixLength + VisibleSuffixLength)
            {
                var prefix = secret[..VisiblePrefixLength];
                var last4 = secret[^Math.Min(VisibleSuffixLength, secret.Length - VisiblePrefixLength)..];
                return new SecretHints(prefix, last4, $"{prefix}{MaskToken}{last4}");
            }

            var visiblePrefix = secret[..VisiblePrefixLength];
            var visibleLast4 = secret[^VisibleSuffixLength..];
            return new SecretHints(visiblePrefix, visibleLast4, $"{visiblePrefix}{MaskToken}{visibleLast4}");
        }

        public static string? BuildMask(string? secret)
        {
            if (string.IsNullOrEmpty(secret)) return null;
            return ExtractHints(secret).Mask;
        }

        public static string? BuildMask(string? prefix, string? last4, string? secret)
        {
            if (!string.IsNullOrEmpty(prefix) && !string.IsNullOrEmpty(last4))
            {
                return $"{prefix}{MaskToken}{last4}";
            }

            return BuildMask(secret);
        }
    }
}

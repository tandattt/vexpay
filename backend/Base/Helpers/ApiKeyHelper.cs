using System.Security.Cryptography;
using System.Text;

namespace VexPay.Base.Helpers
{
    public static class ApiKeyHelper
    {
        public const string Prefix = "vex_live_";
        private const int PrefixRandomLength = 8;
        private const int SecretLength = 32;
        private const string Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        public sealed record GeneratedKey(string Raw, string PublicPrefix, string Last4, string Hash);

        public static GeneratedKey Generate()
        {
            var publicPrefix = Prefix + RandomNumberGenerator.GetString(Charset, PrefixRandomLength);
            var secret = RandomNumberGenerator.GetString(Charset, SecretLength);
            var raw = $"{publicPrefix}_{secret}";
            var last4 = raw[^4..];
            var hash = ComputeHash(raw);
            return new GeneratedKey(raw, publicPrefix, last4, hash);
        }

        public static string ComputeHash(string raw)
        {
            ArgumentException.ThrowIfNullOrEmpty(raw);
            var bytes = Encoding.UTF8.GetBytes(raw);
            var hash = SHA256.HashData(bytes);
            var sb = new StringBuilder(hash.Length * 2);
            foreach (var b in hash)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        public static bool TryExtractPublicPrefix(string raw, out string publicPrefix)
        {
            publicPrefix = string.Empty;
            if (string.IsNullOrWhiteSpace(raw)) return false;
            if (!raw.StartsWith(Prefix, StringComparison.Ordinal)) return false;

            var lastUnderscore = raw.LastIndexOf('_');
            if (lastUnderscore <= Prefix.Length - 1) return false;

            publicPrefix = raw[..lastUnderscore];
            return publicPrefix.Length == Prefix.Length + PrefixRandomLength;
        }

        public static bool FixedTimeEquals(string a, string b)
        {
            if (a.Length != b.Length) return false;
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(a),
                Encoding.UTF8.GetBytes(b));
        }
    }
}

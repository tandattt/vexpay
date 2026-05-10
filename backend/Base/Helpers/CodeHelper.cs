using System.Security.Cryptography;

namespace VexPay.Base.Helpers
{
    public static class CodeHelper
    {
        private const string Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        public static string Generate(int length = 6)
        {
            if (length <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(length), "Length must be greater than zero.");
            }

            return RandomNumberGenerator.GetString(Characters, length);
        }
    }
}

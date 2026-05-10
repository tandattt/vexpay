namespace VexPay.Base.Helpers
{
    public static class PasswordHelper
    {
        private const int DefaultWorkFactor = 12;

        public static string Hash(string plainPassword)
        {
            if (string.IsNullOrEmpty(plainPassword))
                throw new ArgumentException("Password must not be empty.", nameof(plainPassword));

            return BCrypt.Net.BCrypt.HashPassword(plainPassword, DefaultWorkFactor);
        }

        public static bool Verify(string plainPassword, string hashedPassword)
        {
            if (string.IsNullOrEmpty(plainPassword) || string.IsNullOrEmpty(hashedPassword))
                return false;

            try
            {
                return BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return false;
            }
        }
    }
}

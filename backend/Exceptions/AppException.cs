namespace VexPay.Exceptions
{
    public class AppException : Exception
    {
        public int StatusCode { get; }

        public AppException(string message, int statusCode = 400) : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message = "Unauthorized") : base(message, 401) { }
    }
}

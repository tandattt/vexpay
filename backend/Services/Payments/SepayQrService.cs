using Microsoft.Extensions.Options;
using VexPay.Settings;

namespace VexPay.Services.Payments
{
    public interface ISepayQrService
    {
        Task<(string RelativePath, byte[] Bytes, string FullPath)> GenerateAsync(
            string code,
            decimal amount,
            string fileNameWithoutExtension,
            CancellationToken cancellationToken = default);

        void DeleteRelative(string? relativePath);

        string GetFullPath(string relativePath);
    }

    public class SepayQrService : ISepayQrService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IWebHostEnvironment _env;
        private readonly SepaySettings _sepay;

        public SepayQrService(
            IHttpClientFactory httpClientFactory,
            IWebHostEnvironment env,
            IOptions<SepaySettings> sepay)
        {
            _httpClientFactory = httpClientFactory;
            _env = env;
            _sepay = sepay.Value;
        }

        public async Task<(string RelativePath, byte[] Bytes, string FullPath)> GenerateAsync(
            string code,
            decimal amount,
            string fileNameWithoutExtension,
            CancellationToken cancellationToken = default)
        {
            var qrUrl = BuildQrUrl(_sepay.AccountNumber, _sepay.BankCode, amount, code, _sepay.QrTemplate, true);
            var client = _httpClientFactory.CreateClient();
            var bytes = await client.GetByteArrayAsync(qrUrl, cancellationToken);

            var webRoot = ResolveWebRoot();
            var dir = Path.Combine(webRoot, "qrs");
            Directory.CreateDirectory(dir);

            var fileName = $"{fileNameWithoutExtension}.png";
            var fullPath = Path.Combine(dir, fileName);
            await File.WriteAllBytesAsync(fullPath, bytes, cancellationToken);

            return ($"qrs/{fileName}", bytes, fullPath);
        }

        public void DeleteRelative(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return;

            var fullPath = GetFullPath(relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        public string GetFullPath(string relativePath)
        {
            var webRoot = ResolveWebRoot();
            var normalized = relativePath.Replace('/', Path.DirectorySeparatorChar);
            return Path.Combine(webRoot, normalized);
        }

        private string ResolveWebRoot() =>
            !string.IsNullOrWhiteSpace(_env.WebRootPath)
                ? _env.WebRootPath
                : Path.Combine(_env.ContentRootPath, "wwwroot");

        private static string BuildQrUrl(string acc, string bank, decimal amount, string description, string template, bool download)
        {
            var query = new Dictionary<string, string>
            {
                ["acc"] = acc,
                ["bank"] = bank,
                ["amount"] = decimal.Truncate(amount).ToString(),
                ["des"] = description,
                ["template"] = template,
                ["download"] = download ? "true" : "false",
            };

            var queryString = string.Join("&", query.Select(x => $"{Uri.EscapeDataString(x.Key)}={Uri.EscapeDataString(x.Value)}"));
            return $"https://qr.sepay.vn/img?{queryString}";
        }
    }
}

using System.Text.Json.Serialization;

namespace VexPay.Models.Requests.Sepay
{
    public class IPNRequest
    {
        [JsonPropertyName("timestamp")]
        public long Timestamp { get; set; }

        [JsonPropertyName("notification_type")]
        public string NotificationType { get; set; } = string.Empty;

        [JsonPropertyName("order")]
        public OrderData? Order { get; set; }

        [JsonPropertyName("transaction")]
        public TransactionData? Transaction { get; set; }

        [JsonPropertyName("customer")]
        public CustomerData? Customer { get; set; }

        [JsonPropertyName("agreement")]
        public AgreementData? Agreement { get; set; }
    }

    public class OrderData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("order_id")]
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("order_status")]
        public string OrderStatus { get; set; } = string.Empty;

        [JsonPropertyName("order_currency")]
        public string OrderCurrency { get; set; } = string.Empty;

        [JsonPropertyName("order_amount")]
        public string OrderAmount { get; set; } = string.Empty;

        [JsonPropertyName("order_invoice_number")]
        public string OrderInvoiceNumber { get; set; } = string.Empty;

        [JsonPropertyName("custom_data")]
        public List<object> CustomData { get; set; } = new();

        [JsonPropertyName("user_agent")]
        public string UserAgent { get; set; } = string.Empty;

        [JsonPropertyName("ip_address")]
        public string IpAddress { get; set; } = string.Empty;

        [JsonPropertyName("order_description")]
        public string OrderDescription { get; set; } = string.Empty;
    }

    public class TransactionData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("payment_method")]
        public string PaymentMethod { get; set; } = string.Empty;

        [JsonPropertyName("transaction_id")]
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("transaction_type")]
        public string TransactionType { get; set; } = string.Empty;

        [JsonPropertyName("transaction_date")]
        public string TransactionDate { get; set; } = string.Empty;

        [JsonPropertyName("transaction_status")]
        public string TransactionStatus { get; set; } = string.Empty;

        [JsonPropertyName("transaction_amount")]
        public string TransactionAmount { get; set; } = string.Empty;

        [JsonPropertyName("transaction_currency")]
        public string TransactionCurrency { get; set; } = string.Empty;

        [JsonPropertyName("authentication_status")]
        public string AuthenticationStatus { get; set; } = string.Empty;

        [JsonPropertyName("card_number")]
        public string? CardNumber { get; set; }

        [JsonPropertyName("card_holder_name")]
        public string? CardHolderName { get; set; }

        [JsonPropertyName("card_expiry")]
        public string? CardExpiry { get; set; }

        [JsonPropertyName("card_funding_method")]
        public string? CardFundingMethod { get; set; }

        [JsonPropertyName("card_brand")]
        public string? CardBrand { get; set; }
    }

    public class CustomerData
    {
    }

    public class AgreementData
    {
    }
}

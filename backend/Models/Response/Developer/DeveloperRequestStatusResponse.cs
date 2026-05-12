namespace VexPay.Models.Response.Developer
{
    public class DeveloperRequestStatusResponse
    {
        public bool IsDeveloper { get; set; }
        public bool HasPendingRequest { get; set; }
        public string? RequestStatus { get; set; }
    }
}

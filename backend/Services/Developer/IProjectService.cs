using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public interface IProjectService
    {
        Task<IReadOnlyList<ProjectItemResponse>> GetByUserAsync(string userId, CancellationToken cancellationToken = default);
        Task<ProjectItemResponse> CreateAsync(string userId, string name, CancellationToken cancellationToken = default);
    }
}

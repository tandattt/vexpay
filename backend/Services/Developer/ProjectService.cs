using Microsoft.EntityFrameworkCore;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Exceptions;
using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _db;

        public ProjectService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<ProjectItemResponse>> GetByUserAsync(string userId, CancellationToken cancellationToken = default)
        {
            return await _db.Projects
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new ProjectItemResponse
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Name = x.Name,
                    CreatedAt = x.CreatedAt,
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<ProjectItemResponse> CreateAsync(string userId, string name, CancellationToken cancellationToken = default)
        {
            var normalizedName = name?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(normalizedName)) throw new AppException("Tên project không hợp lệ.", 400);

            var userExists = await _db.Users.AnyAsync(x => x.Id == userId, cancellationToken);
            if (!userExists) throw new AppException("Không tìm thấy người dùng.", 404);

            var exists = await _db.Projects.AnyAsync(x => x.UserId == userId && x.Name == normalizedName, cancellationToken);
            if (exists) throw new AppException("Project đã tồn tại.", 400);

            var entity = new Project
            {
                UserId = userId,
                Name = normalizedName,
            };

            _db.Projects.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);

            return new ProjectItemResponse
            {
                Id = entity.Id,
                UserId = entity.UserId,
                Name = entity.Name,
                CreatedAt = entity.CreatedAt,
            };
        }
    }
}

using Microsoft.EntityFrameworkCore;
using VexPay.Constants;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Enums;
using VexPay.Exceptions;
using VexPay.Models.Response.Developer;

namespace VexPay.Services.Developer
{
    public class DeveloperRequestService : IDeveloperRequestService
    {
        private readonly AppDbContext _db;

        public DeveloperRequestService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<DeveloperRequestStatusResponse> GetStatusAsync(string userId, CancellationToken cancellationToken = default)
        {
            var isDeveloper = await IsDeveloperAsync(userId, cancellationToken);
            var request = await _db.DeveloperRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

            return new DeveloperRequestStatusResponse
            {
                IsDeveloper = isDeveloper && request?.Status != DeveloperRequestStatus.Revoked.ToString(),
                HasPendingRequest = request?.Status == DeveloperRequestStatus.Pending.ToString(),
                RequestStatus = request?.Status,
            };
        }

        public async Task<DeveloperRequestStatusResponse> CreateRequestAsync(string userId, CancellationToken cancellationToken = default)
        {
            var isDeveloper = await IsDeveloperAsync(userId, cancellationToken);
            if (isDeveloper)
            {
                throw new AppException("Bạn đã là nhà phát triển.", 400);
            }

            var request = await _db.DeveloperRequests
                .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

            if (request?.Status == DeveloperRequestStatus.Pending.ToString())
            {
                throw new AppException("Bạn đã gửi yêu cầu trước đó và đang chờ duyệt.", 400);
            }

            if (request?.Status == DeveloperRequestStatus.Approved.ToString())
            {
                throw new AppException("Yêu cầu của bạn đã được chấp nhận.", 400);
            }

            if (request is null)
            {
                _db.DeveloperRequests.Add(new DeveloperRequest
                {
                    UserId = userId,
                    Status = DeveloperRequestStatus.Pending.ToString(),
                    RequestedAt = DateTime.Now,
                });
            }
            else
            {
                request.Status = DeveloperRequestStatus.Pending.ToString();
                request.RequestedAt = DateTime.Now;
            }

            await _db.SaveChangesAsync(cancellationToken);

            return new DeveloperRequestStatusResponse
            {
                IsDeveloper = false,
                HasPendingRequest = true,
                RequestStatus = DeveloperRequestStatus.Pending.ToString(),
            };
        }

        private async Task<bool> IsDeveloperAsync(string userId, CancellationToken cancellationToken)
        {
            return await _db.UserRoles
                .AsNoTracking()
                .Include(x => x.Role)
                .AnyAsync(x => x.UserId == userId && x.Role != null && x.Role.Name == RoleNames.Developer, cancellationToken);
        }
    }
}

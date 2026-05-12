using Microsoft.EntityFrameworkCore;
using VexPay.Base.Helpers;
using VexPay.Constants;
using VexPay.Data;
using VexPay.Entities;
using VexPay.Enums;
using VexPay.Exceptions;
using VexPay.Models.Requests.Admin;
using VexPay.Models.Response.Admin;

namespace VexPay.Services.Admin
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _db;

        public AdminService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<AdminSummaryResponse> GetSummaryAsync(CancellationToken cancellationToken = default)
        {
            var totalUsers = await _db.Users.AsNoTracking().CountAsync(cancellationToken);
            var totalDeposits = await _db.DepositHistories.AsNoTracking().CountAsync(cancellationToken);
            var totalDepositAmount = await _db.DepositHistories
                .AsNoTracking()
                .Where(x => x.Status == DepositStatus.Completed)
                .SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
            var pendingDeposits = await _db.DepositHistories
                .AsNoTracking()
                .CountAsync(x => x.Status == DepositStatus.Pending, cancellationToken);
            var pendingDeveloperRequests = await _db.DeveloperRequests
                .AsNoTracking()
                .CountAsync(x => x.Status == DeveloperRequestStatus.Pending.ToString(), cancellationToken);

            return new AdminSummaryResponse
            {
                TotalUsers = totalUsers,
                TotalDeposits = totalDeposits,
                TotalDepositAmount = totalDepositAmount,
                PendingDeposits = pendingDeposits,
                PendingDeveloperRequests = pendingDeveloperRequests,
            };
        }

        public async Task<AdminPagedResponse<AdminUserItemResponse>> GetUsersAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);
            var query = _db.Users
                .AsNoTracking()
                .Include(x => x.UserRoles)
                .ThenInclude(x => x.Role)
                .OrderByDescending(x => x.CreatedAt);
            var totalItems = await query.CountAsync(cancellationToken);
            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return ToPaged(users.Select(MapUser).ToList(), page, pageSize, totalItems);
        }

        public async Task<AdminUserItemResponse> CreateUserAsync(AdminCreateUserRequest request, CancellationToken cancellationToken = default)
        {
            ValidateUserRequest(request.FullName, request.PhoneNumber, request.Email, request.Roles);
            if (string.IsNullOrWhiteSpace(request.Username)) throw new AppException("Username không hợp lệ.", 400);
            if (string.IsNullOrWhiteSpace(request.Password)) throw new AppException("Password không hợp lệ.", 400);

            var exists = await _db.Users.AnyAsync(x => x.Username == request.Username || x.Email == request.Email || x.PhoneNumber == request.PhoneNumber, cancellationToken);
            if (exists) throw new AppException("Username, email hoặc số điện thoại đã tồn tại.", 400);

            var roles = await LoadRolesAsync(request.Roles, cancellationToken);
            var user = new User
            {
                Username = request.Username.Trim(),
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber.Trim(),
                Email = request.Email.Trim(),
                Password = PasswordHelper.Hash(request.Password),
                Code = await GenerateUniqueUserCodeAsync(cancellationToken),
            };

            _db.Users.Add(user);
            foreach (var role in roles)
            {
                user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            }

            await _db.SaveChangesAsync(cancellationToken);
            return MapUser(user);
        }

        public async Task<AdminUserItemResponse> UpdateUserAsync(string userId, AdminUpdateUserRequest request, CancellationToken cancellationToken = default)
        {
            ValidateUserRequest(request.FullName, request.PhoneNumber, request.Email, request.Roles);

            var user = await _db.Users
                .Include(x => x.UserRoles)
                .ThenInclude(x => x.Role)
                .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken) ?? throw new AppException("Không tìm thấy người dùng.", 404);

            var duplicate = await _db.Users.AnyAsync(x => x.Id != userId && (x.Email == request.Email || x.PhoneNumber == request.PhoneNumber), cancellationToken);
            if (duplicate) throw new AppException("Email hoặc số điện thoại đã tồn tại.", 400);

            var hadDeveloperRole = user.UserRoles.Any(x => x.Role != null && x.Role.Name == RoleNames.Developer);
            var roles = await LoadRolesAsync(request.Roles, cancellationToken);
            var hasDeveloperRoleAfterUpdate = roles.Any(x => x.Name == RoleNames.Developer);

            user.FullName = request.FullName.Trim();
            user.PhoneNumber = request.PhoneNumber.Trim();
            user.Email = request.Email.Trim();
            user.UserRoles.Clear();
            foreach (var role in roles)
            {
                user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            }

            if (hadDeveloperRole && !hasDeveloperRoleAfterUpdate)
            {
                var developerRequest = await _db.DeveloperRequests.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
                if (developerRequest != null)
                {
                    developerRequest.Status = DeveloperRequestStatus.Revoked.ToString();
                }
            }
            else if (!hadDeveloperRole && hasDeveloperRoleAfterUpdate)
            {
                var developerRequest = await _db.DeveloperRequests.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
                if (developerRequest == null)
                {
                    _db.DeveloperRequests.Add(new DeveloperRequest
                    {
                        UserId = user.Id,
                        Status = DeveloperRequestStatus.Approved.ToString(),
                        RequestedAt = DateTime.Now,
                    });
                }
                else if (developerRequest.Status == DeveloperRequestStatus.Pending.ToString())
                {
                    developerRequest.Status = DeveloperRequestStatus.Approved.ToString();
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
            return MapUser(user);
        }

        public async Task<AdminUserItemResponse> SetUserLockAsync(string userId, string actorUserId, bool isLocked, CancellationToken cancellationToken = default)
        {
            if (userId == actorUserId) throw new AppException("Không thể tự khóa tài khoản đang đăng nhập.", 400);

            var user = await _db.Users
                .Include(x => x.UserRoles)
                .ThenInclude(x => x.Role)
                .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken) ?? throw new AppException("Không tìm thấy người dùng.", 404);

            var isTargetAdmin = user.UserRoles.Any(x => x.Role != null && x.Role.Name == RoleNames.Admin);
            if (isTargetAdmin) throw new AppException("Không thể khóa tài khoản ADMIN.", 400);

            user.IsLocked = isLocked;
            await _db.SaveChangesAsync(cancellationToken);
            return MapUser(user);
        }

        public async Task<AdminPagedResponse<AdminDepositItemResponse>> GetDepositsAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);
            var query = _db.DepositHistories
                .AsNoTracking()
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt);
            var totalItems = await query.CountAsync(cancellationToken);
            var deposits = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return ToPaged(deposits.Select(MapDeposit).ToList(), page, pageSize, totalItems);
        }

        public async Task<AdminDepositItemResponse> UpdateDepositStatusAsync(string depositId, AdminUpdateDepositStatusRequest request, CancellationToken cancellationToken = default)
        {
            var deposit = await _db.DepositHistories
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == depositId, cancellationToken) ?? throw new AppException("Không tìm thấy giao dịch nạp.", 404);

            if (!Enum.TryParse<DepositStatus>(request.Status, true, out var status)) throw new AppException("Trạng thái nạp không hợp lệ.", 400);
            deposit.Status = status;
            deposit.PaidAt = status == DepositStatus.Completed ? DateTime.Now : deposit.PaidAt;
            await _db.SaveChangesAsync(cancellationToken);
            return MapDeposit(deposit);
        }

        public async Task DeleteDepositAsync(string depositId, CancellationToken cancellationToken = default)
        {
            var deposit = await _db.DepositHistories.FirstOrDefaultAsync(x => x.Id == depositId, cancellationToken) ?? throw new AppException("Không tìm thấy giao dịch nạp.", 404);
            _db.DepositHistories.Remove(deposit);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<AdminPagedResponse<AdminDeveloperRequestItemResponse>> GetDeveloperRequestsAsync(int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);
            var query = _db.DeveloperRequests
                .AsNoTracking()
                .Include(x => x.User)
                .OrderByDescending(x => x.RequestedAt);
            var totalItems = await query.CountAsync(cancellationToken);
            var requests = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return ToPaged(requests.Select(MapDeveloperRequest).ToList(), page, pageSize, totalItems);
        }

        public async Task<AdminDeveloperRequestItemResponse> UpdateDeveloperRequestStatusAsync(string requestId, AdminUpdateDeveloperRequestStatusRequest request, CancellationToken cancellationToken = default)
        {
            var developerRequest = await _db.DeveloperRequests
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken) ?? throw new AppException("Không tìm thấy yêu cầu developer.", 404);

            if (!Enum.TryParse<DeveloperRequestStatus>(request.Status, true, out var status)) throw new AppException("Trạng thái developer request không hợp lệ.", 400);
            developerRequest.Status = status.ToString();

            var developerRole = await _db.Roles.FirstOrDefaultAsync(x => x.Name == RoleNames.Developer, cancellationToken) ?? throw new AppException("Thiếu role DEVELOPER.", 500);
            if (status == DeveloperRequestStatus.Approved)
            {
                var hasRole = await _db.UserRoles.AnyAsync(x => x.UserId == developerRequest.UserId && x.RoleId == developerRole.Id, cancellationToken);
                if (!hasRole)
                {
                    _db.UserRoles.Add(new UserRole { UserId = developerRequest.UserId, RoleId = developerRole.Id });
                }
            }
            else if (status == DeveloperRequestStatus.Revoked)
            {
                var existingRole = await _db.UserRoles.FirstOrDefaultAsync(x => x.UserId == developerRequest.UserId && x.RoleId == developerRole.Id, cancellationToken);
                if (existingRole != null)
                {
                    _db.UserRoles.Remove(existingRole);
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
            return MapDeveloperRequest(developerRequest);
        }

        public async Task DeleteDeveloperRequestAsync(string requestId, CancellationToken cancellationToken = default)
        {
            var request = await _db.DeveloperRequests.FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken) ?? throw new AppException("Không tìm thấy yêu cầu developer.", 404);
            _db.DeveloperRequests.Remove(request);
            await _db.SaveChangesAsync(cancellationToken);
        }

        private static AdminUserItemResponse MapUser(User user)
        {
            return new AdminUserItemResponse
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Code = user.Code,
                Roles = user.UserRoles.Select(x => x.Role?.Name).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!).ToArray(),
                IsLocked = user.IsLocked,
                CreatedAt = user.CreatedAt,
            };
        }

        private static AdminDepositItemResponse MapDeposit(DepositHistory deposit)
        {
            return new AdminDepositItemResponse
            {
                Id = deposit.Id,
                UserId = deposit.UserId,
                UserName = deposit.User?.Username ?? string.Empty,
                Code = deposit.Code,
                Amount = deposit.Amount,
                Status = deposit.Status.ToString(),
                Method = deposit.Method.ToString(),
                CreatedAt = deposit.CreatedAt,
                PaidAt = deposit.PaidAt,
            };
        }

        private static AdminDeveloperRequestItemResponse MapDeveloperRequest(DeveloperRequest request)
        {
            return new AdminDeveloperRequestItemResponse
            {
                Id = request.Id,
                UserId = request.UserId,
                UserName = request.User?.Username ?? string.Empty,
                Status = request.Status,
                RequestedAt = request.RequestedAt,
            };
        }

        private static void ValidateUserRequest(string fullName, string phoneNumber, string email, string[] roles)
        {
            if (string.IsNullOrWhiteSpace(fullName)) throw new AppException("Họ tên không hợp lệ.", 400);
            if (string.IsNullOrWhiteSpace(phoneNumber)) throw new AppException("Số điện thoại không hợp lệ.", 400);
            if (string.IsNullOrWhiteSpace(email)) throw new AppException("Email không hợp lệ.", 400);
            if (roles.Length == 0) throw new AppException("Người dùng phải có ít nhất một role.", 400);
        }

        private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
        {
            var safePage = page <= 0 ? 1 : page;
            var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);
            return (safePage, safePageSize);
        }

        private static AdminPagedResponse<T> ToPaged<T>(IReadOnlyList<T> items, int page, int pageSize, int totalItems)
        {
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
            return new AdminPagedResponse<T>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages,
            };
        }

        private async Task<List<Role>> LoadRolesAsync(string[] roleNames, CancellationToken cancellationToken)
        {
            var normalized = roleNames.Select(x => x.Trim().ToUpperInvariant()).Distinct().ToArray();
            if (normalized.Any(x => !RoleNames.All.Contains(x))) throw new AppException("Role không hợp lệ.", 400);

            var roles = await _db.Roles.Where(x => normalized.Contains(x.Name)).ToListAsync(cancellationToken);
            if (roles.Count != normalized.Length) throw new AppException("Không tìm thấy role.", 400);
            return roles;
        }

        private async Task<string> GenerateUniqueUserCodeAsync(CancellationToken cancellationToken)
        {
            string code;
            do
            {
                code = CodeHelper.Generate();
            }
            while (await _db.Users.AnyAsync(u => u.Code == code, cancellationToken));

            return code;
        }
    }
}

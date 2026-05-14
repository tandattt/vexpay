import { apiFetch } from "../../shared/api";
import type {
  AdminCreateUserRequest,
  AdminDepositItemResponse,
  AdminDeveloperRequestItemResponse,
  AdminPagedResponse,
  AdminSummaryResponse,
  AdminUpdateDepositStatusRequest,
  AdminUpdateDeveloperRequestStatusRequest,
  AdminUpdateUserRequest,
  AdminUserItemResponse,
} from "./types";

export function getAdminSummary() {
  return apiFetch<AdminSummaryResponse>("/admin/summary");
}

export function getAdminUsers(page = 1, pageSize = 20) {
  return apiFetch<AdminPagedResponse<AdminUserItemResponse>>(
    `/admin/users?page=${page}&pageSize=${pageSize}`,
  );
}

export function createAdminUser(body: AdminCreateUserRequest) {
  return apiFetch<AdminUserItemResponse>("/admin/users", { method: "POST", body });
}

export function updateAdminUser(userId: string, body: AdminUpdateUserRequest) {
  return apiFetch<AdminUserItemResponse>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body,
  });
}

export function setAdminUserLock(userId: string, isLocked: boolean) {
  return apiFetch<AdminUserItemResponse>(`/admin/users/${encodeURIComponent(userId)}/lock`, {
    method: "PUT",
    body: { isLocked },
  });
}

export function getAdminDeposits(page = 1, pageSize = 20) {
  return apiFetch<AdminPagedResponse<AdminDepositItemResponse>>(
    `/admin/deposits?page=${page}&pageSize=${pageSize}`,
  );
}

export function updateAdminDepositStatus(depositId: string, body: AdminUpdateDepositStatusRequest) {
  return apiFetch<AdminDepositItemResponse>(
    `/admin/deposits/${encodeURIComponent(depositId)}/status`,
    { method: "PUT", body },
  );
}

export function deleteAdminDeposit(depositId: string) {
  return apiFetch<{ success: boolean }>(`/admin/deposits/${encodeURIComponent(depositId)}`, {
    method: "DELETE",
  });
}

export function getAdminDeveloperRequests(page = 1, pageSize = 20) {
  return apiFetch<AdminPagedResponse<AdminDeveloperRequestItemResponse>>(
    `/admin/developer-requests?page=${page}&pageSize=${pageSize}`,
  );
}

export function updateAdminDeveloperRequestStatus(
  requestId: string,
  body: AdminUpdateDeveloperRequestStatusRequest,
) {
  return apiFetch<AdminDeveloperRequestItemResponse>(
    `/admin/developer-requests/${encodeURIComponent(requestId)}/status`,
    { method: "PUT", body },
  );
}

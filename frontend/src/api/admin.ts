import { apiFetch } from "./client";
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
} from "../types";

export function getAdminSummary(token: string) {
  return apiFetch<AdminSummaryResponse>("/admin/summary", { token });
}

export function getAdminUsers(token: string, page = 1, pageSize = 20) {
  return apiFetch<AdminPagedResponse<AdminUserItemResponse>>(`/admin/users?page=${page}&pageSize=${pageSize}`, { token });
}

export function createAdminUser(token: string, body: AdminCreateUserRequest) {
  return apiFetch<AdminUserItemResponse>("/admin/users", { method: "POST", token, body });
}

export function updateAdminUser(token: string, userId: string, body: AdminUpdateUserRequest) {
  return apiFetch<AdminUserItemResponse>(`/admin/users/${encodeURIComponent(userId)}`, { method: "PUT", token, body });
}

export function setAdminUserLock(token: string, userId: string, isLocked: boolean) {
  return apiFetch<AdminUserItemResponse>(`/admin/users/${encodeURIComponent(userId)}/lock`, { method: "PUT", token, body: { isLocked } });
}

export function getAdminDeposits(token: string, page = 1, pageSize = 20) {
  return apiFetch<AdminPagedResponse<AdminDepositItemResponse>>(`/admin/deposits?page=${page}&pageSize=${pageSize}`, { token });
}

export function updateAdminDepositStatus(token: string, depositId: string, body: AdminUpdateDepositStatusRequest) {
  return apiFetch<AdminDepositItemResponse>(`/admin/deposits/${encodeURIComponent(depositId)}/status`, { method: "PUT", token, body });
}

export function deleteAdminDeposit(token: string, depositId: string) {
  return apiFetch<{ success: boolean }>(`/admin/deposits/${encodeURIComponent(depositId)}`, { method: "DELETE", token });
}

export function getAdminDeveloperRequests(token: string, page = 1, pageSize = 20) {
  return apiFetch<AdminPagedResponse<AdminDeveloperRequestItemResponse>>(`/admin/developer-requests?page=${page}&pageSize=${pageSize}`, { token });
}

export function updateAdminDeveloperRequestStatus(token: string, requestId: string, body: AdminUpdateDeveloperRequestStatusRequest) {
  return apiFetch<AdminDeveloperRequestItemResponse>(`/admin/developer-requests/${encodeURIComponent(requestId)}/status`, { method: "PUT", token, body });
}


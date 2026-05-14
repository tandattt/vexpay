export type AdminMenu =
  | "admin-dashboard"
  | "admin-users"
  | "admin-deposits"
  | "admin-developers";

export type AdminDataMenu = Exclude<AdminMenu, "admin-dashboard">;
export type AdminPageSize = 10 | 20 | 30 | 40;

export interface AdminSummaryResponse {
  totalUsers: number;
  totalDeposits: number;
  totalDepositAmount: number;
  pendingDeposits: number;
  pendingDeveloperRequests: number;
}

export interface AdminPagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUserItemResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  code: string;
  roles: string[];
  isLocked: boolean;
  createdAt: string;
}

export interface AdminDepositItemResponse {
  id: string;
  userId: string;
  userName: string;
  code: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  paidAt?: string | null;
}

export interface AdminDeveloperRequestItemResponse {
  id: string;
  userId: string;
  userName: string;
  status: string;
  requestedAt: string;
}

export interface AdminCreateUserRequest {
  username: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  roles: string[];
}

export interface AdminUpdateUserRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  roles: string[];
}

export interface AdminUpdateDepositStatusRequest {
  status: string;
}

export interface AdminUpdateDeveloperRequestStatusRequest {
  status: string;
}

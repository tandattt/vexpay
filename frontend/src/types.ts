// Mô tả kiểu dữ liệu khớp với backend LoginResponse / UserInfoResponse.
// Refresh token KHÔNG xuất hiện ở đây vì BE set vào cookie HttpOnly `refresh_token`.

export interface UserInfo {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface WalletBalanceResponse {
  walletId: string;
  userId: string;
  balance: number;
}

export interface DepositStatusResponse {
  code: string;
  status: "Pending" | "Completed" | "Failed" | "Cancelled" | "Expired" | 0 | 1 | 2 | 3 | 4;
}

export interface DepositHistoryResponse {
  id: string;
  code: string;
  amount: number;
  status: "Pending" | "Completed" | "Failed" | "Cancelled" | "Expired" | 0 | 1 | 2 | 3 | 4;
  method: "QrCode" | "BankTransfer" | 0 | 1;
  createdAt: string;
  paidAt?: string | null;
  remainingSeconds?: number | null;
}

export interface DepositHistoryPagedResponse {
  items: DepositHistoryResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DepositQrConfigResponse {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  bankShortName: string;
  bankIconUrl: string;
  qrImageExpirationMinutes: number;
}

export interface DeveloperRequestStatusResponse {
  isDeveloper: boolean;
  hasPendingRequest: boolean;
  requestStatus?: string | null;
}

export interface DeveloperProjectResponse {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface DeveloperCreateProjectRequest {
  name: string;
}

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

export interface ApiError {
  message: string;
  status: number;
}

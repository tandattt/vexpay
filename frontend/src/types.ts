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
  status: "Pending" | "Completed" | "Failed" | 0 | 1 | 2;
}

export interface DepositHistoryResponse {
  id: string;
  code: string;
  amount: number;
  status: "Pending" | "Completed" | "Failed" | 0 | 1 | 2;
  method: "QrCode" | "BankTransfer" | 0 | 1;
  createdAt: string;
  paidAt?: string | null;
}

export interface ApiError {
  message: string;
  status: number;
}

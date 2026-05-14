export type DepositStatusValue =
  | "Pending"
  | "Completed"
  | "Failed"
  | "Cancelled"
  | "Expired"
  | 0
  | 1
  | 2
  | 3
  | 4;

export type DepositMethodValue = "QrCode" | "BankTransfer" | 0 | 1;

export type DepositMethod = "qr" | "bank";

export type NormalizedDepositStatus = "Pending" | "Completed" | "Failed" | "Cancelled" | "Expired";

export interface DepositStatusResponse {
  code: string;
  status: DepositStatusValue;
}

export interface DepositHistoryResponse {
  id: string;
  code: string;
  amount: number;
  status: DepositStatusValue;
  method: DepositMethodValue;
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

export interface HistoryRow {
  id: string;
  date: string;
  amount: string;
  status: NormalizedDepositStatus;
  method: string;
  code: string;
  remainingSeconds: number | null;
}

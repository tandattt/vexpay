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

export type WalletTransactionDirection = "Credit" | "Debit" | 0 | 1;

export type WalletTransactionType =
  | "Deposit"
  | "PaymentDebit"
  | "PaymentCredit"
  | 0
  | 1
  | 2;

export interface WalletTransactionItem {
  id: string;
  direction: WalletTransactionDirection;
  type: WalletTransactionType;
  amount: number;
  referenceId: string;
  description: string;
  createdAt: string;
  depositStatus?: DepositStatusValue | null;
}

export interface WalletTransactionPagedResponse {
  items: WalletTransactionItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface WalletBalanceResponse {
  walletId: string;
  balance: number;
}

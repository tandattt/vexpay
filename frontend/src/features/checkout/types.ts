export type CheckoutStatus =
  | "AwaitingTransfer"
  | "Paid"
  | "Failed"
  | "Expired"
  | "Cancelled"
  | 0
  | 1
  | 2
  | 3
  | 4;

export interface CheckoutSession {
  id: string;
  projectName: string;
  merchantRef: string | null;
  description: string | null;
  amount: number;
  currency: string;
  status: CheckoutStatus;
  method: "BankTransfer" | "Wallet" | 0 | 1;
  transferCode: string;
  qrImageUrl: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  bankIconUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export type CheckoutPayMode = "wallet" | "bank";

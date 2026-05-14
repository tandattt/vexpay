import { formatCurrency, formatDateTime } from "../../../shared/lib/format";
import type {
  DepositHistoryResponse,
  DepositMethodValue,
  DepositStatusValue,
  HistoryRow,
  NormalizedDepositStatus,
} from "../types";

export function mapDepositStatus(value: DepositStatusValue): NormalizedDepositStatus {
  if (value === 1 || value === "Completed") return "Completed";
  if (value === 2 || value === "Failed") return "Failed";
  if (value === 3 || value === "Cancelled") return "Cancelled";
  if (value === 4 || value === "Expired") return "Expired";
  return "Pending";
}

export function mapDepositMethod(value: DepositMethodValue): string {
  if (value === 0 || value === "QrCode") return "QR Code";
  return "Bank Transfer";
}

export function toHistoryRow(item: DepositHistoryResponse): HistoryRow {
  return {
    id: item.id,
    code: item.code,
    date: formatDateTime(item.createdAt),
    amount: formatCurrency(item.amount),
    status: mapDepositStatus(item.status),
    method: mapDepositMethod(item.method),
    remainingSeconds: item.remainingSeconds ?? null,
  };
}

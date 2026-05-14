import { apiFetch, apiFetchBlob, HttpError } from "../../shared/api";
import { dedupePromise } from "../../shared/lib/dedupePromise";
import type {  DepositHistoryPagedResponse,
  DepositQrConfigResponse,
  DepositStatusResponse,
} from "./types";

export async function createDepositQr(amount: number): Promise<{ code: string; imageUrl: string }> {
  const response = await apiFetchBlob("/deposit/qr", { method: "POST", body: { amount } });

  const code =
    response.headers.get("X-Deposit-Code") ??
    response.headers.get("Deposit-Code") ??
    response.headers.get("x-deposit-code");
  if (!code) {
    throw new HttpError("Thiếu mã giao dịch nạp từ server.", 500);
  }

  const blob = await response.blob();
  return { code, imageUrl: URL.createObjectURL(blob) };
}

export function getDepositQrConfig() {
  return dedupePromise("deposit:qr-config", () =>
    apiFetch<DepositQrConfigResponse>("/deposit/qr-config"),
  );
}

export function getDepositStatus(code: string) {
  return apiFetch<DepositStatusResponse>(`/deposit/status/${encodeURIComponent(code)}`);
}

export function getDepositHistory(page = 1, pageSize = 5) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return dedupePromise(`deposit:history:${query.toString()}`, () =>
    apiFetch<DepositHistoryPagedResponse>(`/deposit/history?${query.toString()}`),
  );
}
export async function getDepositHistoryQr(code: string): Promise<string> {
  const response = await apiFetchBlob(`/deposit/history/${encodeURIComponent(code)}/qr`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function cancelDeposit(code: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/deposit/cancel/${encodeURIComponent(code)}`, {
    method: "POST",
  });
}

import { apiFetch } from "../../shared/api";
import type { CheckoutSession } from "./types";

export async function getCheckout(paymentId: string): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>(`/v1/checkout/${paymentId}`);
}

export async function ensureCheckoutBankQr(paymentId: string): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>(`/v1/checkout/${paymentId}/bank-qr`, { method: "POST" });
}

export async function payCheckoutWithWallet(
  paymentId: string,
  token: string,
): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>(`/v1/checkout/${paymentId}/wallet`, {
    method: "POST",
    token,
  });
}

export async function cancelCheckout(paymentId: string): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>(`/v1/checkout/${paymentId}/cancel`, { method: "POST" });
}

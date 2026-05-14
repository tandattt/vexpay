import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { cancelCheckout, ensureCheckoutBankQr, getCheckout, payCheckoutWithWallet } from "../api";
import type { CheckoutPayMode, CheckoutSession } from "../types";

const TERMINAL = new Set(["Paid", "Failed", "Expired", "Cancelled", 1, 2, 3, 4]);
const POLL_MS = 5000;

function isAwaiting(status: CheckoutSession["status"]): boolean {
  return status === "AwaitingTransfer" || status === 0;
}

interface Options {
  paymentId: string;
  token: string | null;
}

export function useCheckout({ paymentId, token }: Options) {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payMode, setPayMode] = useState<CheckoutPayMode>("bank");
  const [bankLoading, setBankLoading] = useState(false);
  const [walletPaying, setWalletPaying] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const reload = useCallback(async () => {
    const data = await getCheckout(paymentId);
    setSession(data);
    return data;
  }, [paymentId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getCheckout(paymentId)
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof HttpError ? err.message : "Không tải được giao dịch.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  useEffect(() => {
    if (!session || !isAwaiting(session.status)) return;
    const timer = window.setInterval(() => {
      void reload().catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [session, reload]);

  const loadBankQr = useCallback(async () => {
    setBankLoading(true);
    setError(null);
    try {
      const data = await ensureCheckoutBankQr(paymentId);
      setSession(data);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không tạo được mã QR.");
    } finally {
      setBankLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    if (payMode !== "bank" || !session || session.qrImageUrl) return;
    if (!isAwaiting(session.status)) return;
    void loadBankQr();
  }, [payMode, session, loadBankQr]);

  const payWithWallet = useCallback(async () => {
    if (!token) return;
    setWalletPaying(true);
    setWalletError(null);
    try {
      const data = await payCheckoutWithWallet(paymentId, token);
      setSession(data);
    } catch (err) {
      setWalletError(err instanceof HttpError ? err.message : "Thanh toán thất bại.");
    } finally {
      setWalletPaying(false);
    }
  }, [paymentId, token]);

  const cancelPayment = useCallback(async () => {
    setCancelling(true);
    setError(null);
    try {
      const data = await cancelCheckout(paymentId);
      setSession(data);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không hủy được giao dịch.");
    } finally {
      setCancelling(false);
    }
  }, [paymentId]);

  const isTerminal = session ? TERMINAL.has(session.status) : false;
  const awaiting = session ? isAwaiting(session.status) : false;

  return {
    session,
    loading,
    error,
    payMode,
    setPayMode,
    bankLoading,
    walletPaying,
    walletError,
    cancelling,
    isTerminal,
    awaiting,
    payWithWallet,
    cancelPayment,
    reload,
  };
}

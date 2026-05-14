import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getMyBalance } from "../api";

const BALANCE_POLL_MS = 10_000;

export function useBalance(token: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        const response = await getMyBalance();
        setBalance(response.balance);
        setError(null);
      } catch (err) {
        if (!silent) {
          const message = err instanceof HttpError ? err.message : "Không tải được số dư ví.";
          setError(message);
        }
      }
    },
    [token],
  );

  const reload = useCallback(() => fetchBalance(false), [fetchBalance]);

  useEffect(() => {
    if (!token) {
      setBalance(null);
      setError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await getMyBalance();
        if (!cancelled) {
          setBalance(response.balance);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof HttpError ? err.message : "Không tải được số dư ví.";
        setError(message);
      }
    })();

    const timer = setInterval(() => {
      void fetchBalance(true);
    }, BALANCE_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, fetchBalance]);

  return { balance, error, reload };
}

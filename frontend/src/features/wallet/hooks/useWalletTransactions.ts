import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getWalletTransactions } from "../api";
import type { WalletTransactionItem } from "../types";

const PAGE_SIZE = 20;

export function useWalletTransactions(token: string | null, enabled = true) {
  const [items, setItems] = useState<WalletTransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, mode: "initial" | "page") => {
      if (!token || !enabled) return;
      if (mode === "initial") setLoading(true);
      else setPaging(true);
      setError(null);
      try {
        const data = await getWalletTransactions(token, targetPage, PAGE_SIZE);
        setItems(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof HttpError ? err.message : "Không tải được lịch sử giao dịch.");
      } finally {
        if (mode === "initial") setLoading(false);
        else setPaging(false);
      }
    },
    [token, enabled],
  );

  useEffect(() => {
    if (!token || !enabled) {
      setItems([]);
      setPage(1);
      setTotalPages(0);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getWalletTransactions(token, 1, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof HttpError ? err.message : "Không tải được lịch sử giao dịch.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, enabled]);

  const reload = useCallback(() => void load(page, "initial"), [load, page]);

  const changePage = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages) || nextPage === page) return;
      void load(nextPage, "page");
    },
    [load, page, totalPages],
  );

  return { items, page, totalPages, loading, paging, error, reload, changePage };
}

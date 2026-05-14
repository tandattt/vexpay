import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getProjectPayments } from "../api";
import type { PaymentIntentItem } from "../types";

const DEFAULT_PAGE_SIZE = 5;

export type PaymentStatusFilter =
  | "All"
  | "AwaitingTransfer"
  | "Paid"
  | "Failed"
  | "Expired"
  | "Cancelled";

export function useProjectPayments(projectId: string | null, enabled: boolean) {
  const [items, setItems] = useState<PaymentIntentItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("All");
  const [isLoading, setIsLoading] = useState<boolean>(enabled && Boolean(projectId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, nextSize: number, nextStatus: PaymentStatusFilter) => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProjectPayments(
          projectId,
          nextPage,
          nextSize,
          nextStatus === "All" ? null : nextStatus,
        );
        setItems(data.items);
        setPage(data.page);
        setPageSize(data.pageSize);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof HttpError ? err.message : "Không tải được giao dịch.");
      } finally {
        setIsLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (!enabled || !projectId) {
      setItems([]);
      setPage(1);
      setTotalItems(0);
      setTotalPages(0);
      setStatusFilter("All");
      setError(null);
      return;
    }
    void load(1, pageSize, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, projectId]);

  const goToPage = useCallback(
    (next: number) => {
      const safe = Math.max(1, next);
      void load(safe, pageSize, statusFilter);
    },
    [load, pageSize, statusFilter],
  );

  const changePageSize = useCallback(
    (size: number) => {
      void load(1, size, statusFilter);
    },
    [load, statusFilter],
  );

  const changeStatus = useCallback(
    (status: PaymentStatusFilter) => {
      setStatusFilter(status);
      void load(1, pageSize, status);
    },
    [load, pageSize],
  );

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    statusFilter,
    isLoading,
    error,
    setPage: goToPage,
    setPageSize: changePageSize,
    setStatusFilter: changeStatus,
    reload: () => load(page, pageSize, statusFilter),
  };
}

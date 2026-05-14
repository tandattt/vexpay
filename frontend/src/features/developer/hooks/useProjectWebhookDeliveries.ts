import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getProjectWebhookDeliveries } from "../api";
import type { ProjectWebhookDeliveryItem } from "../types";

const PAGE_SIZE = 10;

export function useProjectWebhookDeliveries(projectId: string | null, enabled = true) {
  const [items, setItems] = useState<ProjectWebhookDeliveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, mode: "initial" | "page") => {
      if (!projectId || !enabled) return;
      if (mode === "initial") setLoading(true);
      else setPaging(true);
      setError(null);
      try {
        const data = await getProjectWebhookDeliveries(projectId, targetPage, PAGE_SIZE);
        setItems(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof HttpError ? err.message : "Không tải được lịch sử webhook.");
      } finally {
        if (mode === "initial") setLoading(false);
        else setPaging(false);
      }
    },
    [enabled, projectId],
  );

  useEffect(() => {
    void load(1, "initial");
  }, [load]);

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

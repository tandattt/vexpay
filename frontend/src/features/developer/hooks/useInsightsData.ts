import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getPaymentStats, getPayments, getWebhookDeliveries } from "../api";
import type {
  DeveloperProjectResponse,
  PaymentIntentItem,
  ProjectPaymentStatsResponse,
} from "../types";
import type { PaymentStatusFilter } from "./useProjectPayments";

const WEBHOOK_PAGE_SIZE = 10;
const PAYMENTS_DEFAULT_PAGE_SIZE = 5;

export type AugmentedWebhookDelivery = {
  id: string;
  paymentIntentId: string;
  eventType: string;
  attempt: number;
  webhookUrl: string;
  httpStatusCode?: number | null;
  success: boolean;
  responseBody?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  projectId: string;
  projectName: string;
};

function resolveProjectName(
  projects: DeveloperProjectResponse[],
  itemProjectId: string | null | undefined,
  selectedProjectId: string | null,
  fallbackName?: string | null,
): string {
  if (fallbackName) return fallbackName;
  const id = itemProjectId ?? selectedProjectId;
  if (!id) return "Project";
  return projects.find((project) => project.id === id)?.name ?? "Project";
}

export function useInsightsStats(
  projectId: string | null,
  projects: DeveloperProjectResponse[],
  enabled: boolean,
  projectsReady: boolean,
) {
  const [stats, setStats] = useState<ProjectPaymentStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !projectsReady || projects.length === 0) {
      setStats(null);
      setError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPaymentStats(undefined, undefined, projectId);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof HttpError ? err.message : "Không tải được thống kê.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, projectId, projects.length, projectsReady]);

  const reload = useCallback(async () => {
    if (!enabled || !projectsReady || projects.length === 0) return;
    try {
      setIsLoading(true);
      setError(null);
      setStats(await getPaymentStats(undefined, undefined, projectId));
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không tải được thống kê.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId, projects.length, projectsReady]);

  return { stats, isLoading, error, reload };
}

export function useInsightsPayments(
  projectId: string | null,
  projects: DeveloperProjectResponse[],
  enabled: boolean,
  projectsReady: boolean,
) {
  const projectNameMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  const [items, setItems] = useState<PaymentIntentItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAYMENTS_DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, nextSize: number, nextStatus: PaymentStatusFilter) => {
      if (!enabled || !projectsReady || projects.length === 0) {
        setItems([]);
        setPage(1);
        setTotalItems(0);
        setTotalPages(0);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getPayments(
          nextPage,
          nextSize,
          nextStatus === "All" ? null : nextStatus,
          projectId,
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
    [enabled, projectId, projects.length, projectsReady],
  );

  useEffect(() => {
    void load(1, pageSize, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, projectId, projects.length, projectsReady]);

  const goToPage = useCallback(
    (next: number) => {
      void load(next, pageSize, statusFilter);
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
    projectNameMap,
    setPage: goToPage,
    setPageSize: changePageSize,
    setStatusFilter: changeStatus,
    reload: () => load(page, pageSize, statusFilter),
  };
}

export function useInsightsWebhookDeliveries(
  projectId: string | null,
  projects: DeveloperProjectResponse[],
  enabled: boolean,
  projectsReady: boolean,
) {
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const [items, setItems] = useState<AugmentedWebhookDelivery[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number, mode: "initial" | "page") => {
      if (!enabled || !projectsReady || projectsRef.current.length === 0) {
        setItems([]);
        setPage(1);
        setTotalPages(0);
        setError(null);
        return;
      }

      if (mode === "initial") setLoading(true);
      else setPaging(true);
      setError(null);

      try {
        const data = await getWebhookDeliveries(targetPage, WEBHOOK_PAGE_SIZE, projectId);
        const list = projectsRef.current;
        setItems(
          data.items.map((item) => ({
            ...item,
            projectId: item.projectId ?? projectId ?? "",
            projectName: resolveProjectName(list, item.projectId, projectId, item.projectName),
          })),
        );
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof HttpError ? err.message : "Không tải được lịch sử webhook.");
      } finally {
        if (mode === "initial") setLoading(false);
        else setPaging(false);
      }
    },
    [enabled, projectId, projectsReady],
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

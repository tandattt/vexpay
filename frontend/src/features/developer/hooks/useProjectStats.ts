import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { getProjectStats } from "../api";
import type { ProjectPaymentStatsResponse } from "../types";

export function useProjectStats(projectId: string | null, enabled: boolean) {
  const [stats, setStats] = useState<ProjectPaymentStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && Boolean(projectId));

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      setError(null);
      setStats(await getProjectStats(projectId));
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không tải được thống kê.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled || !projectId) {
      setStats(null);
      setError(null);
      return;
    }
    void load();
  }, [enabled, projectId, load]);

  return { stats, isLoading, error, reload: load };
}

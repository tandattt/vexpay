import { useCallback, useEffect, useState } from "react";
import { HttpError } from "../../../shared/api";
import { createMyProject, getMyProjects } from "../api";
import type { DeveloperProjectResponse } from "../types";

export function useProjects(token: string | null, enabled: boolean) {
  const [projects, setProjects] = useState<DeveloperProjectResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && Boolean(token));
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await getMyProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không tải được danh sách project.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !token) return;
    void load();
  }, [enabled, token, load]);

  const create = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên project.");
      return false;
    }
    try {
      setIsCreating(true);
      setError(null);
      const created = await createMyProject({ name: trimmed });
      setProjects((current) => [created, ...current]);
      return true;
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Không tạo được project.");
      return false;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateProject = useCallback((updated: DeveloperProjectResponse) => {
    setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  return { projects, error, isLoading, isCreating, load, create, updateProject, setError };
}

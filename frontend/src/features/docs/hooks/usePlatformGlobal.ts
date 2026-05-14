import { useCallback, useEffect, useState } from "react";
import { fetchOpenApiSpec } from "../api";
import { resolvePlatformGlobal } from "../lib/platformGlobal";
import type { PlatformGlobalConfig } from "../types";

interface PlatformGlobalState {
  global: PlatformGlobalConfig;
  loading: boolean;
  reload: () => void;
}

export function usePlatformGlobal(enabled = true): PlatformGlobalState {
  const [global, setGlobal] = useState<PlatformGlobalConfig>(resolvePlatformGlobal());
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const doc = await fetchOpenApiSpec();
      setGlobal(resolvePlatformGlobal(doc["x-vexpay-global"]));
    } catch {
      setGlobal(resolvePlatformGlobal());
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { global, loading, reload: load };
}

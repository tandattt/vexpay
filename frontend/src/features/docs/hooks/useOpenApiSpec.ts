import { useCallback, useEffect, useState } from "react";
import { fetchOpenApiSpec } from "../api";
import { parseEndpoints } from "../lib/openapi";
import type { OpenApiDocument, ParsedEndpoint } from "../types";

interface OpenApiState {
  doc: OpenApiDocument | null;
  endpoints: ParsedEndpoint[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useOpenApiSpec(enabled = true): OpenApiState {
  const [doc, setDoc] = useState<OpenApiDocument | null>(null);
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const spec = await fetchOpenApiSpec();
      setDoc(spec);
      setEndpoints(parseEndpoints(spec));
    } catch (err) {
      setDoc(null);
      setEndpoints([]);
      setError(err instanceof Error ? err.message : "Không tải được tài liệu API.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { doc, endpoints, loading, error, reload: load };
}

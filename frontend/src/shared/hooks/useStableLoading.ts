import { useEffect, useRef, useState } from "react";

const DEFAULT_MIN_MS = 320;

interface Options {
  minMs?: number;
  /** When true, skeleton is hidden immediately (data already on screen). */
  hasData?: boolean;
}

/**
 * Keeps loading UI visible for at least `minMs` after it first appears,
 * so fast API responses do not flash skeleton → content (layout jitter).
 * Pass `hasData: true` to dismiss the skeleton as soon as content is ready.
 */
export function useStableLoading(isLoading: boolean, options: Options = {}): boolean {
  const { minMs = DEFAULT_MIN_MS, hasData = false } = options;
  const [stable, setStable] = useState(isLoading);
  const shownAtRef = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading) {
      shownAtRef.current = Date.now();
      setStable(true);
      return;
    }

    if (shownAtRef.current === null) {
      setStable(false);
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, minMs - elapsed);
    const timer = window.setTimeout(() => {
      shownAtRef.current = null;
      setStable(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isLoading, minMs]);

  if (hasData) return false;
  return stable;
}

import { useEffect } from "react";

export function useInterval(callback: () => void, delayMs: number | null) {
  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(callback, delayMs);
    return () => window.clearInterval(id);
  }, [callback, delayMs]);
}

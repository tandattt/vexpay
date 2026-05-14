const inflight = new Map<string, Promise<unknown>>();

/** Collapse concurrent identical requests (e.g. React Strict Mode double effects). */
export function dedupePromise<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = factory().finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });

  inflight.set(key, promise);
  return promise;
}

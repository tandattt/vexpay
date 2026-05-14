type StorageKind = "local" | "session";

function pick(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

export function readStorage<T>(kind: StorageKind, key: string, fallback: T): T {
  const storage = pick(kind);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(kind: StorageKind, key: string, value: unknown) {
  const storage = pick(kind);
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function removeStorage(kind: StorageKind, key: string) {
  const storage = pick(kind);
  if (!storage) return;
  storage.removeItem(key);
}

export function readRaw(kind: StorageKind, key: string): string | null {
  const storage = pick(kind);
  if (!storage) return null;
  return storage.getItem(key);
}

export function writeRaw(kind: StorageKind, key: string, value: string | null) {
  const storage = pick(kind);
  if (!storage) return;
  if (value === null) storage.removeItem(key);
  else storage.setItem(key, value);
}

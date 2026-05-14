type Listener = (token: string | null) => void;

const TOKEN_KEY = "vexpay.access_token";

let accessToken: string | null = null;
const listeners = new Set<Listener>();

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function hydrateFromStorage() {
  const stored = readStoredToken();
  if (stored) accessToken = stored;
}

hydrateFromStorage();

export function getAccessToken() {
  return accessToken ?? readStoredToken();
}

export function setAccessToken(token: string | null) {
  if (accessToken === token) return;
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function subscribeAccessToken(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

import { useEffect, useState } from "react";
import type { UserInfo } from "../types";
import { setAccessToken, subscribeAccessToken } from "../api/authTokenStore";

const TOKEN_KEY = "vexpay.access_token";
const USER_KEY = "vexpay.user";

export interface AuthState {
  token: string | null;
  user: UserInfo | null;
}

function read(): AuthState {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const rawUser = sessionStorage.getItem(USER_KEY);
    const user = rawUser ? (JSON.parse(rawUser) as UserInfo) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function write(state: AuthState) {
  if (state.token && state.user) {
    sessionStorage.setItem(TOKEN_KEY, state.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(state.user));
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => read());

  useEffect(() => {
    write(state);
    setAccessToken(state.token);
  }, [state]);

  useEffect(() => {
    return subscribeAccessToken((token) => {
      setState((current) => {
        if (current.token === token) return current;
        if (!token && !current.user) return current;
        return { token, user: token ? current.user : null };
      });
    });
  }, []);

  const signIn = (token: string, user: UserInfo) => setState({ token, user });
  const signOut = () => setState({ token: null, user: null });

  return { ...state, signIn, signOut };
}

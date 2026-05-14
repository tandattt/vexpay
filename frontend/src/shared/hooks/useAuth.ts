import { useEffect, useState } from "react";
import { setAccessToken, subscribeAccessToken } from "../api";
import { readRaw, writeRaw } from "../lib/storage";
import type { UserInfo } from "../types";

const TOKEN_KEY = "vexpay.access_token";
const USER_KEY = "vexpay.user";

export interface AuthState {
  token: string | null;
  user: UserInfo | null;
}

function read(): AuthState {
  try {
    let token = readRaw("local", TOKEN_KEY);
    let rawUser = readRaw("local", USER_KEY);

    if (!token) {
      token = readRaw("session", TOKEN_KEY);
      rawUser = rawUser ?? readRaw("session", USER_KEY);
    }

    const user = rawUser ? (JSON.parse(rawUser) as UserInfo) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function write(state: AuthState) {
  if (state.token && state.user) {
    writeRaw("local", TOKEN_KEY, state.token);
    writeRaw("local", USER_KEY, JSON.stringify(state.user));
    writeRaw("session", TOKEN_KEY, null);
    writeRaw("session", USER_KEY, null);
  } else {
    writeRaw("local", TOKEN_KEY, null);
    writeRaw("local", USER_KEY, null);
    writeRaw("session", TOKEN_KEY, null);
    writeRaw("session", USER_KEY, null);
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    const initial = read();
    if (initial.token) setAccessToken(initial.token);
    return initial;
  });

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

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, AuthTokens, AuthUser } from '@settl/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshToken: string | null = null;

type SessionListener = () => void;
const sessionExpiredListeners = new Set<SessionListener>();

export function onSessionExpired(listener: SessionListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function emitSessionExpired() {
  sessionExpiredListeners.forEach((listener) => listener());
}

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string, bufferSeconds = 30): boolean {
  const exp = decodeJwtExp(token);
  if (!exp) return true;
  return Date.now() >= exp * 1000 - bufferSeconds * 1000;
}

export function clearSession() {
  setTokens(null);
  setStoredUser(null);
  emitSessionExpired();
}

export function setTokens(tokens: AuthTokens | null) {
  if (typeof window === 'undefined') return;
  if (tokens) {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    localStorage.setItem('settl_tokens', JSON.stringify(tokens));
  } else {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('settl_tokens');
    localStorage.removeItem('settl_user');
  }
}

export function loadStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('settl_tokens');
  if (!stored) return null;
  try {
    const tokens = JSON.parse(stored) as AuthTokens;
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    return tokens;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem('settl_user', JSON.stringify(user));
  else localStorage.removeItem('settl_user');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('settl_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (!refreshToken) {
    clearSession();
    return null;
  }
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const tokens = data.data.tokens as AuthTokens;
    const user = data.data.user as AuthUser;
    setTokens(tokens);
    setStoredUser(user);
    return tokens;
  } catch {
    clearSession();
    return null;
  }
}

export async function ensureValidSession(): Promise<AuthUser | null> {
  const tokens = loadStoredTokens();
  if (!tokens?.accessToken) {
    clearSession();
    return null;
  }

  if (isAccessTokenExpired(tokens.accessToken)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
  }

  try {
    const { data } = await api.get("/auth/me");
    const user = data.data as AuthUser;
    setStoredUser(user);
    return user;
  } catch {
    clearSession();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      (original as { _retry?: boolean })._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken();
      const tokens = await refreshPromise;
      refreshPromise = null;
      if (tokens && original.headers) {
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?reason=session-expired";
      }
    }
    return Promise.reject(error);
  },
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Session expired. Please sign in again.";
    }
    return error.response?.data?.error ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

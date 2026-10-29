export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.DEV ? "http://localhost:4000" : "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem("serverhub_token");
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem("serverhub_token", token);
    } else {
      localStorage.removeItem("serverhub_token");
    }
  } catch {}
}

// Single-flight session refresh: concurrent 401s share one rotation call.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    refreshPromise = fetch(`${API_BASE}/server-hub/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers,
    })
      .then(async (r) => {
        if (!r.ok) {
          setStoredToken(null);
          return false;
        }
        try {
          const data = (await r.json()) as { token?: string };
          if (data?.token) setStoredToken(data.token);
        } catch {}
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Fetch with the shared session-refresh behavior. Returns the raw Response so
// callers that need headers (e.g. X-Total-Count pagination) can read them.
export async function fetchRes(path: string, init?: RequestInit, retry = true): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  const token = getStoredToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  // Access tokens live 30 minutes. On expiry, transparently rotate via the
  // refresh cookie and retry once (single-flight across concurrent calls).
  // Auth endpoints themselves never retry (a 401 there is a real failure).
  if (res.status === 401 && retry && !path.startsWith("/server-hub/api/auth/")) {
    const ok = await refreshSession();
    if (ok) return fetchRes(path, init, false);
  }
  return res;
}

export async function req<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const res = await fetchRes(path, init, retry);
  if (res.status === 204) return undefined as T;
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

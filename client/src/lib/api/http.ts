export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Single-flight session refresh: concurrent 401s share one rotation call.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/server-hub/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.ok)
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
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
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
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

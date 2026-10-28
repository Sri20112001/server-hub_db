import { ApiError, fetchRes, req } from "./http";
import type { DashboardData, ServerInfo } from "../types/dashboard";
import type { AuditLog } from "../types/logs";
import type { ManagedServer } from "../types/servers";

export const dashboardApi = {
  // dashboard / server
  dashboard: () => req<DashboardData>("/server-hub/api/dashboard"),
  server: ((id?: number) => {
    if (typeof id === "number") {
      return req<ManagedServer>(`/server-hub/api/servers/${id}`);
    }
    return req<ServerInfo>("/server-hub/api/server");
  }) as {
    (): Promise<ServerInfo>;
    (id: number): Promise<ManagedServer>;
  },
  audit: (limit = 8) => req<AuditLog[]>(`/server-hub/api/audit?limit=${limit}`),
  // Paginated audit: the server sends the full row count in X-Total-Count.
  auditPage: async (
    limit: number,
    offset: number,
  ): Promise<{ items: AuditLog[]; total: number }> => {
    const res = await fetchRes(`/server-hub/api/audit?limit=${limit}&offset=${offset}`);
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
    const total = Number(res.headers.get("X-Total-Count") ?? "0");
    return {
      items: (Array.isArray(body) ? body : []) as AuditLog[],
      total: Number.isFinite(total) ? total : 0,
    };
  },
};

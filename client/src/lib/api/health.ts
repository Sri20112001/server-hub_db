import { req } from "./http";
import type { HealthCheck, HealthCheckResult } from "../types/health";

export const healthApi = {
  // health checks
  healthChecks: () => req<HealthCheck[]>("/server-hub/api/health-checks"),
  createHealthCheck: (body: Partial<HealthCheck>) =>
    req<{ id: number; name: string }>("/server-hub/api/health-checks", { method: "POST", body: JSON.stringify(body) }),
  updateHealthCheck: (id: number, body: Partial<HealthCheck>) =>
    req<{ ok: boolean }>(`/server-hub/api/health-checks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteHealthCheck: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/health-checks/${id}`, { method: "DELETE" }),
  healthCheckResults: (id: number) =>
    req<HealthCheckResult[]>(`/server-hub/api/health-checks/${id}/results`),
};

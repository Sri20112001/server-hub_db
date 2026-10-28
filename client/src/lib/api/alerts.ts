import { req } from "./http";
import type { Alert, AlertRule } from "../types/alerts";

export const alertsApi = {
  // alerts
  alerts: (status?: string) =>
    req<Alert[]>(`/server-hub/api/alerts${status ? `?status=${status}` : ""}`),
  resolveAlert: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/alerts/${id}/resolve`, { method: "PATCH" }),

  // custom alert rules
  alertRules: () =>
    req<AlertRule[]>("/server-hub/api/alert-rules"),
  createAlertRule: (body: Partial<AlertRule>) =>
    req<{ id: number }>("/server-hub/api/alert-rules", { method: "POST", body: JSON.stringify(body) }),
  seedAlertRules: () =>
    req<{ ok: boolean; seeded: number }>("/server-hub/api/alert-rules/seed", { method: "POST" }),
  updateAlertRule: (id: number, body: Partial<AlertRule>) =>
    req<{ ok: boolean }>(`/server-hub/api/alert-rules/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAlertRule: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/alert-rules/${id}`, { method: "DELETE" }),
};

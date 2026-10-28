import { req } from "./http";
import type {
  AlertmanagerStatus,
  AmAlert,
  AmSilence,
  MonitoringOverview,
  PrometheusStatus,
  PromRangeResult,
  PromTargetsData,
} from "../types/monitoring";

export const monitoringApi = {
  // monitoring — Prometheus + Alertmanager
  monitoringOverview: () =>
    req<MonitoringOverview>("/server-hub/api/monitoring/overview"),
  prometheusStatus: () =>
    req<PrometheusStatus>("/server-hub/api/monitoring/prometheus/status"),
  prometheusTargets: () =>
    req<{ data: PromTargetsData }>("/server-hub/api/monitoring/prometheus/targets"),
  prometheusRules: () =>
    req<{ data: unknown }>("/server-hub/api/monitoring/prometheus/rules"),
  prometheusQuery: (query: string) =>
    req<{ data: unknown }>(`/server-hub/api/monitoring/prometheus/query?query=${encodeURIComponent(query)}`),
  prometheusQueryRange: (query: string, rangeStr: string, step = "60") => {
    const now = Math.floor(Date.now() / 1000);
    const durations: Record<string, number> = { "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800 };
    const dur = durations[rangeStr] ?? 3600;
    return req<{ data: PromRangeResult }>(
      `/server-hub/api/monitoring/prometheus/query-range?query=${encodeURIComponent(query)}&start=${now - dur}&end=${now}&step=${step}`
    );
  },
  monitoringMetrics: (metric: string, range = "1h", step = "60") =>
    req<{ metric: string; range: string; data: PromRangeResult }>(
      `/server-hub/api/monitoring/metrics?metric=${metric}&range=${range}&step=${step}`
    ),
  alertmanagerStatus: () =>
    req<AlertmanagerStatus>("/server-hub/api/monitoring/alertmanager/status"),
  monitoringAlerts: () =>
    req<AmAlert[]>("/server-hub/api/monitoring/alerts"),
  monitoringSilences: () =>
    req<AmSilence[]>("/server-hub/api/monitoring/silences"),
  createSilence: (body: object) =>
    req<{ silenceID: string }>("/server-hub/api/monitoring/silences", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteSilence: (id: string) =>
    req<{ ok: boolean }>(`/server-hub/api/monitoring/silences/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

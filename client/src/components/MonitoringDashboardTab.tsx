import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { api } from "../lib/api";
import type { AmAlert, MonitoringOverview, PromTargetsData } from "../lib/types/monitoring";
import type { BusEvent } from "../lib/types/logs";
import { Kicker } from "./ui/Kicker";
import { useEvents } from "../lib/useEvents";
import { fmtBytes, fmtDuration, severityColor } from "../utils/monitoringFormat";
import { MetricBar } from "./MetricBar";
import { StatusDot } from "./StatusDot";

// Overview tab: Prometheus/Alertmanager reachability, host resource bars and
// the top firing alerts.
export function MonitoringDashboardTab() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [promOk, setPromOk] = useState<boolean | undefined>(undefined);
  const [amOk, setAmOk] = useState<boolean | undefined>(undefined);
  const [alerts, setAlerts] = useState<AmAlert[]>([]);
  const [targets, setTargets] = useState<PromTargetsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      api.monitoringOverview().then(setOverview),
      api.prometheusStatus().then(r => setPromOk(r.healthy ?? r.available)),
      api.alertmanagerStatus().then(r => setAmOk(r.healthy ?? r.available)),
      api.monitoringAlerts().then(setAlerts).catch(() => setAlerts([])),
      api.prometheusTargets().then(r => setTargets(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  // Intentional: initial fetch on mount (load is a stable useCallback).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEvents((ev: BusEvent) => {
    if (ev.type === "monitoring.alert.firing" || ev.type === "monitoring.alert.resolved") {
      api.monitoringAlerts().then(setAlerts).catch(() => {});
    }
  });

  const firing = alerts.filter(a => a.status.state === "active");
  const upTargets = targets ? targets.activeTargets.filter(t => t.health === "up").length : null;
  const totalTargets = targets ? targets.activeTargets.length : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Status row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl p-4">
          <Kicker>Prometheus</Kicker>
          <div className="mt-2 flex items-center gap-2">
            {promOk === undefined ? <WifiOff size={16} className="text-muted dark:text-fog" /> :
              promOk ? <Wifi size={16} className="text-moss" /> : <WifiOff size={16} className="text-brick" />}
            <StatusDot ok={promOk} label={promOk === undefined ? "Checking…" : promOk ? "Connected" : "Unavailable"} />
          </div>
          {targets !== null && (
            <div className="mt-2 font-mono text-[12px] text-muted dark:text-fog">
              Targets: {upTargets} / {totalTargets} up
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl p-4">
          <Kicker>Alertmanager</Kicker>
          <div className="mt-2 flex items-center gap-2">
            {amOk === undefined ? <WifiOff size={16} className="text-muted dark:text-fog" /> :
              amOk ? <Wifi size={16} className="text-moss" /> : <WifiOff size={16} className="text-brick" />}
            <StatusDot ok={amOk} label={amOk === undefined ? "Checking…" : amOk ? "Connected" : "Unavailable"} />
          </div>
          <div className="mt-2 font-mono text-[12px] text-muted dark:text-fog">
            Active alerts: {firing.length}
          </div>
        </div>
      </div>

      {/* Resource overview */}
      {loading ? (
        <div className="text-muted dark:text-fog text-[13px]">Loading…</div>
      ) : overview && overview.available ? (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl p-4">
          <Kicker>Resources</Kicker>
          <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
            <MetricBar label="CPU" value={overview.cpu} />
            <MetricBar label="Memory" value={overview.memory} />
            <MetricBar label="Disk" value={overview.disk} />
            <div className="my-2">
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span>Network ↓</span>
                <span className="font-mono">{fmtBytes(overview.networkRx)}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span>Network ↑</span>
                <span className="font-mono">{fmtBytes(overview.networkTx)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-6 text-center text-muted dark:text-fog text-[13px]">
          Prometheus not configured — set PROMETHEUS_URL to enable metrics.
        </div>
      )}

      {/* Active alerts */}
      {firing.length > 0 && (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl p-4">
          <Kicker>Active Alerts ({firing.length})</Kicker>
          <div className="mt-3 flex flex-col gap-2">
            {firing.slice(0, 10).map(a => (
              <div key={a.fingerprint} className="flex items-start gap-2.5 py-2 border-t border-line dark:border-edge first:border-0">
                <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${severityColor(a.labels.severity)}`} />
                <div className="min-w-0">
                  <div className="font-medium text-[13px]">{a.labels.alertname ?? "Alert"}</div>
                  <div className="font-mono text-[11px] text-muted dark:text-fog truncate">
                    {a.labels.instance ?? a.labels.job ?? ""} · {fmtDuration(a.startsAt)} ago
                  </div>
                  {a.annotations.summary && (
                    <div className="text-[12px] text-muted dark:text-fog mt-0.5">{a.annotations.summary}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

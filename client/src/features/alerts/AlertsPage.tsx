import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, RefreshCw, Server } from "lucide-react";
import { api } from "../../lib/api";
import type { Alert } from "../../lib/types/alerts";
import { useEvents } from "../../lib/useEvents";
import { useUi } from "../../stores/store";

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300",
  WARNING: "border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300",
  INFO: "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300",
};

function AlertRow({ alert, onResolve }: { alert: Alert; onResolve: () => void }) {
  const { pushToast } = useUi();
  const [busy, setBusy] = useState(false);

  const resolve = async () => {
    setBusy(true);
    try {
      await api.resolveAlert(alert.id);
      pushToast("Alert resolved");
      onResolve();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed", true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex items-start justify-between p-4 rounded-card border mb-3 transition-colors ${SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.WARNING}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
            {alert.severity}
          </span>
          {(alert.serverName || alert.serverId) && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-paper/80 dark:bg-abyss/80 border border-line/60 dark:border-edge/60 text-ink dark:text-bone">
              <Server size={11} className="text-muted dark:text-fog" />
              {alert.serverName || `Server #${alert.serverId}`}
            </span>
          )}
          <span className="text-xs font-mono opacity-75">{alert.condition}</span>
        </div>
        <p className="text-sm font-medium text-ink dark:text-bone">{alert.message}</p>
        <p className="text-xs opacity-75 mt-1.5 font-mono text-muted dark:text-fog">
          Triggered {new Date(alert.triggeredAt).toLocaleString()}
          {alert.resolvedAt && ` · Resolved ${new Date(alert.resolvedAt).toLocaleString()}`}
        </p>
      </div>
      {alert.status === "TRIGGERED" && (
        <button
          onClick={resolve}
          disabled={busy}
          className="ml-4 shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-black/40 border border-current hover:bg-white dark:hover:bg-black/60 shadow-sm transition-all disabled:opacity-40"
        >
          <CheckCircle size={13} /> Resolve
        </button>
      )}
    </div>
  );
}

export function AlertsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"TRIGGERED" | "RESOLVED" | "">("TRIGGERED");

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.alerts(),
    refetchInterval: 30_000,
  });

  useEvents((ev) => {
    if (ev.type === "alert.triggered" || ev.type === "alert.resolved") {
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const triggered = alerts.filter((a) => a.status === "TRIGGERED");
  const resolved = alerts.filter((a) => a.status === "RESOLVED");
  const shown = tab === "TRIGGERED" ? triggered : tab === "RESOLVED" ? resolved : alerts;

  const tabOptions = [
    { key: "TRIGGERED" as const, label: "Triggered", count: triggered.length },
    { key: "RESOLVED" as const, label: "Resolved", count: resolved.length },
    { key: "" as const, label: "All", count: alerts.length },
  ];

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-accent/10 dark:bg-ember/10 flex items-center justify-center text-accent dark:text-ember">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h1 className="text-ink dark:text-bone font-bold text-xl">Alerts</h1>
            <p className="text-xs text-muted dark:text-fog">Real-time infrastructure warnings and trigger states</p>
          </div>
          {triggered.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
              {triggered.length}
            </span>
          )}
        </div>
        <button
          onClick={() => void refetch()}
          className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone transition-colors"
          title="Refresh"
          aria-label="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabOptions.map((t) => (
          <button
            key={t.key || "all"}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
              tab === t.key
                ? "bg-accent dark:bg-ember text-white dark:text-black border-transparent font-semibold shadow-sm"
                : "border-line dark:border-edge text-muted dark:text-fog bg-white dark:bg-panel hover:text-ink dark:hover:text-bone"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                tab === t.key
                  ? "bg-white/20 dark:bg-black/20 text-white dark:text-black"
                  : "bg-paper dark:bg-abyss text-muted dark:text-fog"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white dark:bg-panel border border-line dark:border-edge rounded-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && shown.length === 0 && (
        <div className="text-center py-16 text-muted dark:text-fog bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-500" />
          <p className="text-sm font-medium">
            {tab === "TRIGGERED"
              ? "No active alerts — systems nominal."
              : tab === "RESOLVED"
              ? "No resolved alerts recorded."
              : "No alerts recorded."}
          </p>
          <p className="text-xs text-muted dark:text-fog mt-1">All monitored systems are within expected operational thresholds.</p>
        </div>
      )}

      {shown.map((a) => (
        <AlertRow
          key={a.id}
          alert={a}
          onResolve={() => void qc.invalidateQueries({ queryKey: ["alerts"] })}
        />
      ))}
    </div>
  );
}

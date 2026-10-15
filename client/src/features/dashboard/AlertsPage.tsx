import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import type { Alert } from "../../lib/types";
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
    <div className={`flex items-start justify-between p-4 rounded-card border mb-3 ${SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.WARNING}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold uppercase">{alert.severity}</span>
          <span className="text-xs font-mono opacity-75">{alert.condition}</span>
        </div>
        <p className="text-sm font-medium text-ink dark:text-bone">{alert.message}</p>
        <p className="text-xs opacity-75 mt-1 font-mono text-muted dark:text-fog">
          {new Date(alert.triggeredAt).toLocaleString()}
          {alert.resolvedAt && ` → resolved ${new Date(alert.resolvedAt).toLocaleString()}`}
        </p>
      </div>
      {alert.status === "TRIGGERED" && (
        <button
          onClick={resolve}
          disabled={busy}
          className="ml-4 shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-white/70 dark:bg-black/30 border border-current hover:bg-white dark:hover:bg-black/50 transition-colors disabled:opacity-40"
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
    queryKey: ["alerts", tab],
    queryFn: () => api.alerts(tab || undefined),
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
        {(["TRIGGERED", "RESOLVED", ""] as const).map((t) => (
          <button
            key={t || "all"}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
              tab === t
                ? "bg-accent dark:bg-ember text-white dark:text-black border-transparent font-semibold"
                : "border-line dark:border-edge text-muted dark:text-fog bg-white dark:bg-panel hover:text-ink dark:hover:text-bone"
            }`}
          >
            {t || "All"}
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
          <p className="text-sm font-medium">No alerts{tab ? ` with status ${tab}` : ""}.</p>
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

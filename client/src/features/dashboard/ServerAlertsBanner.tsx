import { AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { timeAgo } from "../../lib/format";
import { useUi } from "../../stores/store";
import type { Alert } from "../../lib/types/alerts";

// Triggered-alert banners for a single server, with inline resolve.
export function ServerAlertsBanner({ alerts }: { alerts: Alert[] }) {
  const qc = useQueryClient();
  const pushToast = useUi((s) => s.pushToast);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`flex items-center justify-between px-4 py-3 rounded-card border shadow-xs ${
            a.severity === "CRITICAL"
              ? "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle
              size={16}
              className={`shrink-0 ${
                a.severity === "CRITICAL" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10">
                  {a.severity}
                </span>
                <span className="text-xs font-semibold">{a.message}</span>
              </div>
              <p className="text-[11px] opacity-75 font-mono mt-0.5">
                Condition: {a.condition} · Triggered {timeAgo(a.triggeredAt)}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await api.resolveAlert(a.id);
              pushToast("Alert marked as resolved");
              void qc.invalidateQueries({ queryKey: ["alerts"] });
            }}
            className="shrink-0 ml-4 px-2.5 py-1 text-xs font-semibold rounded-md bg-white/80 dark:bg-black/30 border border-current hover:bg-white dark:hover:bg-black/50 transition-colors cursor-pointer"
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}

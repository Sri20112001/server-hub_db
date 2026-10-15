import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";

export function AuditLogPage() {
  const [limit, setLimit] = useState(100);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["audit", limit],
    queryFn: () => api.audit(limit),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-accent/10 dark:bg-ember/10 flex items-center justify-center text-accent dark:text-ember">
            <ClipboardList size={20} />
          </span>
          <div>
            <h1 className="text-ink dark:text-bone font-bold text-xl">Audit Log</h1>
            <p className="text-xs text-muted dark:text-fog">Historical operational records and user security activity</p>
          </div>
          <span className="text-muted dark:text-fog text-xs font-mono bg-paper dark:bg-panel border border-line dark:border-edge px-2.5 py-1 rounded-md">
            {logs.length} records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-white dark:bg-panel border border-line dark:border-edge rounded-lg px-3 py-1.5 text-ink dark:text-bone text-xs font-mono outline-none shadow-sm"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[50, 100, 200, 500].map((n) => (
              <option key={n} value={n}>Last {n}</option>
            ))}
          </select>
          <button
            onClick={() => void refetch()}
            className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone transition-colors shadow-sm"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-paper dark:bg-emboss border-b border-line dark:border-edge">
              {["Time", "Actor", "Action", "Resource", "Result"].map((h) => (
                <th key={h} className="text-left text-muted dark:text-fog text-xs px-4 py-3 font-semibold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted dark:text-fog text-sm">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted dark:text-fog text-sm">No audit records.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b border-line dark:border-edge hover:bg-paper dark:hover:bg-emboss/40 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-muted dark:text-fog whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-ink dark:text-bone font-medium">{log.actor}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-ink dark:text-bone">{log.action}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted dark:text-fog">
                  {log.resource}{log.resourceId ? ` #${log.resourceId}` : ""}
                </td>
                <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${log.result === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {log.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

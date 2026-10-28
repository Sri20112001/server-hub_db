import { ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

// Audit tab: the latest global audit events as a table. Self-contained — the
// query only runs while this tab is mounted.
export function ServerAuditTab({ serverId }: { serverId: number }) {
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-server", serverId],
    queryFn: () => api.audit(50),
  });

  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-line dark:border-edge flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink dark:text-bone flex items-center gap-2">
          <ClipboardList size={15} className="text-accent dark:text-ember" />
          <span>Audit Trail</span>
        </h2>
        <span className="text-xs font-mono text-muted dark:text-fog">
          Latest {auditLogs.length} events
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-paper/70 dark:bg-abyss/70 border-b border-line dark:border-edge font-mono text-[11px] text-muted dark:text-fog uppercase">
              <th className="text-left px-5 py-3 font-semibold">Timestamp</th>
              <th className="text-left px-5 py-3 font-semibold">Actor</th>
              <th className="text-left px-5 py-3 font-semibold">Action & Target</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 dark:divide-edge/40 font-mono text-xs">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted dark:text-fog">
                  No audit history recorded.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-paper/40 dark:hover:bg-abyss/40 transition-colors"
                >
                  <td className="px-5 py-3 text-muted dark:text-fog whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink dark:text-bone">
                    {log.actor}
                  </td>
                  <td className="px-5 py-3 text-ink/80 dark:text-bone/80">
                    <span className="px-1.5 py-0.5 rounded bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60 mr-1.5">
                      {log.action}
                    </span>
                    <span>{log.resource}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.result === "ok"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

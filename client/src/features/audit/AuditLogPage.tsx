import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const PAGE_SIZES = [25, 50, 100, 200];

export function AuditLogPage() {
  useDocumentTitle("Audit Log");
  const [pageSize, setPageSize] = useState(100);
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit", "page", pageSize, page],
    queryFn: () => api.auditPage(pageSize, page * pageSize),
    refetchInterval: 60_000,
  });

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // If the current page fell off the end (records pruned while viewing), snap
  // back to the last real page. Adjusted during render (React's "storing
  // information from previous renders" pattern); guarded on a loaded query so
  // a still-loading fetch — data undefined, total 0 — can't yank us to page 1.
  const safePage = !isLoading && logs.length === 0 && total > 0 ? totalPages - 1 : page;
  if (safePage !== page) setPage(safePage);

  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = safePage * pageSize + logs.length;

  return (
    <div className="min-h-screen pt-20 pb-36 px-4 sm:px-6 max-w-5xl mx-auto">
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
            {total} records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-white dark:bg-panel border border-line dark:border-edge rounded-lg px-3 py-1.5 text-ink dark:text-bone text-xs font-mono outline-none shadow-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
          <button
            onClick={() => void refetch()}
            className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone transition-colors shadow-sm disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh"
            disabled={isFetching}
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : undefined} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-x-auto shadow-sm">
        <table className="w-full min-w-[580px] sm:min-w-0 text-sm border-collapse">
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

        {/* Pager */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line dark:border-edge bg-paper/50 dark:bg-abyss/50 flex-wrap">
          <span className="text-xs font-mono text-muted dark:text-fog">
            Showing {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs font-mono text-muted dark:text-fog whitespace-nowrap">
              Page {Math.min(page + 1, totalPages)} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router";
import { Plus, RefreshCw, Server } from "lucide-react";
import { ServerCard } from "../../components/ServerCard";
import { ServerGroupFilter } from "../../components/ServerGroupFilter";
import { ServerStatsRow } from "../../components/ServerStatsRow";
import { AddServerModal } from "../../components/AddServerModal";
import { useServers } from "../../hooks/useServers";

// Servers shell: header, fleet tallies, group filter, server grid and the
// add-server modal. Queries and actions come from useServers.
export function ServersPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  const nav = useNavigate();
  const d = useServers(setOnline);

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-accent/10 dark:bg-ember/10 flex items-center justify-center text-accent dark:text-ember">
            <Server size={20} />
          </span>
          <div>
            <h1 className="text-ink dark:text-bone font-bold text-xl">Servers</h1>
            <p className="text-xs text-muted dark:text-fog">Managed host nodes and remote telemetry agents</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void d.refetch()}
            className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => d.setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent dark:bg-ember text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors"
          >
            <Plus size={15} /> Add Server
          </button>
        </div>
      </div>

      {/* Summary */}
      <ServerStatsRow
        total={d.counts.total}
        online={d.counts.online}
        offline={d.counts.offline}
        warning={d.counts.warning}
      />

      {/* Group filter */}
      <ServerGroupFilter groups={d.groups} active={d.groupFilter} onSelect={d.setGroupFilter} />

      {/* Server grid */}
      {d.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {d.isError && (
        <div className="text-red-600 dark:text-red-400 text-sm p-4 bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
          Failed to load servers. <button onClick={() => void d.refetch()} className="underline font-semibold">Retry</button>
        </div>
      )}

      {!d.isLoading && !d.isError && d.filtered.length === 0 && (
        <div className="text-center py-16 text-muted dark:text-fog bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
          <Server size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No servers registered yet.</p>
          <p className="text-xs text-muted dark:text-fog mt-1">Click "Add Server" to connect your first node.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {d.filtered.map((s) => (
          <ServerCard
            key={s.id}
            s={s}
            onClick={() => nav(`/servers/${s.id}`)}
            onDelete={d.deleteServer}
          />
        ))}
      </div>

      {d.showAdd && (
        <AddServerModal
          onClose={() => d.setShowAdd(false)}
          onCreated={d.invalidate}
        />
      )}
    </div>
  );
}

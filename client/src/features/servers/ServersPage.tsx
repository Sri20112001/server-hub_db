import { useNavigate } from "react-router";
import { Plus, RefreshCw, Server } from "lucide-react";
import { ServerCard } from "../../components/ServerCard";
import { ServerTable } from "../../components/ServerTable";
import { ServerGroupFilter } from "../../components/ServerGroupFilter";
import { ServerStatsRow } from "../../components/ServerStatsRow";
import { AddServerModal } from "../../components/AddServerModal";
import { RegistryToolbar } from "../../components/ui/RegistryToolbar";
import { useServers } from "../../hooks/useServers";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "online", label: "Online" },
  { value: "warning", label: "Warning" },
  { value: "offline", label: "Offline" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "status", label: "Status" },
  { value: "heartbeat-desc", label: "Last seen (newest)" },
  { value: "heartbeat-asc", label: "Last seen (oldest)" },
];

// Servers shell: header, fleet tallies, group filter, search/sort/view
// toolbar, then the card or table registry and the add-server modal.
// Queries, filters and actions come from useServers.
export function ServersPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  useDocumentTitle("Servers");
  const nav = useNavigate();
  const d = useServers(setOnline);

  return (
    <div className="min-h-screen pt-20 pb-36 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
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
            className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone cursor-pointer"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => d.setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent dark:bg-ember text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors cursor-pointer"
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

      {/* Search / filter / sort / view */}
      <RegistryToolbar
        search={d.search}
        onSearch={d.setSearch}
        placeholder="Search by name, host, IP or OS…"
        status={d.statusFilter}
        onStatus={d.setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        sort={d.sort}
        onSort={d.setSort}
        sortOptions={SORT_OPTIONS}
        view={d.view}
        onView={d.setView}
      />

      {/* Server registry */}
      {d.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {d.isError && (
        <div className="text-red-600 dark:text-red-400 text-sm p-4 bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
          Failed to load servers. <button onClick={() => void d.refetch()} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {!d.isLoading && !d.isError && d.filtered.length === 0 && (
        <div className="text-center py-16 text-muted dark:text-fog bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
          <Server size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {d.servers.length === 0 ? "No servers registered yet." : "No servers match these filters."}
          </p>
          <p className="text-xs text-muted dark:text-fog mt-1">
            {d.servers.length === 0
              ? 'Click "Add Server" to connect your first node.'
              : "Try a different search or status."}
          </p>
        </div>
      )}

      {!d.isLoading && !d.isError && d.filtered.length > 0 && (
        d.view === "table" ? (
          <ServerTable
            servers={d.filtered}
            onOpen={(s) => nav(`/servers/${s.id}`)}
            onDelete={(s) => d.deleteServer(s)}
          />
        ) : (
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
        )
      )}

      {d.showAdd && (
        <AddServerModal
          onClose={() => d.setShowAdd(false)}
          onCreated={d.invalidate}
        />
      )}
    </div>
  );
}

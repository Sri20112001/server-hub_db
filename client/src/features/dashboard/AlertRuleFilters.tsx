import { Search } from "lucide-react";

// Search box + metric / severity / status filter pills above the rules list.
export function AlertRuleFilters({
  searchQuery,
  onSearch,
  metricFilter,
  onMetric,
  severityFilter,
  onSeverity,
  statusFilter,
  onStatus,
}: {
  searchQuery: string;
  onSearch: (v: string) => void;
  metricFilter: string;
  onMetric: (v: string) => void;
  severityFilter: string;
  onSeverity: (v: string) => void;
  statusFilter: string;
  onStatus: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-fog pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search alert rules or servers…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-xs text-ink dark:text-bone pl-8 pr-3 py-2 outline-none focus:border-accent dark:focus:border-ember"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        {/* Metric Filter */}
        <div className="flex items-center p-0.5 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge text-xs">
          {["all", "cpu", "memory", "disk"].map((m) => (
            <button
              key={m}
              onClick={() => onMetric(m)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                metricFilter === m
                  ? "bg-white dark:bg-panel text-ink dark:text-bone font-bold shadow-xs"
                  : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center p-0.5 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge text-xs">
          {["all", "CRITICAL", "WARNING"].map((s) => (
            <button
              key={s}
              onClick={() => onSeverity(s)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                severityFilter === s
                  ? "bg-white dark:bg-panel text-ink dark:text-bone font-bold shadow-xs"
                  : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
              }`}
            >
              {s === "all" ? "ALL" : s}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center p-0.5 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge text-xs">
          {[
            { key: "all", label: "ALL" },
            { key: "enabled", label: "ON" },
            { key: "disabled", label: "OFF" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onStatus(key)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                statusFilter === key
                  ? "bg-white dark:bg-panel text-ink dark:text-bone font-bold shadow-xs"
                  : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

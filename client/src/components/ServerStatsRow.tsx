// Fleet tally tiles above the server grid: total / online / offline / warning.
export function ServerStatsRow({
  total,
  online,
  offline,
  warning,
}: {
  total: number;
  online: number;
  offline: number;
  warning: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total", value: total, color: "text-ink dark:text-bone" },
        { label: "Online", value: online, color: "text-green-600 dark:text-green-400" },
        { label: "Offline", value: offline, color: "text-red-600 dark:text-red-400" },
        { label: "Warning", value: warning, color: "text-yellow-600 dark:text-yellow-400" },
      ].map((c) => (
        <div key={c.label} className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4">
          <div className="text-muted dark:text-fog text-xs uppercase tracking-wider mb-1">{c.label}</div>
          <div className={`font-bold text-2xl font-mono ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

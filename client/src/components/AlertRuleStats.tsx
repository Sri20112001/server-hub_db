// Stats deck above the rules list: totals for all / active / critical /
// warning rules.
export function AlertRuleStats({
  total,
  enabled,
  critical,
  warning,
}: {
  total: number;
  enabled: number;
  critical: number;
  warning: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="p-3.5 rounded-card bg-white dark:bg-panel border border-line dark:border-edge">
        <div className="text-[11px] font-mono text-muted dark:text-fog uppercase">Total Rules</div>
        <div className="text-xl font-bold font-head text-ink dark:text-bone mt-1">{total}</div>
      </div>
      <div className="p-3.5 rounded-card bg-white dark:bg-panel border border-line dark:border-edge">
        <div className="text-[11px] font-mono text-muted dark:text-fog uppercase">Active / ON</div>
        <div className="text-xl font-bold font-head text-emerald-600 dark:text-emerald-400 mt-1">
          {enabled}
        </div>
      </div>
      <div className="p-3.5 rounded-card bg-white dark:bg-panel border border-line dark:border-edge">
        <div className="text-[11px] font-mono text-muted dark:text-fog uppercase">Critical Rules</div>
        <div className="text-xl font-bold font-head text-red-600 dark:text-red-400 mt-1">
          {critical}
        </div>
      </div>
      <div className="p-3.5 rounded-card bg-white dark:bg-panel border border-line dark:border-edge">
        <div className="text-[11px] font-mono text-muted dark:text-fog uppercase">Warning Rules</div>
        <div className="text-xl font-bold font-head text-amber-600 dark:text-amber-400 mt-1">
          {warning}
        </div>
      </div>
    </div>
  );
}

import { Clock, Pencil, Server, Trash2 } from "lucide-react";
import { fmtForSec } from "../utils/alertRuleFormat";
import { MetricIcon } from "./MetricIcon";
import type { AlertRule } from "../lib/types/alerts";

// One alert rule row: metric glyph, severity badge, condition / duration /
// scope chips, and the toggle / edit / delete actions.
export function RuleCard({
  rule,
  canWrite,
  canDelete,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AlertRule;
  canWrite: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCritical = rule.severity === "CRITICAL";

  return (
    <div
      className={`bg-white dark:bg-panel border rounded-card p-4 transition-all duration-150 ${
        rule.enabled
          ? "border-line dark:border-edge shadow-xs hover:border-line-hover dark:hover:border-edge-hover"
          : "border-line/60 dark:border-edge/60 opacity-65 bg-paper/40 dark:bg-abyss/40"
      }`}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge shrink-0 flex items-center justify-center mt-0.5">
            <MetricIcon metric={rule.metric} size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-ink dark:text-bone font-bold text-sm tracking-tight truncate">
                {rule.name}
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  isCritical
                    ? "bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400"
                    : "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400"
                }`}
              >
                {rule.severity}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-paper dark:bg-abyss border border-line dark:border-edge text-ink dark:text-bone font-semibold">
                {rule.metric.toUpperCase()} {rule.operator === "above" ? ">" : "<"} {rule.threshold}%
              </span>

              <span className="inline-flex items-center gap-1 text-muted dark:text-fog">
                <Clock size={11} />
                {fmtForSec(rule.forSec)}
              </span>

              <span className="inline-flex items-center gap-1 text-muted dark:text-fog">
                <Server size={11} />
                {rule.serverName ? (
                  <span className="text-ink dark:text-bone font-medium">{rule.serverName}</span>
                ) : (
                  <span className="opacity-75">All servers</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canWrite && (
            <button
              onClick={onToggle}
              className={`text-xs px-2.5 py-1 rounded-md border font-mono font-semibold transition-colors cursor-pointer ${
                rule.enabled
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-line dark:border-edge bg-paper dark:bg-abyss text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
              }`}
              title={rule.enabled ? "Disable rule" : "Enable rule"}
            >
              {rule.enabled ? "ACTIVE" : "DISABLED"}
            </button>
          )}

          {canWrite && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md border border-line dark:border-edge bg-paper dark:bg-abyss text-muted dark:text-fog hover:text-ink dark:hover:text-bone hover:border-line-hover dark:hover:border-edge-hover transition-colors cursor-pointer"
              title="Edit rule"
              aria-label="Edit rule"
            >
              <Pencil size={13} />
            </button>
          )}

          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md border border-line dark:border-edge bg-paper dark:bg-abyss text-muted dark:text-fog hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
              title="Delete rule"
              aria-label="Delete rule"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

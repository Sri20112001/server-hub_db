import { Sparkles } from "lucide-react";
import { RECOMMENDED_PRESETS, type RulePreset } from "./alertRulePresets";
import { fmtForSec } from "./alertRuleFormat";
import { MetricIcon } from "./MetricIcon";
import type { AlertRule } from "../../lib/types/alerts";

// Collapsible gallery of curated starter rules. Each card can deploy its
// preset directly — disabled once an identical global rule already exists.
export function AlertRuleTemplates({
  rules,
  canWrite,
  open,
  onToggle,
  onDeploy,
}: {
  rules: AlertRule[];
  canWrite: boolean;
  open: boolean;
  onToggle: () => void;
  onDeploy: (p: RulePreset) => void;
}) {
  return (
    <div className="mb-6 bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent dark:text-ember" />
          <h2 className="text-sm font-bold text-ink dark:text-bone">
            Curated Alert Rule Templates
          </h2>
          <span className="text-xs text-muted dark:text-fog">
            ({RECOMMENDED_PRESETS.length} available)
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-mono text-accent dark:text-ember hover:underline cursor-pointer"
        >
          {open ? "Hide Templates" : "Show All Templates"}
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-line/60 dark:border-edge/60">
          {RECOMMENDED_PRESETS.map((p) => {
            const alreadyExists = rules.some(
              (r) => r.name.toLowerCase() === p.name.toLowerCase() && r.serverId === null,
            );
            return (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-paper/60 dark:bg-abyss/60 border border-line dark:border-edge"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <MetricIcon metric={p.metric} size={14} />
                    <span className="font-semibold text-xs text-ink dark:text-bone">
                      {p.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        p.severity === "CRITICAL"
                          ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {p.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted dark:text-fog mt-1 leading-snug">
                    {p.description}
                  </p>
                  <div className="text-[10px] font-mono text-muted dark:text-fog mt-1.5">
                    {p.metric.toUpperCase()} {p.operator} {p.threshold}% · {fmtForSec(p.forSec)}
                  </div>
                </div>

                {canWrite && (
                  <button
                    type="button"
                    disabled={alreadyExists}
                    onClick={() => onDeploy(p)}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer border ${
                      alreadyExists
                        ? "opacity-50 border-line dark:border-edge bg-paper dark:bg-abyss text-muted dark:text-fog cursor-default"
                        : "border-accent/40 dark:border-ember/40 bg-accent/10 dark:bg-ember/15 text-accent dark:text-ember hover:bg-accent dark:hover:bg-ember hover:text-white dark:hover:text-black font-semibold"
                    }`}
                  >
                    {alreadyExists ? "Active" : "+ Add"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

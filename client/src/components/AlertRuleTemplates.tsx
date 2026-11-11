import { Sparkles, X } from "lucide-react";
import { RECOMMENDED_PRESETS, type RulePreset } from "../utils/alertRulePresets";
import { fmtForSec } from "../utils/alertRuleFormat";
import { MetricIcon } from "./MetricIcon";
import type { AlertRule } from "../lib/types/alerts";

// Curated starter rules, moved off the rules page body into a modal opened
// from the header. Each card can deploy its preset directly — disabled once
// an identical global rule already exists.
export function AlertRuleTemplates({
  rules,
  canWrite,
  open,
  onToggle,
  onDeploy,
  onSeed,
  seeding,
}: {
  rules: AlertRule[];
  canWrite: boolean;
  open: boolean;
  onToggle: () => void;
  onDeploy: (p: RulePreset) => void;
  onSeed?: () => void;
  seeding?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onToggle}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card w-full max-w-2xl max-h-[88dvh] overflow-y-auto shadow-chrome"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Curated alert rule templates"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-panel border-b border-line dark:border-edge">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-accent dark:text-ember shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-ink dark:text-bone">
                Curated Alert Rule Templates
              </h2>
              <p className="text-[11px] text-muted dark:text-fog">
                {RECOMMENDED_PRESETS.length} starter rules · add any one, or keep tuning your own
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Close templates"
            className="p-1.5 rounded-md text-muted dark:text-fog hover:text-ink dark:hover:text-bone hover:bg-paper dark:hover:bg-emboss transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
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
                  <div className="flex items-center gap-2 flex-wrap">
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

        {canWrite && onSeed && (
          <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-t border-line dark:border-edge">
            <p className="text-[11px] text-muted dark:text-fog">
              Adds every recommended rule that isn't already active.
            </p>
            <button
              type="button"
              onClick={onSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-semibold bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={13} />
              <span>{seeding ? "Deploying…" : "Deploy starter pack"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

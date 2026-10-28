import type { ReactNode } from "react";

interface VitalCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  percentage?: number;
  subtext?: string;
}

// Single vitals tile: icon + label header, big value, optional subtext and a
// colour-ramped progress bar (amber ≥ 75%, red ≥ 90%).
export function VitalCard({ icon, label, value, percentage, subtext }: VitalCardProps) {
  const hasPct = typeof percentage === "number" && !isNaN(percentage);
  const clampedPct = hasPct ? Math.min(Math.max(percentage, 0), 100) : 0;

  const getMeterColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500 shadow-xs shadow-red-500/50";
    if (pct >= 75) return "bg-amber-500 shadow-xs shadow-amber-500/50";
    return "bg-accent dark:bg-ember shadow-xs shadow-accent/40 dark:shadow-ember/40";
  };

  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 flex flex-col justify-between hover:border-line dark:hover:border-edge transition-all shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60 text-ink/70 dark:text-bone/70">
            {icon}
          </span>
          <span className="text-[11px] uppercase tracking-wider font-mono font-medium text-muted dark:text-fog">
            {label}
          </span>
        </div>
        {hasPct && (
          <span className="font-mono text-xs font-bold text-ink dark:text-bone">
            {clampedPct.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="my-1">
        <div className="text-xl font-bold font-mono tracking-tight text-ink dark:text-bone truncate">
          {value}
        </div>
        {subtext && (
          <p className="text-[11px] font-mono text-muted dark:text-fog truncate mt-0.5">
            {subtext}
          </p>
        )}
      </div>

      {hasPct && (
        <div className="mt-2.5 w-full h-1.5 bg-paper dark:bg-abyss rounded-full overflow-hidden border border-line/40 dark:border-edge/40">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getMeterColor(clampedPct)}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

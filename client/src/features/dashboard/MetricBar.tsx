// Labelled percentage bar with 70%/90% tone thresholds; renders an empty
// track when the value is unknown.
export function MetricBar({ label, value }: { label: string; value: number | null }) {
  if (value === null || value < 0) return (
    <div className="my-2">
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span>{label}</span><span className="font-mono text-muted dark:text-fog">—</span>
      </div>
      <div className="h-1.5 rounded-full bg-paper dark:bg-abyss border border-line dark:border-edge" />
    </div>
  );
  const pct = Math.max(0, Math.min(100, value));
  const tone = pct >= 90 ? "bg-brick" : pct >= 70 ? "bg-accent dark:bg-ember" : "bg-ink dark:bg-bone";
  const w = Math.round(pct / 5) * 5;
  return (
    <div className="my-2">
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span>{label}</span><span className="font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-paper dark:bg-abyss border border-line dark:border-edge overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

import { fmtRate } from "../lib/format";
import { RANGES, type TelemetryRange } from "../hooks/useTelemetry";
import { TelemetryChart } from "./TelemetryChart";
import type { RichPoint } from "../utils/telemetryFormat";

// Description line + the 15m/1h/6h/24h range switcher above the charts.
export function TelemetryRangeControls({
  range,
  onRange,
}: {
  range: TelemetryRange;
  onRange: (r: TelemetryRange) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <p className="text-muted dark:text-fog text-[13px]">
          One sample per minute, kept for 7 days. Ranges switch the charts.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-paper dark:bg-abyss border border-line dark:border-edge mb-8 w-full sm:max-w-sm">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRange(r)}
            aria-pressed={range === r}
            className={`px-3 py-2 rounded-lg font-mono text-[12px] cursor-pointer border transition-colors duration-150 ${
              range === r
                ? "bg-white dark:bg-panel text-ink dark:text-bone border-line dark:border-edge shadow-sm"
                : "bg-transparent text-muted dark:text-fog border-transparent hover:text-ink dark:hover:text-bone"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </>
  );
}

// CPU / memory / disk / network / disk-IO history charts with their loading
// and empty states.
export function TelemetryCharts({
  loading,
  hasPoints,
  rich,
}: {
  loading: boolean;
  hasPoints: boolean;
  rich: RichPoint[];
}) {
  return (
    <>
      {loading ? (
        <div className="text-muted dark:text-fog text-[13px]">Tuning the dials…</div>
      ) : !hasPoints ? (
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-8 text-center">
          <div className="font-head font-semibold mb-1">No readings yet</div>
          <div className="text-muted dark:text-fog text-[13px]">
            The sampler records every minute — check back shortly.
          </div>
        </div>
      ) : (
        <>
          <TelemetryChart
            title="CPU"
            unit="load"
            points={rich}
            value={(p) => p.cpu}
            max={(v) => Math.max(100, ...v)}
            stroke="#EA580C"
            fill="#EA580C"
            format={(v) => `${v.toFixed(1)}%`}
          />
          <TelemetryChart
            title="Memory"
            unit="used"
            points={rich}
            value={(p) => p.memPct}
            max={(v) => Math.max(100, ...v)}
            stroke="#16A34A"
            fill="#16A34A"
            format={(v) => `${v.toFixed(1)}%`}
          />
          <TelemetryChart
            title="Disk"
            unit="used"
            points={rich}
            value={(p) => p.diskPct}
            max={(v) => Math.max(100, ...v)}
            stroke="#D97706"
            fill="#D97706"
            format={(v) => `${v.toFixed(1)}%`}
          />
          <TelemetryChart
            title="Network"
            unit=""
            points={rich}
            value={(p) => p.rx}
            value2={(p) => p.tx}
            max={(v) => Math.max(...v, 1)}
            stroke="#0E7490"
            fill="#0E7490"
            stroke2="#7C3AED"
            fill2="#7C3AED"
            label2="out"
            format={fmtRate}
          />
          <TelemetryChart
            title="Disk I/O"
            unit=""
            points={rich}
            value={(p) => p.rd}
            value2={(p) => p.wr}
            max={(v) => Math.max(...v, 1)}
            stroke="#2563EB"
            fill="#2563EB"
            stroke2="#DB2777"
            fill2="#DB2777"
            label2="write"
            format={fmtRate}
          />
        </>
      )}
    </>
  );
}

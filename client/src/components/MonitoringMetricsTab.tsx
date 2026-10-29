import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { PromRangeResult } from "../lib/types/monitoring";
import { Kicker } from "./ui/Kicker";
import { fmtBytes } from "../utils/monitoringFormat";
import { SvgChart } from "./SvgChart";

const METRIC_OPTIONS = [
  { id: "cpu", label: "CPU", color: "#EA580C" },
  { id: "memory", label: "Memory", color: "#16A34A" },
  { id: "disk", label: "Disk", color: "#D97706" },
  { id: "networkRx", label: "Network ↓", color: "#0E7490" },
  { id: "networkTx", label: "Network ↑", color: "#7C3AED" },
] as const;

const RANGES = ["1h", "6h", "24h", "7d"] as const;

// Metrics tab: Prometheus range query explorer with metric and window
// switchers over a single SVG chart.
export function MonitoringMetricsTab() {
  const [metric, setMetric] = useState<string>("cpu");
  const [range, setRange] = useState<string>("1h");
  const [data, setData] = useState<PromRangeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Intentional: refetch chart data when the metric or range changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    api.monitoringMetrics(metric, range)
      .then(r => setData(r.data))
      .catch(e => { setError(e.message); setData(null); })
      .finally(() => setLoading(false));
  }, [metric, range]);

  const color = METRIC_OPTIONS.find(m => m.id === metric)?.color ?? "#EA580C";
  const lastVal = data?.result?.[0]?.values?.at(-1)?.[1];
  const isPercent = metric === "cpu" || metric === "memory" || metric === "disk";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-paper dark:bg-abyss border border-line dark:border-edge">
          {METRIC_OPTIONS.map(m => (
            <button key={m.id} onClick={() => setMetric(m.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[12px] cursor-pointer border transition-colors ${metric === m.id ? "bg-white dark:bg-panel border-line dark:border-edge" : "bg-transparent border-transparent text-muted dark:text-fog"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-paper dark:bg-abyss border border-line dark:border-edge">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[12px] cursor-pointer border transition-colors ${range === r ? "bg-white dark:bg-panel border-line dark:border-edge" : "bg-transparent border-transparent text-muted dark:text-fog"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-6 text-center">
          <div className="text-brick font-medium mb-1">Prometheus unavailable</div>
          <div className="text-muted dark:text-fog text-[13px]">{error}</div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <Kicker>{METRIC_OPTIONS.find(m => m.id === metric)?.label ?? metric}</Kicker>
            {lastVal && (
              <span className="font-mono text-[13px]">
                {isPercent ? `${parseFloat(lastVal).toFixed(1)}%` : fmtBytes(parseFloat(lastVal))}
              </span>
            )}
          </div>
          {loading ? (
            <div className="h-28 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl flex items-center justify-center text-muted dark:text-fog text-[12px]">
              Loading…
            </div>
          ) : (
            <SvgChart data={data} color={color} />
          )}
        </div>
      )}
    </div>
  );
}

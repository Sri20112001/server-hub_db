import { useState } from "react";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { MetricChart } from "./MetricChart";

const RANGES = ["1h", "6h", "24h", "7d", "30d"] as const;
type Range = (typeof RANGES)[number];

// Historical metrics for the selected range. Owns the range selector state —
// it is only meaningful while this tab is mounted.
function useServerMetricsHistory(serverId: number) {
  const [range, setRange] = useState<Range>("1h");
  const { data } = useQuery({
    queryKey: ["server-metrics", serverId, range],
    queryFn: () => api.serverMetrics(serverId, range),
  });
  return { range, setRange, points: data?.points ?? [] };
}

// Monitoring tab: time-range selector plus CPU / memory / disk / load charts.
export function ServerMonitoringTab({ serverId }: { serverId: number }) {
  const { range, setRange, points } = useServerMetricsHistory(serverId);

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-panel border border-line dark:border-edge rounded-card px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-mono text-muted dark:text-fog">
          <Activity size={13} className="text-accent dark:text-ember" />
          <span>Historical Metrics Range</span>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                range === r
                  ? "bg-accent dark:bg-ember text-white dark:text-black font-semibold shadow-xs"
                  : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-12 text-center text-muted dark:text-fog space-y-2">
          <Activity size={32} className="mx-auto opacity-30 text-accent dark:text-ember" />
          <p className="text-sm font-semibold text-ink dark:text-bone">
            No telemetry recorded for this timeframe
          </p>
          <p className="text-xs max-w-sm mx-auto">
            Ensure the serverhub-agent daemon is running and has published metrics within the selected range.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MetricChart
            title="CPU Utilization"
            points={points}
            value={(p) => p.cpuUsage}
            stroke="#EA580C"
            fillId="cpuGradient"
            unit="%"
          />
          <MetricChart
            title="Memory Utilization"
            points={points}
            value={(p) => p.memoryUsage}
            stroke="#10B981"
            fillId="memGradient"
            unit="%"
          />
          <MetricChart
            title="Disk Storage Usage"
            points={points}
            value={(p) => p.diskUsage}
            stroke="#F59E0B"
            fillId="diskGradient"
            unit="%"
          />
          <MetricChart
            title="System Load Average (1m)"
            points={points}
            value={(p) => p.loadAvg1}
            stroke="#8B5CF6"
            fillId="loadGradient"
            unit=""
          />
        </div>
      )}
    </div>
  );
}

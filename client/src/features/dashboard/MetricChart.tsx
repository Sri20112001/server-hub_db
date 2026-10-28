import type { ServerMetricPoint } from "../../lib/types/servers";

interface MetricChartProps {
  title: string;
  points: ServerMetricPoint[];
  value: (p: ServerMetricPoint) => number;
  stroke: string;
  fillId: string;
  unit: string;
}

// Sparkline card: avg/min/max header, gradient area fill, and first/last
// timestamps along the bottom.
export function MetricChart({ title, points, value, stroke, fillId, unit }: MetricChartProps) {
  const W = 600;
  const H = 140;
  const vals = points.map(value);

  const hi = vals.length ? Math.max(...vals) : 0;
  const lo = vals.length ? Math.min(...vals) : 0;
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const last = vals.length ? vals[vals.length - 1] : 0;
  const scaleMax = hi > 0 ? hi * 1.15 : 100;

  const step = points.length > 1 ? W / (points.length - 1) : 0;
  const pathCoordinates = vals.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(H - 12 - (Math.min(v, scaleMax) / scaleMax) * (H - 28));
    return `${x},${y}`;
  });

  const linePath = pathCoordinates.join(" ");
  const areaPath = `0,${H} ${linePath} ${W},${H}`;

  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4.5 flex flex-col justify-between shadow-xs">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold text-ink dark:text-bone tracking-wide uppercase font-mono">
            {title}
          </span>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-muted dark:text-fog">
            <span>Avg: {avg.toFixed(1)}{unit}</span>
            <span>·</span>
            <span>Min: {lo.toFixed(1)}{unit}</span>
            <span>·</span>
            <span>Max: {hi.toFixed(1)}{unit}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-base font-bold text-ink dark:text-bone">
            {last.toFixed(1)}
            <span className="text-muted dark:text-fog text-xs ml-0.5 font-normal">{unit}</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-paper/60 dark:bg-abyss/60 border border-line/60 dark:border-edge/60 p-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-32 overflow-visible"
          role="img"
          aria-label={`${title} chart`}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={Math.round(H * f)}
              y2={Math.round(H * f)}
              stroke="currentColor"
              className="text-line/60 dark:text-edge/60"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          {points.length > 1 && <polygon points={areaPath} fill={`url(#${fillId})`} />}

          {/* Polyline */}
          {points.length > 1 ? (
            <polyline
              points={linePath}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : points.length === 1 ? (
            <circle cx={W / 2} cy={H / 2} r="4" fill={stroke} />
          ) : null}
        </svg>
      </div>

      {/* Timestamp labels */}
      <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-muted dark:text-fog">
        <span>{points.length ? new Date(points[0].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
        <span>Latest: {points.length ? new Date(points[points.length - 1].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
      </div>
    </div>
  );
}

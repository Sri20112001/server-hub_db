import type { PromRangeResult } from "../../lib/types/monitoring";

// Minimal SVG area chart for a single Prometheus range series.
export function SvgChart({ data, color }: { data: PromRangeResult | null; color: string }) {
  if (!data || !data.result?.length) return (
    <div className="h-28 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl flex items-center justify-center text-muted dark:text-fog text-[12px]">
      No data
    </div>
  );
  const series = data.result[0].values;
  if (!series.length) return null;
  const W = 560; const H = 112;
  const vals = series.map(([, v]) => parseFloat(v));
  const hi = Math.max(...vals, 1);
  const step = series.length > 1 ? W / (series.length - 1) : 0;
  const pts = vals.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(H - 8 - (Math.min(v, hi) / hi) * (H - 16));
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl">
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-line dark:stroke-edge" strokeWidth="1" />
      ))}
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={color} opacity="0.2" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

import { Kicker } from "./ui/Kicker";
import { CountUp } from "./ui/CountUp";
import { fmtTime, type RichPoint } from "../utils/telemetryFormat";

// Area/line history chart with an optional second series (e.g. net rx/tx).
// Narrower than before so the telemetry page can pair charts two-up; the
// line draws itself and the fill rises in on mount (see index.css).
export function TelemetryChart({
  title,
  unit,
  points,
  value,
  value2,
  max,
  stroke,
  fill,
  stroke2,
  fill2,
  label2,
  format,
}: {
  title: string;
  unit: string;
  points: RichPoint[];
  value: (p: RichPoint) => number;
  value2?: (p: RichPoint) => number;
  max: (vals: number[]) => number;
  stroke: string;
  fill: string;
  stroke2?: string;
  fill2?: string;
  label2?: string;
  format: (v: number) => string;
}) {
  const W = 420;
  const H = 112;
  const vals = points.map(value);
  const vals2 = value2 ? points.map(value2) : null;
  const hi = Math.max(max(vals), ...vals, ...(vals2 ?? []), 1);
  const step = points.length > 1 ? W / (points.length - 1) : 0;
  const toXY = (vs: number[]) =>
    vs
      .map((v, i) => {
        const x = Math.round(i * step);
        const y = Math.round(H - 10 - (Math.min(v, hi) / hi) * (H - 24));
        return `${x},${y}`;
      })
      .join(" ");
  const line = toXY(vals);
  const line2 = vals2 ? toXY(vals2) : null;
  const last = vals.length ? vals[vals.length - 1] : 0;
  const last2 = vals2 && vals2.length ? vals2[vals2.length - 1] : 0;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <Kicker>{title}</Kicker>
        <span className="font-mono text-[13px] text-right">
          <CountUp value={last} format={format} />
          {label2 && vals2 ? (
            <span className="text-muted dark:text-fog text-[11px]">
              {" / "}
              <CountUp value={last2} format={format} /> {label2}
            </span>
          ) : (
            <span className="text-muted dark:text-fog text-[11px]"> {unit}</span>
          )}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-28 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl"
        role="img"
        aria-label={`${title} history chart`}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={W}
            y1={H * f}
            y2={H * f}
            className="stroke-line dark:stroke-edge"
            strokeWidth="1"
          />
        ))}
        <polygon
          className="chart-area"
          points={`0,${H} ${line} ${W},${H}`}
          fill={fill}
          opacity="0.25"
        />
        {line2 && stroke2 && fill2 && (
          <polygon
            className="chart-area"
            points={`0,${H} ${line2} ${W},${H}`}
            fill={fill2}
            opacity="0.2"
          />
        )}
        <polyline
          className="chart-line"
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {line2 && stroke2 && (
          <polyline
            className="chart-line"
            points={line2}
            fill="none"
            stroke={stroke2}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <div className="flex items-center justify-between gap-3 mt-1">
        <span className="font-mono text-[11px] text-muted dark:text-fog">
          {points.length ? fmtTime(points[0].ts) : "—"}
        </span>
        <span className="font-mono text-[11px] text-muted dark:text-fog">
          max {format(hi)}
          {points.length ? ` · ${fmtTime(points[points.length - 1].ts)}` : ""}
        </span>
      </div>
    </div>
  );
}

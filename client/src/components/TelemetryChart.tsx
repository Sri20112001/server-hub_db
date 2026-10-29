import { Kicker } from "./ui/Kicker";
import { fmtTime, type RichPoint } from "../utils/telemetryFormat";

// Area/line history chart with an optional second series (e.g. net rx/tx).
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
  const W = 560;
  const H = 140;
  const vals = points.map(value);
  const vals2 = value2 ? points.map(value2) : null;
  const hi = Math.max(max(vals), ...vals, ...(vals2 ?? []), 1);
  const step = points.length > 1 ? W / (points.length - 1) : 0;
  const toXY = (vs: number[]) =>
    vs
      .map((v, i) => {
        const x = Math.round(i * step);
        const y = Math.round(H - 12 - (Math.min(v, hi) / hi) * (H - 28));
        return `${x},${y}`;
      })
      .join(" ");
  const line = toXY(vals);
  const line2 = vals2 ? toXY(vals2) : null;
  const last = vals.length ? vals[vals.length - 1] : 0;
  const last2 = vals2 && vals2.length ? vals2[vals2.length - 1] : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1.5">
        <Kicker>{title}</Kicker>
        <span className="font-mono text-[13px]">
          {format(last)}{" "}
          {label2 && vals2 ? (
            <span className="text-muted dark:text-fog text-[11px]">
              / {format(last2)} {label2}
            </span>
          ) : (
            <span className="text-muted dark:text-fog text-[11px]">{unit}</span>
          )}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-36 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl"
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
        <polygon points={`0,${H} ${line} ${W},${H}`} fill={fill} opacity="0.25" />
        {line2 && stroke2 && fill2 && (
          <polygon points={`0,${H} ${line2} ${W},${H}`} fill={fill2} opacity="0.2" />
        )}
        <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        {line2 && stroke2 && (
          <polyline points={line2} fill="none" stroke={stroke2} strokeWidth="2" strokeLinejoin="round" />
        )}
      </svg>
      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="font-mono text-[11px] text-muted dark:text-fog">
          {points.length ? fmtTime(points[0].ts) : "—"}
        </span>
        <span className="font-mono text-[11px] text-muted dark:text-fog">
          max {format(hi)}{points.length ? ` · ${fmtTime(points[points.length - 1].ts)}` : ""}
        </span>
      </div>
    </div>
  );
}

import type { TelemetryPoint } from "../lib/types/telemetry";

// Pure shaping/format helpers for the telemetry page: per-sample network and
// disk rates, plus the number/time renderers used across the charts and tables.

export type RichPoint = TelemetryPoint & { rx: number; tx: number; rd: number; wr: number };

export function fmtTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function fmtGB(gb: number): string {
  if (gb == null || gb < 0) return "—";
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  return `${gb.toFixed(1)} GB`;
}

export function fmtBytesTotal(b: number): string {
  if (!b || b < 0) return "0 B";
  if (b < 1024) return `${Math.round(b)} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function fmtSize(mb: number): string {
  if (mb == null || mb < 0) return "—";

  if (mb < 1) {
    return `${Math.round(mb * 1024)} KB`;
  }

  if (mb < 1024) {
    return `${mb.toFixed(0)} MB`;
  }

  const gb = mb / 1024;

  if (gb < 1024) {
    return `${gb.toFixed(1)} GB`;
  }

  return `${(gb / 1024).toFixed(1)} TB`;
}

export function rates(
  points: TelemetryPoint[],
  key: "netRx" | "netTx" | "diskRead" | "diskWrite",
): number[] {
  return points.map((p, i) => {
    if (i === 0) return 0;
    const dt = Math.max(1, p.ts - points[i - 1].ts);
    const dv = Math.max(0, p[key] - points[i - 1][key]);
    return dv / dt / 1024;
  });
}

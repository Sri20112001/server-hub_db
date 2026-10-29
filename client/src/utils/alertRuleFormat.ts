// Pure formatting helpers shared by the alert-rule card and the template
// gallery — no React involved.

export function fmtForSec(s: number): string {
  if (s <= 0) return "instant";
  if (s < 60) return `${s}s sustained`;
  if (s < 3600) return `${Math.round(s / 60)}m sustained`;
  return `${Math.round(s / 3600)}h sustained`;
}

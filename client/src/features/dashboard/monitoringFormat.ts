// Pure formatting helpers shared by the monitoring tabs: network rate
// rendering, alert age, and severity text tone.

export function fmtBytes(b: number | null): string {
  if (b === null || b < 0) return "—";
  if (b < 1024) return `${b.toFixed(0)} B/s`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB/s`;
  return `${(b / 1024 / 1024).toFixed(1)} MB/s`;
}

export function fmtDuration(start: string): string {
  const ms = Date.now() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export function severityColor(sev: string | undefined): string {
  switch ((sev ?? "").toLowerCase()) {
    case "critical": return "text-brick";
    case "warning": return "text-status-amber";
    default: return "text-muted dark:text-fog";
  }
}

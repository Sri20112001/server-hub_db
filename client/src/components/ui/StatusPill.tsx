import { fleetLabel, toFleetStatus, type FleetStatus } from "../../lib/types/status";

const PIP_TONE: Record<FleetStatus, string> = {
  sailing: "bg-moss",
  choppy: "bg-status-amber",
  lost: "bg-brick",
  docked: "bg-stone",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const f: FleetStatus = toFleetStatus(status);
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full font-mono text-[11px] bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${PIP_TONE[f]}`} />
      {label ?? fleetLabel[f]}
    </span>
  );
}

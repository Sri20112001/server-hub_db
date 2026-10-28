/** Normalised fleet status used across the UI. */
export type FleetStatus = "sailing" | "choppy" | "lost" | "docked";

export function toFleetStatus(raw: string | undefined): FleetStatus {
  const s = (raw ?? "").toLowerCase();
  if (s === "healthy" || s === "running" || s === "success" || s === "ok") return "sailing";
  if (s === "degraded" || s === "choppy" || s === "running_partial") return "choppy";
  if (s === "down" || s === "failed" || s === "error") return "lost";
  return "docked";
}

export const fleetLabel: Record<FleetStatus, string> = {
  sailing: "Sailing",
  choppy: "Choppy",
  lost: "Lost signal",
  docked: "Docked",
};

import { Hash } from "lucide-react";
import { Kicker } from "./ui/Kicker";
import { StatusPill } from "./ui/StatusPill";
import { CountUp } from "./ui/CountUp";
import { fleetLabel, toFleetStatus } from "../lib/types/status";
import { shortSha, timeAgo } from "../lib/format";
import type { Deployment, Project, Service } from "../lib/types/projects";

// Table mode for the fleet registry. Rows open the same ship drawer as the
// cards; the leading checkbox feeds the bulk lifecycle actions.
export function ShipTable({
  projects,
  servicesByProject,
  recentByProject,
  picked,
  onTogglePick,
  onOpen,
}: {
  projects: Project[];
  servicesByProject: Record<number, Service[]>;
  recentByProject: Map<number, Deployment>;
  picked: Set<number>;
  onTogglePick: (id: number) => void;
  onOpen: (p: Project) => void;
}) {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13px]">
          <thead>
            <tr>
              {["", "Ship", "Status", "Environment", "Stations", "Last launch", "Commit"].map(
                (h, i) => (
                  <th
                    key={h || i}
                    className={`text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss ${
                      i >= 4 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const services = servicesByProject[p.id] ?? [];
              const last = recentByProject.get(p.id);
              const f = toFleetStatus(p.status);
              return (
                <tr
                  key={p.id}
                  onClick={() => onOpen(p)}
                  className="cursor-pointer hover:bg-paper dark:hover:bg-emboss transition-colors"
                >
                  <td className="pl-4 pr-1 py-3 border-t border-line dark:border-edge align-middle w-8">
                    <input
                      type="checkbox"
                      checked={picked.has(p.id)}
                      onChange={() => onTogglePick(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${p.name}`}
                      className="w-4 h-4 accent-current cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3 border-t border-line dark:border-edge align-middle">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          f === "sailing"
                            ? "bg-moss"
                            : f === "choppy"
                              ? "bg-status-amber"
                              : f === "lost"
                                ? "bg-brick"
                                : "bg-stone"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink dark:text-bone truncate">
                          {p.name}
                        </div>
                        <div className="font-mono text-[11px] text-muted dark:text-fog truncate">
                          ~/{p.repository || p.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle">
                    <StatusPill status={p.status} label={fleetLabel[f]} />
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle font-mono text-[11px] text-muted dark:text-fog">
                    {p.environment || "—"}
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle text-right font-mono">
                    <CountUp value={services.length} />
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle text-right font-mono text-[11px] text-muted dark:text-fog">
                    {last ? timeAgo(last.startedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle text-right">
                    {last?.commitSha ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                        <Hash size={11} /> {shortSha(last.commitSha)}
                      </span>
                    ) : (
                      <span className="text-muted dark:text-fog text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-line dark:border-edge">
        <Kicker>{projects.length} ships shown</Kicker>
      </div>
    </div>
  );
}

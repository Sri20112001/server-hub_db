import { Hash } from "lucide-react";
import { Kicker } from "./ui/Kicker";
import { StatusPill } from "./ui/StatusPill";
import { fleetLabel, toFleetStatus, type FleetStatus } from "../lib/types/status";
import { type Deployment, type Project, type Service } from "../lib/types/projects";
import { shortSha, timeAgo } from "../lib/format";

const DOT_TONE: Record<FleetStatus, string> = {
  sailing: "bg-moss",
  choppy: "bg-status-amber",
  lost: "bg-brick",
  docked: "bg-stone",
};

// One fleet card: ship identity + status dot, repository path, service chips,
// and a footer with station count / last launch. Used by both the dashboard
// preview grid and the full Fleet page.
export function ShipCard({
  project,
  services,
  last,
  onOpen,
  selection,
}: {
  project: Project;
  services: Service[];
  last: Deployment | undefined;
  onOpen: () => void;
  selection?: { checked: boolean; onToggle: () => void };
}) {
  const f = toFleetStatus(project.status);
  return (
    <div
      className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 transition-colors duration-150 cursor-pointer hover:border-accent dark:hover:border-ember"
      onClick={onOpen}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {selection && (
            <input
              type="checkbox"
              checked={selection.checked}
              onChange={selection.onToggle}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${project.name}`}
              className="w-4 h-4 accent-current cursor-pointer"
            />
          )}
          <span className={`w-2 h-2 rounded-full ${DOT_TONE[f]}`} />
          <span className="font-head font-bold text-[17px]">
            {project.name}
          </span>
        </div>
        {project.environment && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            v·{project.environment}
          </span>
        )}
      </div>
      <div className="font-mono text-muted dark:text-fog text-[11px] mt-1">
        ~/{project.repository || project.name}
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-2.5">
        {services.length === 0 && (
          <span className="text-muted dark:text-fog text-xs">
            No stations charted
          </span>
        )}
        {services.slice(0, 4).map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${DOT_TONE[toFleetStatus(s.status)]}`}
            />
            {s.name}
          </span>
        ))}
        {services.length > 4 && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            +{services.length - 4}
          </span>
        )}
      </div>
      <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 flex items-center gap-2 flex-wrap justify-between mt-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <Kicker>Stations</Kicker>
            <div className="font-mono text-[13px]">{services.length}</div>
          </div>
          <div>
            <Kicker>Last launch</Kicker>
            <div className="font-mono text-[13px]">
              {last ? `${timeAgo(last.startedAt)}` : "—"}
            </div>
          </div>
        </div>
        {last?.commitSha && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            <Hash size={11} /> {shortSha(last.commitSha)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 mt-3">
        <span className="text-muted dark:text-fog text-xs">
          {f === "sailing"
            ? "Ready to roll"
            : f === "choppy"
              ? "Throttle detected"
              : f === "lost"
                ? "Distress call"
                : "Standing by"}
        </span>
        <StatusPill status={project.status} label={fleetLabel[f]} />
      </div>
    </div>
  );
}

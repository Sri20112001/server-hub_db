import { Hash, MapPin } from "lucide-react";
import { Kicker } from "./ui/Kicker";
import { StatusPill } from "./ui/StatusPill";
import { CountUp } from "./ui/CountUp";
import { fleetLabel, toFleetStatus, type FleetStatus } from "../lib/types/status";
import { type Deployment, type Project, type Service } from "../lib/types/projects";
import { shortSha, timeAgo } from "../lib/format";

const DOT_TONE: Record<FleetStatus, string> = {
  sailing: "bg-moss",
  choppy: "bg-status-amber",
  lost: "bg-brick",
  docked: "bg-stone",
};

// One fleet card: identity, repository, station count, last launch and the
// service chips, finished with a status pill. Used by both the dashboard
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
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Ship ${project.name}, ${fleetLabel[f]}`}
      className="group bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 sm:p-5 cursor-pointer select-none
                 hover:border-accent dark:hover:border-ember hover:shadow-md hover:-translate-y-0.5
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-ember focus-visible:ring-offset-2 dark:focus-visible:ring-offset-abyss
                 transition-all duration-200"
    >
      {/* Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {selection && (
            <input
              type="checkbox"
              checked={selection.checked}
              onChange={selection.onToggle}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${project.name}`}
              className="w-4 h-4 accent-current cursor-pointer shrink-0"
            />
          )}
          <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_TONE[f]}`} />
          <span className="font-head font-bold text-[17px] truncate">
            {project.name}
          </span>
        </div>
        {project.environment && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            {project.environment}
          </span>
        )}
      </div>

      {/* Repository */}
      <div className="flex items-center gap-1.5 font-mono text-muted dark:text-fog text-[11px] mt-1.5 min-w-0">
        <MapPin size={11} className="shrink-0 opacity-70" />
        <span className="truncate">~/{project.repository || project.name}</span>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-2 gap-2 mt-3.5">
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-3 py-2">
          <Kicker>Stations</Kicker>
          <div className="font-mono text-[15px] font-semibold text-ink dark:text-bone mt-0.5">
            <CountUp value={services.length} />
          </div>
        </div>
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-3 py-2">
          <Kicker>Last launch</Kicker>
          <div className="font-mono text-[13px] text-ink dark:text-bone mt-1 truncate">
            {last ? timeAgo(last.startedAt) : "—"}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        {services.length === 0 && (
          <span className="text-muted dark:text-fog text-xs">No stations charted</span>
        )}
        {services.slice(0, 3).map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap max-w-[45%]"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_TONE[toFleetStatus(s.status)]}`} />
            <span className="truncate">{s.name}</span>
          </span>
        ))}
        {services.length > 3 && (
          <span className="inline-flex items-center font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            +{services.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 mt-3.5 pt-3 border-t border-line/60 dark:border-edge/60">
        <StatusPill status={project.status} label={fleetLabel[f]} />
        <span className="inline-flex items-center gap-1.5 text-muted dark:text-fog text-[11px] font-mono">
          {last?.commitSha ? (
            <>
              <Hash size={11} /> {shortSha(last.commitSha)}
            </>
          ) : (
            <span className="group-hover:text-accent dark:group-hover:text-ember transition-colors">
              Open manifest →
            </span>
          )}
        </span>
      </div>
    </article>
  );
}

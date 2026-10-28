import { ScrollText } from "lucide-react";
import { Kicker } from "../../components/ui/Kicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { LogsViewer } from "./LogsViewer";
import type { ProjectDetails } from "./useProjectDetails";

// Live logs card: per-station container chips plus the streaming viewer.
export function ProjectLiveLogs({ d }: { d: ProjectDetails }) {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 sm:p-5 mt-4">
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <ScrollText size={15} />
        <Kicker>Live logs</Kicker>
      </div>
      {d.services.filter((s) => s.containerName).length === 0 ? (
        <EmptyState
          title="No loggable stations"
          hint="Stations need a container name before their logs can stream."
        />
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            {d.services
              .filter((s) => s.containerName)
              .map((s) => {
                const active =
                  (d.logService ?? d.services.find((x) => x.containerName)?.containerName) ===
                  s.containerName;
                return (
                  <button
                    key={s.id}
                    onClick={() => d.setLogService(s.containerName ?? null)}
                    aria-pressed={active}
                    className={`font-mono text-[11px] px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors duration-150 ${
                      active
                        ? "bg-tint dark:bg-emboss border-line dark:border-edge text-ink dark:text-bone"
                        : "bg-transparent border-transparent text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
          </div>
          <LogsViewer
            container={
              d.logService ??
              d.services.find((x) => x.containerName)?.containerName ??
              ""
            }
          />
        </>
      )}
    </div>
  );
}

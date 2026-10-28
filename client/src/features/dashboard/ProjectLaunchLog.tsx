import { Hash, History } from "lucide-react";
import { Kicker } from "../../components/ui/Kicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusPill } from "../../components/ui/StatusPill";
import { fmtDuration, shortSha, timeAgo } from "../../lib/format";
import type { ProjectDetails } from "./useProjectDetails";

// Launch log card: past deployments with duration, age, status and the
// rollback action.
export function ProjectLaunchLog({ d }: { d: ProjectDetails }) {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 sm:p-5 mt-4">
      <Kicker>Launch log · {d.deployments.length}</Kicker>
      <div className="mt-2.5 flex flex-col gap-3">
        {d.deployments.length === 0 && <EmptyState title="No launches yet" />}
        {d.deployments.map((dep) => (
          <div key={dep.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[13px] bg-paper dark:bg-abyss sm:bg-transparent sm:dark:bg-transparent border border-line dark:border-edge sm:border-0 rounded-xl sm:rounded-none px-3 py-2.5 sm:p-0">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap self-start">
              <Hash size={11} /> {shortSha(dep.commitSha)}
            </span>
            <span className="flex items-center gap-3 flex-wrap font-mono text-muted dark:text-fog text-xs">
              <span>{fmtDuration(dep.durationSec)}</span>
              <span>{timeAgo(dep.startedAt)}</span>
            </span>
            <span className="flex items-center gap-2">
            <StatusPill status={dep.status} />
            <button
              className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
              title={`Roll back to ${shortSha(dep.commitSha)}`}
              disabled={d.busy}
              onClick={() => d.setPendingRollback(dep)}
            >
              <History size={12} />
            </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

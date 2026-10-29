import { GitBranch, Hash } from "lucide-react";
import { Kicker } from "./ui/Kicker";
import { StatusPill } from "./ui/StatusPill";
import { fmtDuration, shortSha, timeAgo } from "../lib/format";
import type { DashboardData } from "../lib/types/dashboard";
import type { Project } from "../lib/types/projects";

// Deployment activity: the recent-launches table plus its footer (count and
// the wipe-history button).
export function RecentLaunches({
  data,
  projectById,
  onWipe,
}: {
  data: DashboardData;
  projectById: Map<number, Project>;
  onWipe: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 mt-8 mb-4">
        <div>
          <Kicker>Deployment activity</Kicker>
          <h2 className="font-head text-[22px] font-bold tracking-[-0.02em] mt-1">
            Recent launches
          </h2>
        </div>
      </div>
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-0 overflow-hidden">
        <div className="overflow-x-auto -mx-px">
          <table className="w-full min-w-[560px] md:min-w-0 border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">
                  Commit SHA
                </th>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">
                  Target / Vessel
                </th>
                <th className="hidden md:table-cell text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">
                  Branch
                </th>
                <th className="hidden md:table-cell text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">
                  Duration
                </th>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">
                  Timestamp
                </th>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentDeployments.length === 0 && (
                <tr className="group">
                  <td
                    colSpan={6}
                    className="px-4 py-3 border-t border-line dark:border-edge align-middle text-center text-muted dark:text-fog"
                  >
                    No launches recorded yet.
                  </td>
                </tr>
              )}
              {data.recentDeployments.map((d) => (
                <tr key={d.id} className="group">
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                      <Hash size={11} /> {shortSha(d.commitSha)}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <div className="font-medium">
                      {projectById.get(d.projectId)?.name ?? `#${d.projectId}`}
                    </div>
                    <div className="font-mono text-muted dark:text-fog text-xs">
                      {d.trigger ?? ""}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                      <GitBranch size={11} /> {d.branch || "—"}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss font-mono">
                    {fmtDuration(d.durationSec)}
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    {timeAgo(d.startedAt)}
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <StatusPill status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-between px-4 py-[0.7rem] border-t border-line dark:border-edge text-muted dark:text-fog text-xs">
          <span>
            Showing {data.recentDeployments.length} of {data.counts.deployments}{" "}
            launches logged
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
            onClick={onWipe}
            title="Wipe deployment history"
          >
            Clear history
          </button>
        </div>
      </div>
    </>
  );
}

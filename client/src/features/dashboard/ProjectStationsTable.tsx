import { Kicker } from "../../components/ui/Kicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusPill } from "../../components/ui/StatusPill";
import type { ProjectDetails } from "./useProjectDetails";

// Stations card: name/type/status table of the project's services.
export function ProjectStationsTable({ d }: { d: ProjectDetails }) {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 sm:p-5 mt-4">
      <Kicker>Stations · {d.services.length}</Kicker>
      <div className="mt-2.5">
        {d.services.length === 0 ? (
          <EmptyState title="No stations charted" hint="Add services via the API to track them here." />
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[420px] sm:min-w-0 border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">Station</th>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">Type</th>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss first:rounded-l-[10px] last:rounded-r-[10px] last:text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {d.services.map((s) => (
                <tr key={s.id} className="group">
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <div className="font-mono">{s.name}</div>
                    {s.containerName && <div className="font-mono text-muted dark:text-fog text-xs">{s.containerName}</div>}
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                      {s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss">
                    <StatusPill status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

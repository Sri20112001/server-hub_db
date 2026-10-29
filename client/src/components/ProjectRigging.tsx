import { Kicker } from "./ui/Kicker";
import type { Project } from "../lib/types/projects";

// Rigging card: repository/branch/environment facts plus the auto-deploy
// flag row.
export function ProjectRigging({ project }: { project: Project }) {
  const facts: Array<[string, string]> = [
    ["Repository", project.repository || "—"],
    ["Branch", project.branch || "—"],
    ["Environment", project.environment || "—"],
    ["Compose file", project.composeFile || "—"],
    ["Deployment path", project.deploymentPath || "—"],
    ["Gateway prefix", project.gatewayPrefix || "—"],
  ];

  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-4">
      <Kicker>Rigging</Kicker>
      <div className="mt-2.5 flex flex-col gap-4">
        {facts.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="text-muted dark:text-fog">{k}</span>
            <span className="font-mono text-right max-w-[60%] overflow-hidden text-ellipsis" title={v}>
              {v}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 text-[13px]">
          <span className="text-muted dark:text-fog">Auto-deploy</span>
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full font-mono text-[11px] bg-paper dark:bg-abyss text-ink dark:text-bone whitespace-nowrap border-0">
            {project.autoDeploy ? "ON — webhook steers" : "OFF — manual helm"}
          </span>
        </div>
      </div>
    </div>
  );
}

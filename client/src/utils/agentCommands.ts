// Agent launcher command preview: builds the exact run command for the
// platform flavour picked in the token callout. Pure — no React involved.

export type AgentCliPlatform = "flag" | "ps" | "cmd" | "sh";

export const AGENT_CLI_PLATFORMS: { id: AgentCliPlatform; label: string }[] = [
  { id: "flag", label: "Cross-Platform" },
  { id: "ps", label: "PowerShell" },
  { id: "cmd", label: "CMD" },
  { id: "sh", label: "Bash / Linux" },
];

export function getRunnerCommand(
  platform: AgentCliPlatform,
  token: string,
  baseUrl: string,
): string {
  switch (platform) {
    case "flag":
      return `./serverhub-agent -token="${token}" -url="${baseUrl}"`;
    case "ps":
      return `$env:AGENT_TOKEN="${token}"; $env:SERVERHUB_URL="${baseUrl}"; .\\serverhub-agent.exe`;
    case "cmd":
      return `set AGENT_TOKEN=${token}&& set SERVERHUB_URL=${baseUrl}&& serverhub-agent.exe`;
    case "sh":
      return `AGENT_TOKEN="${token}" SERVERHUB_URL="${baseUrl}" ./serverhub-agent`;
  }
}

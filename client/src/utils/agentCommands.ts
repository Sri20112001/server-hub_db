// Agent launcher command preview: builds the exact run command for the
// platform flavour picked in the token callout. Pure — no React involved.

export type AgentCliPlatform =
  | "installer"
  | "linux-dl"
  | "mac-dl"
  | "win-dl"
  | "sh"
  | "flag"
  | "ps"
  | "cmd";

export const AGENT_CLI_PLATFORMS: { id: AgentCliPlatform; label: string }[] = [
  { id: "installer", label: "Linux Auto-Service (1-Click)" },
  { id: "linux-dl", label: "Linux (Download + Run)" },
  { id: "mac-dl", label: "macOS (Download + Run)" },
  { id: "win-dl", label: "Windows (Download + Run)" },
  { id: "sh", label: "Linux (Manual)" },
  { id: "flag", label: "Cross-Platform" },
  { id: "ps", label: "PowerShell" },
  { id: "cmd", label: "CMD" },
];

// downloadUrl points at the API endpoint that serves a prebuilt agent binary,
// so the target host needs neither Go nor the repo.
export function agentDownloadUrl(
  baseUrl: string,
  osName: "linux" | "darwin" | "windows",
  arch = "amd64",
): string {
  return `${baseUrl}/server-hub/api/agent/download?os=${osName}&arch=${arch}`;
}

export function getRunnerCommand(
  platform: AgentCliPlatform,
  token: string,
  baseUrl: string,
): string {
  switch (platform) {
    case "installer":
      return `sudo ./install.sh -token="${token}" -url="${baseUrl}"`;
    case "linux-dl":
      return (
        `curl -fsSL "${agentDownloadUrl(baseUrl, "linux")}" -o serverhub-agent && ` +
        `chmod +x serverhub-agent && ` +
        `./serverhub-agent -token="${token}" -url="${baseUrl}"`
      );
    case "mac-dl": {
      // Apple Silicon is the common case; Intel Macs use ?arch=amd64.
      const url = agentDownloadUrl(baseUrl, "darwin", "arm64");
      return (
        `curl -fsSL "${url}" -o serverhub-agent && ` +
        `chmod +x serverhub-agent && ` +
        `./serverhub-agent -token="${token}" -url="${baseUrl}"`
      );
    }
    case "win-dl":
      return (
        `Invoke-WebRequest "${agentDownloadUrl(baseUrl, "windows")}" -OutFile serverhub-agent.exe; ` +
        `.\\serverhub-agent.exe -token="${token}" -url="${baseUrl}"`
      );
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

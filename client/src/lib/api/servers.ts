import { req } from "./http";
import type { AgentToken, ManagedServer, ServerGroup, ServerMetricPoint } from "../types/servers";

export const serversApi = {
  // managed servers
  servers: () => req<ManagedServer[]>("/server-hub/api/servers"),
  managedServer: (id: number) => req<ManagedServer>(`/server-hub/api/servers/${id}`),
  createServer: (body: { name: string; hostname?: string; ipAddress?: string; groupId?: number }) =>
    req<{ id: number; name: string }>("/server-hub/api/servers", { method: "POST", body: JSON.stringify(body) }),
  updateServer: (id: number, body: Partial<{ name: string; hostname: string; ipAddress: string; groupId: number }>) =>
    req<{ ok: boolean }>(`/server-hub/api/servers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteServer: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/servers/${id}`, { method: "DELETE" }),
  serverMetrics: (id: number, range = "1h") =>
    req<{ range: string; points: ServerMetricPoint[] }>(`/server-hub/api/servers/${id}/metrics?range=${range}`),
  serverMetricsLatest: (id: number) =>
    req<ServerMetricPoint>(`/server-hub/api/servers/${id}/metrics/latest`),

  // agent tokens
  agentTokens: (serverId: number) =>
    req<AgentToken[]>(`/server-hub/api/servers/${serverId}/tokens`),
  createAgentToken: (serverId: number, label?: string) =>
    req<{ id: number; token: string; label: string }>(`/server-hub/api/servers/${serverId}/tokens`, {
      method: "POST", body: JSON.stringify({ label: label ?? "" }),
    }),
  revokeAgentToken: (serverId: number, tokenId: number) =>
    req<{ ok: boolean }>(`/server-hub/api/servers/${serverId}/tokens/${tokenId}`, { method: "DELETE" }),

  // server groups
  serverGroups: () => req<ServerGroup[]>("/server-hub/api/server-groups"),
  createServerGroup: (name: string, description?: string) =>
    req<{ id: number; name: string }>("/server-hub/api/server-groups", {
      method: "POST", body: JSON.stringify({ name, description: description ?? "" }),
    }),
  deleteServerGroup: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/server-groups/${id}`, { method: "DELETE" }),
};

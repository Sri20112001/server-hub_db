// ─── Managed Servers ─────────────────────────────────────────────────────────

export interface ManagedServer {
  id: number;
  name: string;
  hostname: string;
  ipAddress: string;
  os: string;
  osVersion: string;
  arch: string;
  cpuInfo: string;
  cpuCores: number;
  ramTotal: number;
  diskTotal: number;
  status: "ONLINE" | "OFFLINE" | "WARNING" | "UNKNOWN";
  agentStatus: "CONNECTED" | "DISCONNECTED" | "UNKNOWN";
  lastHeartbeat: string | null;
  groupId: number | null;
  cpuUsagePct?: number;
  ramUsagePct?: number;
  diskUsagePct?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerGroup {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface ServerMetricPoint {
  id: number;
  serverId: number;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryUsedMB: number;
  diskUsage: number;
  diskUsedGB: number;
  netRx: number;
  netTx: number;
  loadAvg1: number;
  uptimeSec: number;
}

export interface AgentToken {
  id: number;
  serverId: number;
  label: string;
  revoked: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

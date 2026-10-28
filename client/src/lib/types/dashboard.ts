import type { Deployment, Project } from "./projects";

export interface DashboardData {
  server: {
    cpuPercent: number;
    memTotalMB: number;
    memUsedMB: number;
    memPercent: number;
    diskTotalGB: number;
    diskUsedGB: number;
    diskPercent: number;
    uptimeSec: number;
  };
  counts: {
    projects: number;
    services: number;
    deployments: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  projects: Project[];
  recentDeployments: Deployment[];
  dockerAvailable: boolean;
}

export interface ServerInfo {
  cpu: number;
  memTotalMB: number;
  memUsedMB: number;
  memPercent: number;
  diskTotalGB: number;
  diskUsedGB: number;
  diskPercent: number;
  uptimeSec: number;
  cpuCores: number;
  netRxRate: number;
  netTxRate: number;
  projects: number;
  services: number;
  deployments: number;
  containers: number;
  runningContainers: number;
  dockerAvailable: boolean;
}

export interface Alert {
  id: number;
  serverId: number | null;
  serverName?: string;
  condition: string;
  threshold: number;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "TRIGGERED" | "RESOLVED";
  message: string;
  triggeredAt: string;
  resolvedAt: string | null;
}

export interface AlertRule {
  id: number;
  serverId: number | null;
  serverName: string | null;
  name: string;
  metric: "cpu" | "memory" | "disk";
  operator: "above" | "below";
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  forSec: number;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

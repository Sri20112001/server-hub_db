export interface HealthCheck {
  id: number;
  name: string;
  type: "http" | "tcp" | "ping";
  target: string;
  interval: number;
  timeout: number;
  expectedStatus: number;
  enabled: boolean;
  status: "UP" | "DOWN" | "UNKNOWN";
  responseTimeMs: number | null;
  lastCheckedAt: string | null;
  serverId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckResult {
  id: number;
  healthCheckId: number;
  timestamp: string;
  status: "UP" | "DOWN";
  responseTimeMs: number;
  error: string;
}

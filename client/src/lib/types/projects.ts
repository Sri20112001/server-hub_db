export interface Project {
  id: number;
  name: string;
  description?: string;
  repository?: string;
  branch?: string;
  environment?: string;
  deploymentPath?: string;
  composeFile?: string;
  gatewayPrefix?: string;
  healthUrl?: string;
  status: string;
  autoDeploy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  projectId: number;
  name: string;
  type: string;
  containerName?: string;
  internalPort?: number;
  hostPort?: number;
  healthUrl?: string;
  dockerServiceName?: string;
  status: string;
  lastHealth?: string;
  lastHealthAt?: string;
  responseTimeMs?: number;
}

export interface Deployment {
  id: number;
  projectId: number;
  commitSha?: string;
  branch?: string;
  trigger?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationSec?: number;
  logs?: string;
}

export interface SecretMeta {
  id: number;
  projectId: number;
  name: string;
  environment: string;
  serviceId?: number;
  configured: boolean;
  updatedAt: string;
}

export interface BulkLifecycleResult {
  ok: boolean;
  action: string;
  succeeded: number;
  failed: number;
  results: { id: number; name: string; ok: boolean; error?: string; operationId?: string }[];
}

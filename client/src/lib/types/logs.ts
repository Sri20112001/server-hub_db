export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  result: string;
  metadata?: string;
}

export interface BusEvent {
  type: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface AppLog {
  id: number;
  timestamp: string;
  level: string;
  source: string;
  actor?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  projectId?: number;
  message: string;
  metadata?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  latencyMs?: number;
}

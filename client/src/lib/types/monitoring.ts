// ─── Prometheus / Alertmanager monitoring ────────────────────────────────────

export interface MonitoringOverview {
  available: boolean;
  cpu: number | null;
  memory: number | null;
  disk: number | null;
  networkRx: number | null;
  networkTx: number | null;
}

export interface PrometheusStatus {
  available: boolean;
  healthy?: boolean;
  status: string;
}

export interface AlertmanagerStatus {
  available: boolean;
  healthy?: boolean;
  status: string;
}

/** Raw Prometheus target as returned by /api/v1/targets */
export interface PromTarget {
  discoveredLabels: Record<string, string>;
  labels: Record<string, string>;
  scrapePool: string;
  scrapeUrl: string;
  globalUrl: string;
  lastError: string;
  lastScrape: string;
  lastScrapeDuration: number;
  health: "up" | "down" | "unknown";
}

export interface PromTargetsData {
  activeTargets: PromTarget[];
  droppedTargets: PromTarget[];
}

/** Alertmanager alert as returned by /api/v2/alerts */
export interface AmAlert {
  fingerprint: string;
  status: {
    state: "active" | "suppressed" | "unprocessed";
    silencedBy: string[];
    inhibitedBy: string[];
  };
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt: string;
  generatorURL: string;
  receivers: { name: string }[];
}

/** Alertmanager silence as returned by /api/v2/silences */
export interface AmSilence {
  id: string;
  status: { state: "active" | "expired" | "pending" };
  updatedAt: string;
  comment: string;
  createdBy: string;
  startsAt: string;
  endsAt: string;
  matchers: { name: string; value: string; isRegex: boolean; isEqual: boolean }[];
}

/** Prometheus range query result (matrix) */
export interface PromRangeResult {
  resultType: string;
  result: {
    metric: Record<string, string>;
    values: [number, string][];
  }[];
}

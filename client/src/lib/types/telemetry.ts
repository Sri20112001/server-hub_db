export interface TelemetryPoint {
  ts: number;
  cpu: number;
  memPct: number;
  memMB: number;
  diskPct: number;
  netRx: number;
  netTx: number;
  diskRead: number;
  diskWrite: number;
}

export interface TelemetryHistory {
  range: string;
  points: TelemetryPoint[];
}

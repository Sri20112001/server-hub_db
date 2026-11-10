export interface DbServerInfo {
  key: string;
  engine: string;
  source: string;
  name: string;
  host: string;
  port: number;
  container: string;
  version: string;
  state: string;
  verified: boolean;
  hasCreds: boolean;
  registered: string[];
}

export interface DbItem {
  name: string;
  sizeBytes: number;
  registered: boolean;
  system: boolean;
}

export interface DbTarget {
  engine: string;
  source: string;
  host: string;
  port: number;
  container: string;
  username?: string;
  password?: string;
}

// Engines the backend can actually browse. Fleet services detected as
// databases without a running container come back as "unknown", so the UI
// must ask the user which engine they run before calling browse.
export const DB_ENGINES = ["postgres", "mysql", "redis", "mongo"] as const;
export type DbEngine = (typeof DB_ENGINES)[number];

export function isSupportedEngine(engine?: string | null): engine is DbEngine {
  return DB_ENGINES.includes(String(engine ?? "").toLowerCase().trim() as DbEngine);
}

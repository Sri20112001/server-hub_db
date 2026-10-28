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

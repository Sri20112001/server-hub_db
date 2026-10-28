export interface MemDetail {
  totalMB: number;
  usedMB: number;
  availableMB: number;
  freeMB: number;
  cachedMB: number;
  buffersMB: number;
  usedPct: number;
  swapTotalMB: number;
  swapUsedMB: number;
  swapFreeMB: number;
  swapPct: number;
}

export interface Filesystem {
  device: string;
  mount: string;
  fstype: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usedPct: number;
}

export interface CPUDetail {
  logicalCores: number;
  physicalCores: number;
  model: string;
  mhz: number;
  load1: number;
  load5: number;
  load15: number;
  timesUserPct: number;
  timesSysPct: number;
  timesIdlePct: number;
  timesIowaitPct: number;
}

export interface NetIface {
  name: string;
  rxBytes: number;
  txBytes: number;
  rxErrors: number;
  txErrors: number;
}

export interface DiskIO {
  device: string;
  readMB: number;
  writeMB: number;
  readOps: number;
  writeOps: number;
}

export interface ProcInfo {
  pid: number;
  name: string;
  status: string;
  memMB: number;
  memPct: number;
}

export interface ServerDetail {
  host: {
    hostname: string;
    os: string;
    platform: string;
    kernel: string;
    arch: string;
    uptimeSec: number;
    goVersion: string;
  };
  cpu: CPUDetail;
  memory: MemDetail;
  filesystems: Filesystem[];
  network: NetIface[];
  diskIO: DiskIO[];
  processes: {
    total: number;
    running: number;
    sleeping: number;
    other: number;
    zombie: number;
    top: ProcInfo[];
  };
  pressure: { cpu: string; memory: string; disk: string };
}

export interface AppUsage {
  name: string;
  path: string;
  bytesMB: number;
}

export interface StorageInfo {
  filesystems: Filesystem[];
  appsRoot: string;
  apps: AppUsage[];
  appsPartial: boolean;
  docker: {
    imagesMB: number;
    containersMB: number;
    volumesMB: number;
    buildCacheMB: number;
    imagesTop: { name: string; sizeMB: number }[];
  } | null;
}

export interface ContainerStat {
  id: string;
  name: string;
  image: string;
  state: string;
  cpuPercent: number;
  memMB: number;
  memLimitMB: number;
  memPct: number;
  netRxMB: number;
  netTxMB: number;
  blockReadMB: number;
  blockWriteMB: number;
  pids: number;
}

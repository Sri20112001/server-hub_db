import { req } from "./http";
import type { ContainerStat, ServerDetail, StorageInfo } from "../types/host";
import type { TelemetryHistory } from "../types/telemetry";

export const telemetryApi = {
  // telemetry history for the resource timeline
  telemetry: (range: string = "1h") =>
    req<TelemetryHistory>(`/server-hub/api/telemetry?range=${range}`),

  // host inventory (detail, storage, per-container stats)
  serverDetail: () => req<ServerDetail>("/server-hub/api/server/detail"),
  storage: () => req<StorageInfo>("/server-hub/api/server/storage"),
  containerStats: () =>
    req<ContainerStat[]>("/server-hub/api/containers/stats"),
};

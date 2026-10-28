import { authApi } from "./api/auth";
import { dashboardApi } from "./api/dashboard";
import { projectsApi } from "./api/projects";
import { deploymentsApi } from "./api/deployments";
import { discoveryApi } from "./api/discovery";
import { secretsApi } from "./api/secrets";
import { notifyApi } from "./api/notify";
import { telemetryApi } from "./api/telemetry";
import { operationsApi } from "./api/operations";
import { backupsApi } from "./api/backups";
import { databasesApi } from "./api/databases";
import { logsApi } from "./api/logs";
import { serversApi } from "./api/servers";
import { alertsApi } from "./api/alerts";
import { healthApi } from "./api/health";
import { monitoringApi } from "./api/monitoring";

export { API_BASE, ApiError } from "./api/http";

// Public API facade: one `api` object assembled from the per-domain method
// groups in lib/api/. Importers keep a single entry point; the domain
// modules own the paths, payloads and types.
export const api = {
  ...authApi,
  ...dashboardApi,
  ...projectsApi,
  ...deploymentsApi,
  ...discoveryApi,
  ...secretsApi,
  ...notifyApi,
  ...telemetryApi,
  ...operationsApi,
  ...backupsApi,
  ...databasesApi,
  ...logsApi,
  ...serversApi,
  ...alertsApi,
  ...healthApi,
  ...monitoringApi,
};

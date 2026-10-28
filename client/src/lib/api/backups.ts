import { API_BASE, req } from "./http";
import type { Backup } from "../types/operations";

export const backupsApi = {
  // backups (directory snapshots + metadata)
  backups: (projectId: number) =>
    req<Backup[]>(`/server-hub/api/projects/${projectId}/backups`),
  createBackup: (projectId: number) =>
    req<{ ok: boolean; operationId: string; projectId: number }>(
      `/server-hub/api/projects/${projectId}/backups`,
      { method: "POST" },
    ),
  deleteBackup: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/backups/${id}`, { method: "DELETE" }),
  downloadBackupUrl: (id: number) =>
    `${API_BASE}/server-hub/api/backups/${id}/download`,
  restoreBackup: (id: number) =>
    req<{ ok: boolean; operationId: string; backupId: number }>(
      `/server-hub/api/backups/${id}/restore?confirm=true`,
      { method: "POST" },
    ),
};

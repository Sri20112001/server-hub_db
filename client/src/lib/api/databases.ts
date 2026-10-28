import { req } from "./http";
import type { DbItem, DbServerInfo, DbTarget } from "../types/databases";

export const databasesApi = {
  // databases: auto-detected servers (Docker, host ports, fleet services).
  // Browse lists what's inside; connect saves the credential; register
  // turns ticked databases into services under a project.
  dbServers: () =>
    req<{ servers: DbServerInfo[]; dockerAvailable: boolean }>(
      "/server-hub/api/databases/servers",
    ),
  browseDatabases: (t: DbTarget) =>
    req<{ databases: DbItem[]; authRequired: boolean }>(
      "/server-hub/api/databases/browse",
      { method: "POST", body: JSON.stringify(t) },
    ),
  connectDatabase: (t: DbTarget) =>
    req<{ ok: boolean; key: string; hasCreds: boolean; databases: number }>(
      "/server-hub/api/databases/connect",
      { method: "POST", body: JSON.stringify(t) },
    ),
  registerDatabases: (
    projectId: number,
    server: DbTarget,
    databases: string[],
    username?: string,
    password?: string,
  ) =>
    req<{ ok: boolean; registered: { database: string; serviceId: number }[]; skipped: string[] }>(
      "/server-hub/api/databases/register",
      { method: "POST", body: JSON.stringify({ projectId, server, databases, username, password }) },
    ),
};

import { req } from "./http";
import type { Operation } from "../types/operations";

export const operationsApi = {
  // operations (unified progress for deploys, restarts, backups …)
  operation: (id: string) => req<Operation>(`/server-hub/api/operations/${id}`),
  operations: (limit = 20) =>
    req<Operation[]>(`/server-hub/api/operations?limit=${limit}`),

  // container exec terminal (single-use token, then WebSocket)
  execToken: (container: string, shell = "/bin/sh", confirm = true) =>
    req<{ token: string; operationId: string; id: string }>(
      `/server-hub/api/containers/${encodeURIComponent(container)}/exec${
        confirm ? "?confirm=true" : ""
      }`,
      { method: "POST", body: JSON.stringify({ shell }) },
    ),
};

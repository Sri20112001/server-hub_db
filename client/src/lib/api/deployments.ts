import { req } from "./http";
import type { Deployment, Service } from "../types/projects";

export const deploymentsApi = {
  // services & deployments
  services: (projectId: number) =>
    req<Service[]>(`/server-hub/api/projects/${projectId}/services`),
  deployments: (projectId: number) =>
    req<Deployment[]>(`/server-hub/api/projects/${projectId}/deployments`),
  deploy: (projectId: number, commitSha?: string) =>
    req<{ deployment: Deployment; operationId: string }>(
      `/server-hub/api/projects/${projectId}/deploy`,
      {
        method: "POST",
        body: JSON.stringify({ commitSha: commitSha ?? "" }),
      },
    ),
  wipeDeployments: () =>
    req<{ ok: boolean; deleted: number }>("/server-hub/api/deployments", { method: "DELETE" }),
  rollback: (projectId: number, depId: number) =>
    req<{ deployment: Deployment; operationId: string }>(
      `/server-hub/api/projects/${projectId}/deployments/${depId}/rollback`,
      { method: "POST" },
    ),
};

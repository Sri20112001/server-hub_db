import { req } from "./http";
import type { BulkLifecycleResult, Project } from "../types/projects";

export const projectsApi = {
  // projects
  projects: () => req<Project[]>("/server-hub/api/projects"),
  project: (id: number) => req<Project>(`/server-hub/api/projects/${id}`),
  createProject: (p: Partial<Project>) =>
    req<Project>("/server-hub/api/projects", { method: "POST", body: JSON.stringify(p) }),
  // The server rewrites every editable column, so always send the full field
  // set (seeded from the current project), not just the changed keys.
  updateProject: (id: number, p: Partial<Project>) =>
    req<Project>(`/server-hub/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(p),
    }),
  projectAction: (id: number, action: "start" | "stop" | "restart", confirm = false) =>
    req<{ ok: boolean; logs?: string }>(
      `/server-hub/api/projects/${id}/${action}${confirm ? "?confirm=true" : ""}`,
      { method: "POST" },
    ),
  deleteProject: (id: number) =>
    req<{ ok: boolean }>(`/server-hub/api/projects/${id}`, { method: "DELETE" }),
  // Bulk lifecycle: one action across many ships (stop/restart need confirm).
  bulkLifecycle: (ids: number[], action: "start" | "stop" | "restart", confirm = false) =>
    req<BulkLifecycleResult>("/server-hub/api/projects/bulk-lifecycle", {
      method: "POST",
      body: JSON.stringify({ ids, action, confirm }),
    }),
};

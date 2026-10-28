import { req } from "./http";
import type { SecretMeta } from "../types/projects";

export const secretsApi = {
  // secrets (metadata only; values only via reveal)
  secrets: (projectId: number) =>
    req<SecretMeta[]>(`/server-hub/api/projects/${projectId}/secrets`),
  upsertSecret: (projectId: number, name: string, value: string, environment = "production") =>
    req<{ name: string; configured: boolean }>(`/server-hub/api/projects/${projectId}/secrets`, {
      method: "POST",
      body: JSON.stringify({ name, value, environment }),
    }),
  revealSecret: (id: number) =>
    req<{ name: string; value: string }>(`/server-hub/api/secrets/${id}/reveal`, { method: "POST" }),
};

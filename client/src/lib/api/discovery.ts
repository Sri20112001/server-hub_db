import { req } from "./http";
import type { DiscoveryResult, ImportAllResult } from "../types/discovery";
import type { Project } from "../types/projects";

export const discoveryApi = {
  // shipyard discovery (auto-detect compose projects from Docker labels)
  discovery: () => req<DiscoveryResult>("/server-hub/api/discovery"),
  importDiscovered: (name: string) =>
    req<Project & { servicesAdded: number }>("/server-hub/api/discovery/import", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  // Bulk import: registers every unregistered Docker + directory find at
  // once. Idempotent — already-registered ships are skipped server-side.
  importAllDiscovered: () =>
    req<ImportAllResult>("/server-hub/api/discovery/import-all", {
      method: "POST",
    }),
};

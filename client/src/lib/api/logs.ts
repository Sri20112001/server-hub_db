import { req } from "./http";
import type { AppLog } from "../types/logs";

export const logsApi = {
  // central activity log (single place for all logs; feeds future aggregator UI)
  logs: (params?: { level?: string; source?: string; search?: string; projectId?: number; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.level) q.set("level", params.level);
    if (params?.source) q.set("source", params.source);
    if (params?.search) q.set("search", params.search);
    if (params?.projectId !== undefined) q.set("projectId", String(params.projectId));
    if (params?.limit !== undefined) q.set("limit", String(params.limit));
    if (params?.offset !== undefined) q.set("offset", String(params.offset));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return req<AppLog[]>(`/server-hub/api/logs${suffix}`);
  },
};

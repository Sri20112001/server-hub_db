import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useEvents } from "../lib/useEvents";
import { useUi } from "../stores/store";
import type { RegistryView } from "../components/ui/RegistryToolbar";

const STATUS_RANK: Record<string, number> = {
  ONLINE: 0,
  WARNING: 1,
  OFFLINE: 2,
  UNKNOWN: 3,
};

// Fleet queries, live SSE invalidation, group/status/search filters, sort,
// card/table view and the delete action for the servers page.
export function useServers(setOnline: (v: boolean) => void) {
  const qc = useQueryClient();
  const { pushToast } = useUi();
  const [showAdd, setShowAdd] = useState(false);
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [view, setView] = useState<RegistryView>("cards");

  const { data: servers = [], isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ["servers"],
    queryFn: api.servers,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (isSuccess) setOnline(true);
    if (isError) setOnline(false);
  }, [isSuccess, isError, setOnline]);

  const { data: groups = [] } = useQuery({ queryKey: ["server-groups"], queryFn: api.serverGroups });

  // Live updates via SSE
  useEvents((ev) => {
    if (ev.type === "server.heartbeat" || ev.type === "server.metrics") {
      void qc.invalidateQueries({ queryKey: ["servers"] });
    }
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = servers.filter((s) => {
      if (groupFilter && s.groupId !== groupFilter) return false;
      const status = (s.status ?? "").toUpperCase();
      if (statusFilter !== "all" && status !== statusFilter.toUpperCase()) return false;
      if (!needle) return true;
      return (
        s.name.toLowerCase().includes(needle) ||
        (s.hostname ?? "").toLowerCase().includes(needle) ||
        (s.ipAddress ?? "").toLowerCase().includes(needle) ||
        (s.os ?? "").toLowerCase().includes(needle)
      );
    });

    const heartbeat = (s: (typeof rows)[number]) =>
      s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0;

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "status":
          return (
            (STATUS_RANK[(a.status ?? "").toUpperCase()] ?? 9) -
            (STATUS_RANK[(b.status ?? "").toUpperCase()] ?? 9)
          );
        case "heartbeat-desc":
          return heartbeat(b) - heartbeat(a);
        case "heartbeat-asc":
          return heartbeat(a) - heartbeat(b);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [servers, groupFilter, statusFilter, search, sort]);

  const counts = {
    total: servers.length,
    online: servers.filter((s) => (s.status ?? "").toUpperCase() === "ONLINE").length,
    offline: servers.filter((s) => (s.status ?? "").toUpperCase() === "OFFLINE").length,
    warning: servers.filter((s) => (s.status ?? "").toUpperCase() === "WARNING").length,
  };

  const deleteServer = async (srv: { id: string | number; name: string }) => {
    try {
      await api.deleteServer(Number(srv.id));
      pushToast(`Server "${srv.name}" deleted.`);
      void qc.invalidateQueries({ queryKey: ["servers"] });
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to delete server", true);
    }
  };

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["servers"] });

  return {
    servers,
    isLoading,
    isError,
    refetch,
    groups,
    groupFilter,
    setGroupFilter,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    view,
    setView,
    filtered,
    counts,
    showAdd,
    setShowAdd,
    deleteServer,
    invalidate,
  };
}

export type ServersController = ReturnType<typeof useServers>;

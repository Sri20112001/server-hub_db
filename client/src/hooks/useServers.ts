import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useEvents } from "../lib/useEvents";
import { useUi } from "../stores/store";

// Fleet queries, live SSE invalidation, group filter, tally counts and the
// delete action for the servers page.
export function useServers(setOnline: (v: boolean) => void) {
  const qc = useQueryClient();
  const { pushToast } = useUi();
  const [showAdd, setShowAdd] = useState(false);
  const [groupFilter, setGroupFilter] = useState<number | null>(null);

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

  const filtered = groupFilter ? servers.filter((s) => s.groupId === groupFilter) : servers;

  const counts = {
    total: servers.length,
    online: servers.filter((s) => s.status === "ONLINE").length,
    offline: servers.filter((s) => s.status === "OFFLINE").length,
    warning: servers.filter((s) => s.status === "WARNING").length,
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
    filtered,
    counts,
    showAdd,
    setShowAdd,
    deleteServer,
    invalidate,
  };
}

export type ServersController = ReturnType<typeof useServers>;

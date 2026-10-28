import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useEvents } from "../../lib/useEvents";
import { useUi } from "../../stores/store";
import type { AgentCliPlatform } from "./agentCommands";

export type ServerTab = "overview" | "monitoring" | "tokens" | "audit";

// Agent-token form state shared between the header toolbar, the overview
// "Connect Agent" prompt and the tokens tab.
export interface AgentTokenForm {
  show: boolean;
  setShow: (v: boolean) => void;
  newToken: string | null;
  setNewToken: (v: string | null) => void;
  label: string;
  setLabel: (v: string) => void;
  creating: boolean;
  create: () => Promise<void>;
  platform: AgentCliPlatform;
  setPlatform: (v: AgentCliPlatform) => void;
}

// Data + actions for one managed server: queries, live-event invalidation,
// refresh/delete and the agent-token form. Tab contents live in the
// Server*Tab components; this hook owns everything they share.
export function useServerDetail(serverId: number, setOnline: (v: boolean) => void) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const pushToast = useUi((s) => s.pushToast);

  const [tab, setTab] = useState<ServerTab>("overview");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState("");
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentCliPlatform, setAgentCliPlatform] = useState<AgentCliPlatform>("flag");

  const { data: server, isLoading, isError, isSuccess, refetch: refetchServer } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => api.server(serverId),
  });

  useEffect(() => {
    if (isSuccess) setOnline(true);
    if (isError) setOnline(false);
  }, [isSuccess, isError, setOnline]);

  const { data: latest, refetch: refetchLatest } = useQuery({
    queryKey: ["server-metrics-latest", serverId],
    queryFn: () => api.serverMetricsLatest(serverId),
    refetchInterval: 30_000,
  });

  const { data: tokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ["agent-tokens", serverId],
    queryFn: () => api.agentTokens(serverId),
    enabled: tab === "tokens",
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", "TRIGGERED"],
    queryFn: () => api.alerts("TRIGGERED"),
    refetchInterval: 30_000,
  });

  const serverAlerts = alerts.filter((a) => a.serverId === serverId);

  // Live signals: heartbeat/metrics refresh this server, alert events refresh
  // the triggered-alerts cache.
  useEvents((ev) => {
    if (
      (ev.type === "server.heartbeat" || ev.type === "server.metrics") &&
      (ev.data as { serverId?: number })?.serverId === serverId
    ) {
      void qc.invalidateQueries({ queryKey: ["server", serverId] });
      void qc.invalidateQueries({ queryKey: ["server-metrics-latest", serverId] });
    }
    if (ev.type === "alert.triggered" || ev.type === "alert.resolved") {
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchServer(), refetchLatest()]);
      pushToast("Telemetry refreshed");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const openTokenForm = () => {
    setShowTokenForm(true);
    setTab("tokens");
  };

  const createToken = async () => {
    setCreatingToken(true);
    try {
      const res = await api.createAgentToken(serverId, tokenLabel);
      setNewToken(res.token);
      setTokenLabel("");
      setShowTokenForm(false);
      setTab("tokens");
      pushToast("Agent token generated");
      void refetchTokens();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to create token", true);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDelete = async () => {
    if (!server) return;
    setDeleteBusy(true);
    try {
      await api.deleteServer(serverId);
      pushToast(`Server "${server.name}" deleted`);
      nav("/servers");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to delete server", true);
      setDeleteBusy(false);
      setConfirmDelete(false);
    }
  };

  return {
    server,
    isLoading,
    latest,
    alerts: serverAlerts,
    tokens,
    refetchTokens,
    tab,
    setTab,
    isRefreshing,
    handleRefresh,
    confirmDelete,
    setConfirmDelete,
    deleteBusy,
    handleDelete,
    openTokenForm,
    tokenForm: {
      show: showTokenForm,
      setShow: setShowTokenForm,
      newToken,
      setNewToken,
      label: tokenLabel,
      setLabel: setTokenLabel,
      creating: creatingToken,
      create: createToken,
      platform: agentCliPlatform,
      setPlatform: setAgentCliPlatform,
    } satisfies AgentTokenForm,
  };
}

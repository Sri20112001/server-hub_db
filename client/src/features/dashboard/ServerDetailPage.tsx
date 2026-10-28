import { useParams, useNavigate } from "react-router";
import { Activity, ClipboardList, Key, Server } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ServerAlertsBanner } from "./ServerAlertsBanner";
import { ServerAuditTab } from "./ServerAuditTab";
import { ServerHeader } from "./ServerHeader";
import { ServerMonitoringTab } from "./ServerMonitoringTab";
import { ServerOverviewTab } from "./ServerOverviewTab";
import { ServerTokensTab } from "./ServerTokensTab";
import { useServerDetail, type ServerTab } from "./useServerDetail";

// Server detail: shell only — loading/missing states, tab bar and the delete
// confirmation. Data and actions come from useServerDetail; tab bodies are the
// Server*Tab components.
export function ServerDetailPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const serverId = Number(id);

  const d = useServerDetail(serverId, setOnline);

  const server = d.server;

  if (d.isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-28 px-4 sm:px-6 max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-paper dark:bg-panel rounded-md" />
        <div className="h-28 bg-white dark:bg-panel rounded-card border border-line dark:border-edge" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white dark:bg-panel rounded-card border border-line dark:border-edge" />
          ))}
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen pt-24 pb-28 px-4 max-w-xl mx-auto text-center">
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-8">
          <Server size={36} className="mx-auto text-muted dark:text-fog mb-3 opacity-40" />
          <h2 className="text-lg font-bold text-ink dark:text-bone mb-1">Server not found</h2>
          <p className="text-sm text-muted dark:text-fog mb-4">
            The requested server does not exist or has been removed.
          </p>
          <button
            onClick={() => nav("/servers")}
            className="px-4 py-2 bg-accent dark:bg-ember text-white dark:text-black font-semibold rounded-lg text-sm"
          >
            Back to Servers
          </button>
        </div>
      </div>
    );
  }

  const isOnline = server.status?.toUpperCase() === "ONLINE";
  const activeTokens = d.tokens.filter((t) => !t.revoked).length;

  const TABS: { key: ServerTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <Server size={14} /> },
    { key: "monitoring", label: "Monitoring", icon: <Activity size={14} /> },
    { key: "tokens", label: "Agent Tokens", icon: <Key size={14} />, badge: activeTokens },
    { key: "audit", label: "Audit Trail", icon: <ClipboardList size={14} /> },
  ];

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 sm:px-6 max-w-5xl mx-auto">
      <ServerHeader
        server={server}
        isOnline={isOnline}
        isRefreshing={d.isRefreshing}
        onRefresh={() => void d.handleRefresh()}
        onOpenTokenForm={d.openTokenForm}
        onDelete={() => d.setConfirmDelete(true)}
      />

      <ServerAlertsBanner alerts={d.alerts} />

      {/* ── Navigation Tabs ── */}
      <div className="flex gap-1.5 mb-5 border-b border-line dark:border-edge pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => d.setTab(t.key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              d.tab === t.key
                ? "bg-accent dark:bg-ember text-white dark:text-black font-semibold shadow-xs"
                : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone hover:bg-paper dark:hover:bg-panel"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            {typeof t.badge === "number" && t.badge > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  d.tab === t.key
                    ? "bg-white/20 dark:bg-black/20 text-white dark:text-black"
                    : "bg-paper dark:bg-abyss text-muted dark:text-fog"
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {d.tab === "overview" && (
        <ServerOverviewTab
          server={server}
          latest={d.latest}
          onOpenTokenForm={d.openTokenForm}
          onGoTokens={() => d.setTab("tokens")}
        />
      )}

      {d.tab === "monitoring" && <ServerMonitoringTab serverId={serverId} />}

      {d.tab === "tokens" && (
        <ServerTokensTab
          serverId={serverId}
          tokens={d.tokens}
          refetchTokens={() => void d.refetchTokens()}
          form={d.tokenForm}
        />
      )}

      {d.tab === "audit" && <ServerAuditTab serverId={serverId} />}

      {/* ── Delete Confirmation Modal ── */}
      {d.confirmDelete && (
        <ConfirmModal
          title={`Delete server "${server.name}"?`}
          body="This will permanently delete this server node and revoke all associated agent authentication tokens. This action is irreversible."
          confirmLabel={d.deleteBusy ? "Deleting…" : "Delete Server"}
          busy={d.deleteBusy}
          onClose={() => d.setConfirmDelete(false)}
          onConfirm={() => void d.handleDelete()}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Key, RefreshCw, Trash2, Activity, ClipboardList, Server } from "lucide-react";
import { api } from "../../lib/api";
import { useEvents } from "../../lib/useEvents";
import { useUi } from "../../stores/store";
import { fmtUptime } from "../../lib/format";
import { ConfirmModal, Kicker } from "../../components/ui";
import type { AgentToken, ServerMetricPoint } from "../../lib/types";

const RANGES = ["1h", "6h", "24h", "7d", "30d"] as const;
type Tab = "overview" | "monitoring" | "audit" | "tokens";

// ─── Reusable SVG sparkline chart ───────────────────────────────────────────
function MetricChart({
  title, points, value, stroke, fill, unit,
}: {
  title: string;
  points: ServerMetricPoint[];
  value: (p: ServerMetricPoint) => number;
  stroke: string;
  fill: string;
  unit: string;
}) {
  const W = 560; const H = 120;
  const vals = points.map(value);
  const hi = Math.max(...vals, 1);
  const step = points.length > 1 ? W / (points.length - 1) : 0;
  const line = vals.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(H - 10 - (Math.min(v, hi) / hi) * (H - 20));
    return `${x},${y}`;
  }).join(" ");
  const last = vals.length ? vals[vals.length - 1] : 0;
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Kicker>{title}</Kicker>
        <span className="font-mono text-[13px] text-ink dark:text-bone font-semibold">
          {last.toFixed(1)}<span className="text-muted dark:text-fog text-[11px] ml-1">{unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl" role="img" aria-label={`${title} chart`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" className="text-line dark:text-edge" strokeWidth="1" />
        ))}
        <polygon points={`0,${H} ${line} ${W},${H}`} fill={fill} opacity="0.2" />
        <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between mt-1.5 font-mono text-[10px] text-muted dark:text-fog">
        <span>{points.length ? new Date(points[0].timestamp).toLocaleTimeString() : "—"}</span>
        <span>{points.length ? new Date(points[points.length - 1].timestamp).toLocaleTimeString() : "—"}</span>
      </div>
    </div>
  );
}

// ─── Metric bar ─────────────────────────────────────────────────────────────
function MetricBar({ label, pct, value }: { label: string; pct: number; value: string }) {
  const color = pct > 85 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted dark:text-fog">{label}</span>
        <span className="text-ink dark:text-bone font-mono font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-paper dark:bg-emboss border border-line dark:border-edge rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ─── Token row ──────────────────────────────────────────────────────────────
function TokenRow({ token, serverId, onRevoked }: { token: AgentToken; serverId: number; onRevoked: () => void }) {
  const { pushToast } = useUi();
  const [busy, setBusy] = useState(false);
  const revoke = async () => {
    if (!confirm(`Revoke token "${token.label || token.id}"?`)) return;
    setBusy(true);
    try {
      await api.revokeAgentToken(serverId, token.id);
      pushToast("Token revoked");
      onRevoked();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed", true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line dark:border-edge last:border-0">
      <div>
        <div className="text-ink dark:text-bone text-sm font-medium">{token.label || `Token #${token.id}`}</div>
        <div className="text-muted dark:text-fog text-xs font-mono">
          Created {new Date(token.createdAt).toLocaleDateString()}
          {token.lastUsedAt && ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
        </div>
      </div>
      {token.revoked
        ? <span className="text-xs text-red-500 font-mono">revoked</span>
        : <button onClick={revoke} disabled={busy} className="text-muted dark:text-fog hover:text-red-500 p-1 transition-colors"><Trash2 size={14} /></button>}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export function ServerDetailPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { pushToast } = useUi();
  const serverId = Number(id);
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<string>("1h");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState("");
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data: server, isLoading, isError, isSuccess } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => api.server(serverId),
  });

  useEffect(() => {
    if (isSuccess) setOnline(true);
    if (isError) setOnline(false);
  }, [isSuccess, isError, setOnline]);

  const { data: latest } = useQuery({
    queryKey: ["server-metrics-latest", serverId],
    queryFn: () => api.serverMetricsLatest(serverId),
    refetchInterval: 30_000,
  });

  const { data: metricsHistory } = useQuery({
    queryKey: ["server-metrics", serverId, range],
    queryFn: () => api.serverMetrics(serverId, range),
    enabled: tab === "monitoring",
  });

  const { data: tokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ["agent-tokens", serverId],
    queryFn: () => api.agentTokens(serverId),
    enabled: tab === "tokens",
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-server", serverId],
    queryFn: () => api.audit(50),
    enabled: tab === "audit",
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", "TRIGGERED"],
    queryFn: () => api.alerts("TRIGGERED"),
    refetchInterval: 30_000,
  });

  const serverAlerts = alerts.filter((a) => a.serverId === serverId);

  useEvents((ev) => {
    if ((ev.type === "server.heartbeat" || ev.type === "server.metrics") &&
      (ev.data as { serverId?: number })?.serverId === serverId) {
      void qc.invalidateQueries({ queryKey: ["server", serverId] });
      void qc.invalidateQueries({ queryKey: ["server-metrics-latest", serverId] });
    }
    if (ev.type === "alert.triggered" || ev.type === "alert.resolved") {
      void qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const createToken = async () => {
    setCreatingToken(true);
    try {
      const res = await api.createAgentToken(serverId, tokenLabel);
      setNewToken(res.token);
      setTokenLabel("");
      setShowTokenForm(false);
      void refetchTokens();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed", true);
    } finally {
      setCreatingToken(false);
    }
  };

  const copyToken = () => {
    if (newToken) { void navigator.clipboard.writeText(newToken); pushToast("Token copied"); }
  };

  const handleDelete = async () => {
    if (!server) return;
    setDeleteBusy(true);
    try {
      await api.deleteServer(serverId);
      pushToast(`Server "${server.name}" deleted.`);
      nav("/servers");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to delete server", true);
      setDeleteBusy(false);
      setConfirmDelete(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen pt-20 pb-28 px-4 max-w-5xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-paper dark:bg-panel rounded w-48 border border-line dark:border-edge" />
        <div className="h-40 bg-white dark:bg-panel rounded-card border border-line dark:border-edge" />
      </div>
    </div>
  );

  if (!server) return (
    <div className="min-h-screen pt-20 pb-28 px-4 max-w-5xl mx-auto text-muted dark:text-fog">Server not found.</div>
  );

  const STATUS_COLOR: Record<string, string> = {
    ONLINE: "text-green-600 dark:text-green-400", OFFLINE: "text-red-600 dark:text-red-400", WARNING: "text-yellow-600 dark:text-yellow-400", UNKNOWN: "text-zinc-500 dark:text-zinc-400",
  };
  const STATUS_DOT: Record<string, string> = {
    ONLINE: "bg-green-500", OFFLINE: "bg-red-500", WARNING: "bg-yellow-400", UNKNOWN: "bg-zinc-500",
  };

  const points = metricsHistory?.points ?? [];

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Server size={14} /> },
    { key: "monitoring", label: "Monitoring", icon: <Activity size={14} /> },
    { key: "audit", label: "Audit", icon: <ClipboardList size={14} /> },
    { key: "tokens", label: "Tokens", icon: <Key size={14} /> },
  ];

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => nav("/servers")} className="flex items-center gap-1.5 text-muted dark:text-fog hover:text-ink dark:hover:text-bone text-sm mb-4 transition-colors">
        <ArrowLeft size={15} /> Servers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[server.status] ?? "bg-zinc-500"}`} />
            <h1 className="text-ink dark:text-bone font-bold text-xl">{server.name}</h1>
            <span className={`text-sm font-mono font-medium ${STATUS_COLOR[server.status] ?? "text-zinc-400"}`}>{server.status}</span>
          </div>
          <div className="flex items-center gap-2 text-muted dark:text-fog text-sm flex-wrap font-mono">
            {server.hostname && <span>{server.hostname}</span>}
            {server.ipAddress && <span>· {server.ipAddress}</span>}
            {server.os && <span>· {server.os} {server.osVersion}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void qc.invalidateQueries({ queryKey: ["server", serverId] })}
            className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone transition-colors"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-full bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-red-500 hover:border-red-500/40 transition-colors"
            title="Delete server"
            aria-label="Delete server"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Active alerts banner */}
      {serverAlerts.length > 0 && (
        <div className="mb-5 space-y-2">
          {serverAlerts.map((a) => (
            <div key={a.id} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${
              a.severity === "CRITICAL"
                ? "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300"
                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300"
            }`}>
              <span>{a.message}</span>
              <button
                onClick={async () => { await api.resolveAlert(a.id); void qc.invalidateQueries({ queryKey: ["alerts"] }); }}
                className="text-xs font-semibold underline opacity-80 hover:opacity-100 ml-4"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-paper dark:bg-panel border border-line dark:border-edge rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              tab === t.key
                ? "bg-accent dark:bg-ember text-white dark:text-black font-semibold shadow-sm"
                : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* System info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "OS", value: server.os ? `${server.os} ${server.osVersion}` : "—" },
              { label: "Arch", value: server.arch || "—" },
              { label: "CPU", value: server.cpuCores > 0 ? `${server.cpuCores} cores` : "—" },
              { label: "RAM", value: server.ramTotal > 0 ? `${Math.round(server.ramTotal / 1024 / 1024 / 1024)}GB` : "—" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-3.5">
                <div className="text-muted dark:text-fog text-[10px] uppercase tracking-wider">{item.label}</div>
                <div className="text-ink dark:text-bone font-mono text-sm mt-0.5 truncate font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Live metrics */}
          {latest ? (
            <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-ink dark:text-bone font-semibold text-sm">Live Metrics</h2>
                <span className="text-muted dark:text-fog text-xs font-mono">{new Date(latest.timestamp).toLocaleTimeString()}</span>
              </div>
              <MetricBar label="CPU" pct={latest.cpuUsage} value={`${latest.cpuUsage.toFixed(1)}%`} />
              <MetricBar label="Memory" pct={latest.memoryUsage} value={`${latest.memoryUsage.toFixed(1)}% · ${latest.memoryUsedMB.toFixed(0)}MB`} />
              <MetricBar label="Disk" pct={latest.diskUsage} value={`${latest.diskUsage.toFixed(1)}% · ${latest.diskUsedGB.toFixed(1)}GB`} />
              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                {[
                  { label: "Load Avg", value: latest.loadAvg1.toFixed(2) },
                  { label: "Uptime", value: fmtUptime(latest.uptimeSec) },
                  { label: "Agent", value: server.agentStatus },
                ].map((s) => (
                  <div key={s.label} className="bg-paper dark:bg-emboss border border-line dark:border-edge rounded-lg p-2.5">
                    <div className="text-muted dark:text-fog text-[10px]">{s.label}</div>
                    <div className="text-ink dark:text-bone font-mono font-medium mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-8 text-center text-muted dark:text-fog text-sm">
              No metrics yet. Install and start the agent on this node to begin monitoring.
            </div>
          )}

          {/* Last heartbeat & meta */}
          <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 text-sm divide-y divide-line dark:divide-edge">
            <div className="flex justify-between py-2">
              <span className="text-muted dark:text-fog">Last heartbeat</span>
              <span className="text-ink dark:text-bone font-mono">
                {server.lastHeartbeat ? new Date(server.lastHeartbeat).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted dark:text-fog">Agent status</span>
              <span className={`font-mono font-semibold ${server.agentStatus === "CONNECTED" ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                {server.agentStatus}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted dark:text-fog">Registered</span>
              <span className="text-ink dark:text-bone font-mono">{new Date(server.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Monitoring tab ── */}
      {tab === "monitoring" && (
        <div className="space-y-4">
          <div className="flex gap-1.5 mb-2">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                  range === r
                    ? "bg-accent dark:bg-ember text-white dark:text-black font-semibold"
                    : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone bg-white dark:bg-panel border border-line dark:border-edge"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {points.length === 0 ? (
            <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-8 text-center text-muted dark:text-fog text-sm">
              No metrics collected for this range. The agent must be running to record data.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricChart title="CPU Usage" points={points} value={(p) => p.cpuUsage} stroke="#EA580C" fill="#EA580C" unit="%" />
              <MetricChart title="Memory Usage" points={points} value={(p) => p.memoryUsage} stroke="#16A34A" fill="#16A34A" unit="%" />
              <MetricChart title="Disk Usage" points={points} value={(p) => p.diskUsage} stroke="#D97706" fill="#D97706" unit="%" />
              <MetricChart title="Load Average" points={points} value={(p) => p.loadAvg1} stroke="#7C3AED" fill="#7C3AED" unit="" />
            </div>
          )}
        </div>
      )}

      {/* ── Audit tab ── */}
      {tab === "audit" && (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-paper dark:bg-emboss border-b border-line dark:border-edge">
                <th className="text-left text-muted dark:text-fog text-xs px-4 py-2.5 font-semibold uppercase tracking-wider">Time</th>
                <th className="text-left text-muted dark:text-fog text-xs px-4 py-2.5 font-semibold uppercase tracking-wider">Actor</th>
                <th className="text-left text-muted dark:text-fog text-xs px-4 py-2.5 font-semibold uppercase tracking-wider">Action</th>
                <th className="text-left text-muted dark:text-fog text-xs px-4 py-2.5 font-semibold uppercase tracking-wider hidden sm:table-cell">Result</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted dark:text-fog text-sm">No audit records.</td></tr>
              ) : auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-line dark:border-edge hover:bg-paper dark:hover:bg-emboss/50">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted dark:text-fog whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink dark:text-bone">{log.actor}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink dark:text-bone">{log.action} {log.resource}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs hidden sm:table-cell ${log.result === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {log.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tokens tab ── */}
      {tab === "tokens" && (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-muted dark:text-fog" />
              <h2 className="text-ink dark:text-bone font-semibold text-sm">Agent Tokens</h2>
            </div>
            <button onClick={() => setShowTokenForm(!showTokenForm)} className="text-xs font-semibold text-accent dark:text-ember hover:underline">
              + Generate Token
            </button>
          </div>

          {showTokenForm && (
            <div className="mb-4 flex gap-2">
              <input
                className="flex-1 bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember"
                placeholder="Token label (e.g. prod-primary)"
                value={tokenLabel}
                onChange={(e) => setTokenLabel(e.target.value)}
              />
              <button
                onClick={createToken}
                disabled={creatingToken}
                className="px-4 py-2 bg-accent dark:bg-ember text-white dark:text-black text-sm font-semibold rounded-input disabled:opacity-50 hover:bg-accent-hover dark:hover:bg-ember-hover"
              >
                {creatingToken ? "…" : "Create"}
              </button>
            </div>
          )}

          {newToken && (
            <div className="mb-4 p-4 bg-paper dark:bg-emboss rounded-xl border border-yellow-500/40">
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mb-2 font-semibold">Copy this token now — it will not be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="text-ink dark:text-bone text-xs font-mono flex-1 break-all bg-white dark:bg-panel p-2 rounded border border-line dark:border-edge">{newToken}</code>
                <button onClick={copyToken} className="text-muted dark:text-fog hover:text-ink dark:hover:text-bone shrink-0 p-1.5"><Copy size={16} /></button>
              </div>
              <button onClick={() => setNewToken(null)} className="text-xs text-muted dark:text-fog hover:text-ink dark:hover:text-bone mt-2 underline">Dismiss</button>
            </div>
          )}

          {tokens.length === 0
            ? <p className="text-muted dark:text-fog text-xs py-4">No tokens yet. Generate one to connect an agent.</p>
            : tokens.map((t) => <TokenRow key={t.id} token={t} serverId={serverId} onRevoked={() => void refetchTokens()} />)}

          <div className="mt-5 p-3.5 bg-paper dark:bg-emboss border border-line dark:border-edge rounded-xl text-xs text-muted dark:text-fog font-mono">
            <p className="mb-1 text-ink dark:text-bone font-semibold">Agent install & run:</p>
            <p>cd agent && go build -o serverhub-agent .</p>
            <p className="mt-1">AGENT_TOKEN=&lt;token&gt; SERVERHUB_URL=http://&lt;host&gt;:4000 ./serverhub-agent</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete server "${server.name}"?`}
          body="This will permanently remove the managed server and revoke all associated agent tokens. This cannot be undone."
          confirmLabel={deleteBusy ? "Deleting…" : "Delete server"}
          busy={deleteBusy}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

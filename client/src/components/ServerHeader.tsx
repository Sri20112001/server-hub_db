import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Copy, Globe, Key, Radio, RefreshCw, Server, Trash2 } from "lucide-react";
import { copyToClipboard } from "../lib/clipboard";
import { OsIcon } from "./ui/OsIcon";
import type { ManagedServer } from "../lib/types/servers";

// Breadcrumb + server identity card: status pill, agent pill, copyable
// hostname/IP chips, OS chip, and the action toolbar (token / refresh /
// delete).
export function ServerHeader({
  server,
  isOnline,
  isRefreshing,
  onRefresh,
  onOpenTokenForm,
  onDelete,
}: {
  server: ManagedServer;
  isOnline: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenTokenForm: () => void;
  onDelete: () => void;
}) {
  const nav = useNavigate();
  const isWarning = server.status?.toUpperCase() === "WARNING";

  return (
    <>
      {/* ── Breadcrumb & Back ── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted dark:text-fog mb-3">
        <button
          onClick={() => nav("/servers")}
          className="flex items-center gap-1 hover:text-ink dark:hover:text-bone transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Servers</span>
        </button>
        <ChevronRight size={11} className="opacity-40" />
        <span className="text-ink dark:text-bone font-medium truncate">{server.name}</span>
      </nav>

      {/* ── Main Server Header ── */}
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mb-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            {/* Status Indicator & Name */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="relative flex h-3 w-3 shrink-0">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isOnline
                      ? "bg-emerald-500"
                      : isWarning
                      ? "bg-amber-500"
                      : "bg-zinc-400 dark:bg-zinc-600"
                  }`}
                />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-bone truncate">
                {server.name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                  isOnline
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : isWarning
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/30"
                }`}
              >
                {server.status}
              </span>

              {/* Agent Connectivity Pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-paper dark:bg-abyss border border-line dark:border-edge text-muted dark:text-fog">
                <Radio
                  size={11}
                  className={
                    server.agentStatus === "CONNECTED"
                      ? "text-emerald-500"
                      : "text-zinc-400"
                  }
                />
                <span>
                  {server.agentStatus === "CONNECTED" ? "Agent Connected" : "Agent Disconnected"}
                </span>
              </span>
            </div>

            {/* Quick Spec Chips & Copyable Network Info */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-muted dark:text-fog pt-1">
              {server.hostname && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(server.hostname!, "Hostname")}
                  title="Click to copy hostname"
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60 text-ink/80 dark:text-bone/80 hover:border-accent/60 dark:hover:border-ember/60 transition-colors group cursor-pointer"
                >
                  <Server size={11} className="text-muted dark:text-fog" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{server.hostname}</span>
                  <Copy size={10} className="opacity-40 group-hover:opacity-100" />
                </button>
              )}

              {server.ipAddress && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(server.ipAddress!, "IP Address")}
                  title="Click to copy IP"
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60 text-ink/80 dark:text-bone/80 hover:border-accent/60 dark:hover:border-ember/60 transition-colors group cursor-pointer"
                >
                  <Globe size={11} className="text-muted dark:text-fog" />
                  <span>{server.ipAddress}</span>
                  <Copy size={10} className="opacity-40 group-hover:opacity-100" />
                </button>
              )}

              {server.os && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60 text-ink/80 dark:text-bone/80">
                  <OsIcon os={server.os} size={12} className="shrink-0" />
                  <span>
                    {server.os} {server.osVersion}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={onOpenTokenForm}
              className="flex items-center gap-1.5 px-3 py-2 bg-paper dark:bg-abyss border border-line dark:border-edge hover:border-accent/60 dark:hover:border-ember/60 text-ink dark:text-bone text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Key size={13} className="text-accent dark:text-ember" />
              <span>Token</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone hover:border-accent/60 dark:hover:border-ember/60 transition-colors cursor-pointer"
              title="Refresh telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            <button
              onClick={onDelete}
              className="w-9 h-9 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
              title="Delete server"
              aria-label="Delete server"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

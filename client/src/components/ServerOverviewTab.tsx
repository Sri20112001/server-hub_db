import { Clock, Copy, Cpu, Globe, HardDrive, Layers, Server, Shield, Terminal, Zap } from "lucide-react";
import { API_BASE } from "../lib/api";
import { copyToClipboard } from "../lib/clipboard";
import { fmtUptime, timeAgo } from "../lib/format";
import { OsIcon } from "./ui/OsIcon";
import { VitalCard } from "./VitalCard";
import type { ManagedServer, ServerMetricPoint } from "../lib/types/servers";

// Overview tab: live vitals grid (or agent setup prompt), the hardware /
// environment spec matrix, node properties and the agent launcher card.
export function ServerOverviewTab({
  server,
  latest,
  onOpenTokenForm,
  onGoTokens,
}: {
  server: ManagedServer;
  latest: ServerMetricPoint | undefined;
  onOpenTokenForm: () => void;
  onGoTokens: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Live Telemetry Vitals Grid */}
      {latest ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <VitalCard
            icon={<Cpu size={15} />}
            label="CPU Usage"
            value={`${latest.cpuUsage.toFixed(1)}%`}
            percentage={latest.cpuUsage}
            subtext={`${server.cpuCores > 0 ? `${server.cpuCores} cores` : "—"} · Load ${latest.loadAvg1.toFixed(2)}`}
          />
          <VitalCard
            icon={<Layers size={15} />}
            label="Memory"
            value={`${latest.memoryUsage.toFixed(1)}%`}
            percentage={latest.memoryUsage}
            subtext={`${(latest.memoryUsedMB / 1024).toFixed(1)} GB of ${
              server.ramTotal > 0 ? (server.ramTotal / 1024 / 1024 / 1024).toFixed(1) : "—"
            } GB`}
          />
          <VitalCard
            icon={<HardDrive size={15} />}
            label="Disk"
            value={`${latest.diskUsage.toFixed(1)}%`}
            percentage={latest.diskUsage}
            subtext={`${latest.diskUsedGB.toFixed(1)} GB of ${
              server.diskTotal > 0 ? (server.diskTotal / 1024 / 1024 / 1024).toFixed(1) : "—"
            } GB`}
          />
          <VitalCard
            icon={<Zap size={15} />}
            label="Uptime & I/O"
            value={fmtUptime(latest.uptimeSec)}
            subtext={`Net: ${(latest.netRx / 1024 / 1024).toFixed(1)}MB Rx · ${(latest.netTx / 1024 / 1024).toFixed(1)}MB Tx`}
          />
        </div>
      ) : (
        /* Setup Prompt if No Telemetry Yet */
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-ink dark:text-bone">
              Waiting for Agent Telemetry
            </h3>
            <p className="text-xs text-muted dark:text-fog max-w-lg">
              Install and start the ServerHub agent on this machine with a valid token to enable live
              CPU, memory, disk, and network monitoring.
            </p>
          </div>
          <button
            onClick={onOpenTokenForm}
            className="px-4 py-2 bg-accent dark:bg-ember text-white dark:text-black font-semibold text-xs rounded-lg shadow-xs hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors shrink-0 cursor-pointer"
          >
            + Connect Agent
          </button>
        </div>
      )}

      {/* Detailed System Specifications Matrix */}
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 dark:bg-ember/10 text-accent dark:text-ember">
              <Shield size={15} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink dark:text-bone">
                Hardware & Environment Specifications
              </h2>
              <p className="text-xs text-muted dark:text-fog">
                System topology, hardware configuration, and host environment
              </p>
            </div>
          </div>

          {server.lastHeartbeat && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-paper dark:bg-abyss border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
              <Clock size={11} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Heartbeat: {timeAgo(server.lastHeartbeat)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Card 1: Operating System & Kernel */}
          <div className="bg-paper/50 dark:bg-abyss/40 border border-line/60 dark:border-edge/60 rounded-xl p-4 flex items-start gap-3.5">
            <span className="p-2.5 rounded-lg bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-ink dark:text-bone shrink-0 mt-0.5">
              <OsIcon os={server.os} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-muted dark:text-fog block mb-0.5">
                Operating System
              </span>
              <div className="text-xs font-semibold text-ink dark:text-bone font-mono leading-relaxed break-words">
                {server.os ? `${server.os} ${server.osVersion || ""}` : "Not reported"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
                  Arch: {server.arch || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Processor / CPU */}
          <div className="bg-paper/50 dark:bg-abyss/40 border border-line/60 dark:border-edge/60 rounded-xl p-4 flex items-start gap-3.5">
            <span className="p-2.5 rounded-lg bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-ink dark:text-bone shrink-0 mt-0.5">
              <Cpu size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-muted dark:text-fog block mb-0.5">
                Processor (CPU)
              </span>
              <div className="text-xs font-semibold text-ink dark:text-bone font-mono leading-relaxed break-words">
                {server.cpuInfo ? server.cpuInfo.replace(/\(R\)|\(TM\)/gi, "").trim() : "Standard Processor"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
                  {server.cpuCores > 0 ? `${server.cpuCores} Logical Cores` : "Cores not reported"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Memory (RAM) */}
          <div className="bg-paper/50 dark:bg-abyss/40 border border-line/60 dark:border-edge/60 rounded-xl p-4 flex items-start gap-3.5">
            <span className="p-2.5 rounded-lg bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-ink dark:text-bone shrink-0 mt-0.5">
              <Layers size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-muted dark:text-fog block mb-0.5">
                Physical Memory (RAM)
              </span>
              <div className="text-xs font-semibold text-ink dark:text-bone font-mono leading-relaxed">
                {server.ramTotal > 0
                  ? `${(server.ramTotal / 1024 / 1024 / 1024).toFixed(2)} GB Total`
                  : "Not reported"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
                  {server.ramTotal > 0 ? `${server.ramTotal.toLocaleString()} bytes` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Primary Storage */}
          <div className="bg-paper/50 dark:bg-abyss/40 border border-line/60 dark:border-edge/60 rounded-xl p-4 flex items-start gap-3.5">
            <span className="p-2.5 rounded-lg bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-ink dark:text-bone shrink-0 mt-0.5">
              <HardDrive size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-muted dark:text-fog block mb-0.5">
                Primary Storage Capacity
              </span>
              <div className="text-xs font-semibold text-ink dark:text-bone font-mono leading-relaxed">
                {server.diskTotal > 0
                  ? `${(server.diskTotal / 1024 / 1024 / 1024).toFixed(1)} GB Total Storage`
                  : "Not reported"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
                  Local Drive Volume
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Hostname & Host Identity */}
          <div className="bg-paper/50 dark:bg-abyss/40 border border-line/60 dark:border-edge/60 rounded-xl p-4 flex items-start gap-3.5">
            <span className="p-2.5 rounded-lg bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-ink dark:text-bone shrink-0 mt-0.5">
              <Server size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-muted dark:text-fog">
                  Hostname
                </span>
                {server.hostname && (
                  <button
                    onClick={() => copyToClipboard(server.hostname!, "Hostname")}
                    className="text-muted dark:text-fog hover:text-ink dark:hover:text-bone p-0.5 cursor-pointer"
                    title="Copy Hostname"
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>
              <div className="text-xs font-semibold text-ink dark:text-bone font-mono leading-relaxed break-all mt-0.5">
                {server.hostname || "Not assigned"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
                  Server ID: #{server.id}
                </span>
              </div>
            </div>
          </div>

          {/* Card 6: Network IP Address */}
          <div className="bg-paper/50 dark:bg-abyss/40 border border-line/60 dark:border-edge/60 rounded-xl p-4 flex items-start gap-3.5">
            <span className="p-2.5 rounded-lg bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-ink dark:text-bone shrink-0 mt-0.5">
              <Globe size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-muted dark:text-fog">
                  IP Address
                </span>
                {server.ipAddress && (
                  <button
                    onClick={() => copyToClipboard(server.ipAddress!, "IP Address")}
                    className="text-muted dark:text-fog hover:text-ink dark:hover:text-bone p-0.5 cursor-pointer"
                    title="Copy IP Address"
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>
              <div className="text-xs font-semibold text-ink dark:text-bone font-mono leading-relaxed break-all mt-0.5">
                {server.ipAddress || "Not assigned"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white dark:bg-panel border border-line/60 dark:border-edge/60 text-muted dark:text-fog">
                  IPv4 / Network
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic & Quick Commands Tray */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Server Meta Summary */}
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4.5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-ink dark:text-bone">
            Node Properties
          </span>
          <div className="space-y-2 text-xs font-mono divide-y divide-line/40 dark:divide-edge/40">
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted dark:text-fog">Server ID</span>
              <span className="text-ink dark:text-bone font-bold">#{server.id}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted dark:text-fog">Registered Date</span>
              <span className="text-ink dark:text-bone">
                {new Date(server.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted dark:text-fog">Agent Connection</span>
              <span
                className={`font-semibold ${
                  server.agentStatus === "CONNECTED"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500"
                }`}
              >
                {server.agentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted dark:text-fog">Assigned Group</span>
              <span className="text-ink dark:text-bone">
                {server.groupId ? `Group #${server.groupId}` : "Default"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Agent Launcher Info */}
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4.5 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-ink dark:text-bone flex items-center gap-1.5">
                <Terminal size={13} className="text-accent dark:text-ember" />
                <span>Agent Telemetry Daemon</span>
              </span>
              <button
                onClick={onGoTokens}
                className="text-[11px] font-semibold text-accent dark:text-ember hover:underline cursor-pointer"
              >
                Manage Tokens →
              </button>
            </div>
            <p className="text-xs text-muted dark:text-fog leading-relaxed">
              The agent runs locally on your host as a lightweight daemon, sending CPU, memory, and disk
              heartbeats every 30 seconds.
            </p>
          </div>

          <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-lg p-2.5 font-mono text-[11px] text-ink dark:text-bone flex items-center justify-between gap-2">
            <span className="truncate">./serverhub-agent -url={API_BASE}</span>
            <button
              onClick={() => copyToClipboard(`./serverhub-agent -url=${API_BASE}`, "Command")}
              className="p-1 text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
              title="Copy command"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

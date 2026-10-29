import { useState } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { OsIcon } from "./ui/OsIcon";

const STATUS_COLOR: Record<string, string> = {
  online: "bg-emerald-500",
  warning: "bg-amber-500",
  offline: "bg-zinc-500",
  ONLINE: "bg-emerald-500",
  WARNING: "bg-amber-500",
  OFFLINE: "bg-zinc-500",
};

const STATUS_TEXT: Record<string, string> = {
  online: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  offline: "text-zinc-500 dark:text-zinc-400",
  ONLINE: "text-emerald-600 dark:text-emerald-400",
  WARNING: "text-amber-600 dark:text-amber-400",
  OFFLINE: "text-zinc-500 dark:text-zinc-400",
};

export interface ManagedServer {
  id: string | number;
  name: string;
  status: "online" | "offline" | "warning" | "ONLINE" | "OFFLINE" | "WARNING" | string;
  hostname?: string;
  ipAddress?: string;
  os?: string;
  osVersion?: string;
  cpuCores: number;
  cpuUsagePct?: number; // e.g. 0 - 100
  ramTotal: number;
  ramUsed?: number;     // in bytes, or provide ramUsagePct directly
  ramUsagePct?: number; // e.g. 0 - 100
  diskTotal?: number;
  diskUsagePct?: number;
  agentStatus: string;
  lastHeartbeat?: string | number | Date | null;
  groupId?: number | null;
}

export interface ServerCardProps {
  s: ManagedServer;
  onClick: () => void;
  onDelete: (s: ManagedServer) => Promise<void> | void;
}

// One server in the fleet grid: status pip + badge, hostname/IP/OS, CPU/RAM/
// disk tiles with usage bars, and the agent heartbeat footer.
export function ServerCard({ s, onClick, onDelete }: ServerCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute RAM usage percentage if not explicitly provided
  const computedRamPct =
    s.ramUsagePct !== undefined
      ? s.ramUsagePct
      : s.ramTotal > 0 && s.ramUsed !== undefined
      ? Math.round((s.ramUsed / s.ramTotal) * 100)
      : undefined;

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDelete(s);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      aria-label={`Server ${s.name}, status: ${s.status}`}
      className="group relative w-full text-left bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4.5 
                 hover:border-accent/60 dark:hover:border-ember/60 hover:shadow-md 
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-ember focus-visible:ring-offset-2 dark:focus-visible:ring-offset-abyss
                 transition-all duration-150 cursor-pointer select-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {(s.status === "online" || s.status === "ONLINE") && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                STATUS_COLOR[s.status] ?? "bg-zinc-500"
              }`}
            />
          </span>
          <span className="font-semibold text-ink dark:text-bone text-sm truncate tracking-tight">
            {s.name}
          </span>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide border border-line/60 dark:border-edge/60 bg-paper/60 dark:bg-abyss/60 ${
              STATUS_TEXT[s.status] ?? "text-zinc-500"
            }`}
          >
            {s.status}
          </span>

          {/* Delete Action / Inline Confirmation */}
          <div className="relative">
            {isConfirmingDelete ? (
              <div
                className="flex items-center gap-1 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-lg p-0.5 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  title="Confirm delete"
                  aria-label="Confirm delete"
                  className="p-1 rounded text-red-600 hover:bg-red-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  title="Cancel delete"
                  aria-label="Cancel delete"
                  className="p-1 rounded text-muted dark:text-fog hover:bg-paper dark:hover:bg-emboss focus:outline-none focus-visible:ring-1 focus-visible:ring-line transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(true);
                }}
                title="Delete server"
                aria-label={`Delete ${s.name}`}
                className="p-1.5 rounded-md text-muted dark:text-fog opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all duration-150"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Network & OS Specs */}
      <div className="text-xs text-muted dark:text-fog font-mono space-y-0.5 leading-relaxed">
        {s.hostname && <div className="truncate">{s.hostname}</div>}
        {s.ipAddress && <div className="truncate">{s.ipAddress}</div>}
        {s.os && (
          <div className="flex items-center gap-1.5 text-ink/70 dark:text-bone/70 min-w-0">
            <OsIcon os={s.os} size={12} className="shrink-0" />
            <span className="truncate">{s.os} {s.osVersion}</span>
          </div>
        )}
      </div>

      {/* Hardware / Agent Stats with Progress Bars */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <StatCard
          label="CPU"
          value={s.cpuCores > 0 ? `${s.cpuCores} cores` : "—"}
          percentage={s.cpuUsagePct}
        />
        <StatCard
          label="RAM"
          value={s.ramTotal > 0 ? `${Math.round(s.ramTotal / 1024 / 1024 / 1024)} GB` : "—"}
          percentage={computedRamPct}
        />
        <StatCard
          label="Disk"
          value={s.diskTotal && s.diskTotal > 0 ? `${Math.round(s.diskTotal / 1024 / 1024 / 1024)} GB` : "—"}
          percentage={s.diskUsagePct}
        />
      </div>

      {/* Footer / Last Seen & Agent */}
      <div className="mt-3 pt-2.5 border-t border-line/40 dark:border-edge/40 flex items-center justify-between text-[11px] text-muted dark:text-fog font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              s.agentStatus === "CONNECTED" ? "bg-emerald-500" : "bg-zinc-400"
            }`}
          />
          <span className="truncate">
            Agent {s.agentStatus === "CONNECTED" ? "Active" : s.agentStatus.toLowerCase()}
          </span>
        </div>
        {s.lastHeartbeat ? (
          <time dateTime={new Date(s.lastHeartbeat).toISOString()} className="shrink-0 ml-2">
            {new Date(s.lastHeartbeat).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </time>
        ) : (
          <span className="shrink-0 ml-2">No heartbeat</span>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  percentage?: number;
}

// Small label/value tile with an optional clamped usage bar (90%/75%
// thresholds drive the bar color).
function StatCard({ label, value, percentage }: StatCardProps) {
  const hasPercentage = typeof percentage === "number" && !isNaN(percentage);
  const clampedPct = hasPercentage ? Math.min(Math.max(percentage, 0), 100) : 0;

  // Adaptive threshold color coding
  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 75) return "bg-amber-500";
    return "bg-accent dark:bg-ember";
  };

  return (
    <div className="flex flex-col justify-between rounded-md bg-paper/50 dark:bg-abyss/40 border border-line/50 dark:border-edge/50 p-2">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] uppercase tracking-wider font-mono text-muted dark:text-fog">
          {label}
        </span>
        {hasPercentage && (
          <span className="text-[10px] font-mono font-medium text-ink/80 dark:text-bone/80">
            {clampedPct}%
          </span>
        )}
      </div>

      <span className="text-xs font-medium font-mono text-ink dark:text-bone truncate">
        {value}
      </span>

      {/* Progress Track */}
      {hasPercentage && (
        <div className="mt-1.5 w-full h-1 bg-line/60 dark:bg-edge/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(clampedPct)}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

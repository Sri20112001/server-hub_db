import { useState } from "react";
import { Check, Clock, Loader2, Trash2, X } from "lucide-react";
import { OsIcon } from "./ui/OsIcon";
import type { ManagedServer } from "../lib/types/servers";

const STATUS_COLOR: Record<string, string> = {
  online: "bg-emerald-500",
  warning: "bg-amber-500",
  offline: "bg-zinc-500",
  ONLINE: "bg-emerald-500",
  WARNING: "bg-amber-500",
  OFFLINE: "bg-zinc-500",
  UNKNOWN: "bg-zinc-500",
};

const STATUS_TEXT: Record<string, string> = {
  online: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  offline: "text-zinc-500 dark:text-zinc-400",
  ONLINE: "text-emerald-600 dark:text-emerald-400",
  WARNING: "text-amber-600 dark:text-amber-400",
  OFFLINE: "text-zinc-500 dark:text-zinc-400",
  UNKNOWN: "text-zinc-500 dark:text-zinc-400",
};

export interface ServerCardProps {
  s: ManagedServer;
  onClick: () => void;
  onDelete: (s: ManagedServer) => Promise<void> | void;
}

// One server in the registry grid: identity, reachability and agent health
// only — live CPU/RAM/disk readings live on the server detail page so the
// registry stays scannable.
export function ServerCard({ s, onClick, onDelete }: ServerCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
                 hover:border-accent/60 dark:hover:border-ember/60 hover:shadow-md hover:-translate-y-0.5
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-ember focus-visible:ring-offset-2 dark:focus-visible:ring-offset-abyss
                 transition-all duration-150 cursor-pointer select-none"
    >
      {/* Header: identity + status + delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {(s.status === "ONLINE") && (
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

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide border border-line/60 dark:border-edge/60 bg-paper/60 dark:bg-abyss/60 ${
              STATUS_TEXT[s.status] ?? "text-zinc-500"
            }`}
          >
            {(s.status ?? "unknown").toUpperCase()}
          </span>

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
                  className="p-1 rounded text-red-600 hover:bg-red-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors cursor-pointer"
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  title="Cancel delete"
                  aria-label="Cancel delete"
                  className="p-1 rounded text-muted dark:text-fog hover:bg-paper dark:hover:bg-emboss focus:outline-none focus-visible:ring-1 focus-visible:ring-line transition-colors cursor-pointer"
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
                className="p-1.5 rounded-md text-muted dark:text-fog opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-all duration-150 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Network + OS */}
      <div className="mt-3 text-xs text-muted dark:text-fog font-mono space-y-1 leading-relaxed">
        {s.hostname && <div className="truncate">{s.hostname}</div>}
        {s.ipAddress && <div className="truncate">{s.ipAddress}</div>}
        <div className="flex items-center gap-1.5 text-ink/70 dark:text-bone/70 min-w-0">
          <OsIcon os={s.os} size={12} className="shrink-0" />
          <span className="truncate">
            {s.os || "Unknown OS"}
            {s.osVersion ? ` ${s.osVersion}` : ""}
            {s.arch ? ` · ${s.arch}` : ""}
          </span>
        </div>
      </div>

      {/* Agent + heartbeat */}
      <div className="mt-3 pt-2.5 border-t border-line/40 dark:border-edge/40 flex items-center justify-between gap-2 text-[11px] text-muted dark:text-fog font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              s.agentStatus === "CONNECTED" ? "bg-emerald-500" : "bg-zinc-400"
            }`}
          />
          <span className="truncate">
            Agent {s.agentStatus === "CONNECTED" ? "active" : (s.agentStatus ?? "unknown").toLowerCase()}
          </span>
        </div>
        {s.lastHeartbeat ? (
          <time
            dateTime={new Date(s.lastHeartbeat).toISOString()}
            className="shrink-0 ml-2 inline-flex items-center gap-1"
          >
            <Clock size={10} />
            {new Date(s.lastHeartbeat).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        ) : (
          <span className="shrink-0 ml-2">No heartbeat</span>
        )}
      </div>
    </div>
  );
}

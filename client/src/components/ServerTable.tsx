import { useState } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { OsIcon } from "./ui/OsIcon";
import { Kicker } from "./ui/Kicker";
import type { ManagedServer } from "../lib/types/servers";

const STATUS_TONE: Record<string, string> = {
  ONLINE: "text-emerald-600 dark:text-emerald-400",
  WARNING: "text-amber-600 dark:text-amber-400",
  OFFLINE: "text-zinc-500 dark:text-zinc-400",
  UNKNOWN: "text-zinc-500 dark:text-zinc-400",
};

// Table mode for the servers registry: one scannable row per host, no live
// metrics. The whole row opens the server detail page.
export function ServerTable({
  servers,
  onOpen,
  onDelete,
}: {
  servers: ManagedServer[];
  onOpen: (s: ManagedServer) => void;
  onDelete: (s: ManagedServer) => Promise<void> | void;
}) {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr>
              {["Server", "Status", "OS / Arch", "Agent", "Last heartbeat", ""].map(
                (h, i) => (
                  <th
                    key={h || i}
                    className={`text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss ${
                      i === 5 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr
                key={s.id}
                onClick={() => onOpen(s)}
                className="cursor-pointer group hover:bg-paper dark:hover:bg-emboss transition-colors"
              >
                <td className="px-4 py-3 border-t border-line dark:border-edge align-middle">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        s.status === "ONLINE"
                          ? "bg-emerald-500"
                          : s.status === "WARNING"
                            ? "bg-amber-500"
                            : "bg-zinc-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink dark:text-bone truncate">
                        {s.name}
                      </div>
                      <div className="font-mono text-[11px] text-muted dark:text-fog truncate">
                        {s.hostname || s.ipAddress || `#${s.id}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 border-t border-line dark:border-edge align-middle">
                  <span
                    className={`font-mono text-[11px] font-semibold ${
                      STATUS_TONE[s.status] ?? "text-zinc-500"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 border-t border-line dark:border-edge align-middle">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink/80 dark:text-bone/80">
                    <OsIcon os={s.os} size={12} className="shrink-0" />
                    <span className="truncate">
                      {s.os || "—"}
                      {s.arch ? ` · ${s.arch}` : ""}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 border-t border-line dark:border-edge align-middle">
                  <span className="font-mono text-[11px] text-muted dark:text-fog">
                    {s.agentStatus === "CONNECTED" ? "connected" : (s.agentStatus ?? "unknown").toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3 border-t border-line dark:border-edge align-middle font-mono text-[11px] text-muted dark:text-fog">
                  {s.lastHeartbeat
                    ? new Date(s.lastHeartbeat).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 border-t border-line dark:border-edge align-middle text-right">
                  <RowDelete s={s} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-line dark:border-edge">
        <Kicker>
          {servers.length} server{servers.length === 1 ? "" : "s"} shown
        </Kicker>
      </div>
    </div>
  );
}

function RowDelete({
  s,
  onDelete,
}: {
  s: ManagedServer;
  onDelete: (s: ManagedServer) => Promise<void> | void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        title="Delete server"
        aria-label={`Delete ${s.name}`}
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        className="p-1.5 rounded-md text-muted dark:text-fog opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
      >
        <Trash2 size={13} />
      </button>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 bg-paper dark:bg-abyss border border-line dark:border-edge rounded-lg p-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={busy}
        aria-label="Confirm delete"
        title="Confirm delete"
        onClick={async () => {
          setBusy(true);
          try {
            await onDelete(s);
          } finally {
            setBusy(false);
            setConfirming(false);
          }
        }}
        className="p-1 rounded text-red-600 hover:bg-red-500/10 cursor-pointer"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button
        type="button"
        disabled={busy}
        aria-label="Cancel delete"
        title="Cancel"
        onClick={() => setConfirming(false)}
        className="p-1 rounded text-muted dark:text-fog hover:bg-paper dark:hover:bg-emboss cursor-pointer"
      >
        <X size={13} />
      </button>
    </span>
  );
}

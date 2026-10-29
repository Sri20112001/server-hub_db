import { useState } from "react";
import { Key, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import { useUi } from "../stores/store";
import type { AgentToken } from "../lib/types/servers";

// One agent token in the list: label, active/revoked state, last use, revoke.
export function TokenRow({
  token,
  serverId,
  onRevoked,
}: {
  token: AgentToken;
  serverId: number;
  onRevoked: () => void;
}) {
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
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-line/60 dark:border-edge/60 bg-paper/40 dark:bg-abyss/40 hover:bg-paper/80 dark:hover:bg-abyss/80 transition-colors">
      <div className="min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-1">
          <Key size={13} className="text-muted dark:text-fog shrink-0" />
          <span className="text-sm font-semibold text-ink dark:text-bone truncate">
            {token.label || `Token #${token.id}`}
          </span>
          {token.revoked ? (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Revoked
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono text-muted dark:text-fog flex items-center gap-2 flex-wrap">
          <span>Created {new Date(token.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>
            {token.lastUsedAt ? `Last active ${timeAgo(token.lastUsedAt)}` : "Never used"}
          </span>
        </div>
      </div>
      <div>
        {!token.revoked && (
          <button
            onClick={revoke}
            disabled={busy}
            title="Revoke token"
            aria-label="Revoke token"
            className="p-1.5 rounded-lg text-muted dark:text-fog hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

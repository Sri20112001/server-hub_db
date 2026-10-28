import { KeyRound } from "lucide-react";
import { DatabaseIcon } from "../../components/DatabaseIcon";
import { chip } from "./databaseTokens";
import type { DbServerInfo } from "../../lib/types/databases";

// One detected database server in the left explorer column: online pip,
// name, endpoint, and source/version/credentials chips.
export function ServerListItem({
  server,
  isSelected,
  onSelect,
}: {
  server: DbServerInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isOnline = server.state === "running" || server.state === "active";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative text-left bg-white dark:bg-panel border rounded-card p-3.5 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-ember ${
        isSelected
          ? "border-accent dark:border-ember shadow-sm"
          : "border-line dark:border-edge hover:border-accent/60 dark:hover:border-ember/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 p-2 rounded-lg bg-paper dark:bg-abyss border border-line dark:border-edge flex items-center justify-center shrink-0">
            <DatabaseIcon engine={server.engine} size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? "bg-emerald-500" : "bg-zinc-400"
                  }`}
                />
              </span>
              <span className="font-head font-bold text-sm text-ink dark:text-bone truncate">
                {server.name}
              </span>
            </div>
            <div className="text-muted dark:text-fog text-[11px] font-mono mt-0.5 truncate">
              {server.container || `${server.host}:${server.port}`}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted dark:text-fog uppercase shrink-0 px-1.5 py-0.5 bg-paper dark:bg-abyss rounded border border-line/60 dark:border-edge/60">
          {server.engine}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-line/40 dark:border-edge/40">
        <div className="flex items-center gap-1.5">
          <span className={chip}>{server.source}</span>
          {server.version && <span className={chip}>v{server.version}</span>}
          {server.hasCreds && (
            <span className={`${chip} text-accent dark:text-ember`} title="Credential saved">
              <KeyRound size={10} /> Saved
            </span>
          )}
        </div>
        {server.registered.length > 0 && (
          <span className="text-[11px] font-mono font-semibold text-ink dark:text-bone">
            {server.registered.length} registered
          </span>
        )}
      </div>
    </div>
  );
}

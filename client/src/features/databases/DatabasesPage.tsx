import { useNavigate } from "react-router";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Kicker } from "../../components/ui/Kicker";
import { DatabaseIcon } from "../../components/DatabaseIcon";
import { btnGhost, inputCls } from "../../utils/databaseTokens";
import { DatabaseBrowser } from "../../components/DatabaseBrowser";
import { ServerListItem } from "../../components/ServerListItem";
import { useDatabases } from "../../hooks/useDatabases";

// Databases shell: page header, left server explorer (search, engine pills,
// list) and the right browser column. Data and actions come from useDatabases.
export function DatabasesPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  const nav = useNavigate();
  const d = useDatabases(setOnline);

  if (d.servers === null) {
    return <DashboardSkeleton />;
  }

  const servers = d.servers;

  return (
    <main className="w-full max-w-7xl mx-auto px-10 max-md:px-4 pt-24 pb-36">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-muted dark:text-fog hover:text-ink dark:hover:text-bone text-[13px] mb-2 px-0 transition-colors"
            onClick={() => nav("/")}
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <h1 className="font-head text-[32px] font-bold tracking-[-0.03em] leading-[1.2] max-md:text-[26px]">
            Databases
          </h1>
          <p className="text-muted dark:text-fog mt-1.5">
            <Kicker>
              {servers.length} server{servers.length === 1 ? "" : "s"} detected
              {!d.dockerAvailable && " · Docker unreachable"}
            </Kicker>
          </p>
        </div>
        <button
          type="button"
          className={btnGhost}
          disabled={d.browsing}
          onClick={() => void d.loadServers()}
        >
          <RefreshCw size={13} className={d.browsing ? "animate-spin" : ""} /> Re-scan
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No database servers found"
            hint="Start a Postgres, MySQL, Redis, or Mongo container — or expose one on localhost — and hit Re-scan."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr] mt-6 items-start">
          {/* Left Column: Server Explorer */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-fog pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search servers..."
                value={d.serverSearch}
                onChange={(e) => d.setServerSearch(e.target.value)}
                className={`${inputCls} pl-8 py-1.5 text-xs`}
              />
            </div>

            {/* Engine Filter Pills */}
            {d.engines.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => d.setEngineFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors border ${
                    d.engineFilter === "all"
                      ? "bg-accent/10 dark:bg-ember/15 border-accent dark:border-ember text-accent dark:text-ember font-semibold"
                      : "bg-paper dark:bg-abyss border-line dark:border-edge text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
                  }`}
                >
                  All ({servers.length})
                </button>
                {d.engines.map((eng) => {
                  const count = servers.filter((s) => s.engine?.toLowerCase() === eng).length;
                  const active = d.engineFilter === eng;
                  return (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => d.setEngineFilter(active ? "all" : eng)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors border ${
                        active
                          ? "bg-accent/10 dark:bg-ember/15 border-accent dark:border-ember text-accent dark:text-ember font-semibold"
                          : "bg-paper dark:bg-abyss border-line dark:border-edge text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
                      }`}
                    >
                      <DatabaseIcon engine={eng} size={12} />
                      <span className="capitalize">{eng}</span>
                      <span className="opacity-60 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {d.filteredServers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted dark:text-fog bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
                  No matching servers
                </div>
              ) : (
                d.filteredServers.map((s) => (
                  <ServerListItem
                    key={s.key}
                    server={s}
                    isSelected={s.key === d.selectedKey}
                    onSelect={() => d.pick(s)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Column: Database Browser */}
          <DatabaseBrowser d={d} />
        </div>
      )}
    </main>
  );
}

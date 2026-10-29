import { Loader2, PlusCircle, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { EmptyState } from "./ui/EmptyState";
import { DatabaseIcon, DatabaseBadge } from "./DatabaseIcon";
import { btnAccent, btnGhost, inputCls } from "../utils/databaseTokens";
import { CredentialsPanel } from "./CredentialsPanel";
import { DatabaseRowItem } from "./DatabaseRowItem";
import type { DatabaseController } from "../hooks/useDatabases";

// Right column of the databases page: selected-server header, browse error,
// credentials form, database listing with bulk selection, and the project
// registration action bar.
export function DatabaseBrowser({ d }: { d: DatabaseController }) {
  const selected = d.selected;

  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 min-h-[360px] flex flex-col justify-between">
      {!selected ? (
        <EmptyState
          title="Pick a server"
          hint="Select a detected server on the left to browse and register the databases inside it."
        />
      ) : (
        <div>
          {/* Header Area */}
          <div className="flex items-center justify-between gap-3 flex-wrap pb-4 border-b border-line/60 dark:border-edge/60 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-paper dark:bg-abyss border border-line dark:border-edge flex items-center justify-center shrink-0">
                <DatabaseIcon engine={selected.engine} size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-head font-bold text-[17px] leading-tight text-ink dark:text-bone">
                    {selected.name}
                  </h3>
                  <DatabaseBadge engine={selected.engine} size="sm" />
                </div>
                <span className="text-xs font-mono text-muted dark:text-fog">
                  {selected.container || `${selected.host}:${selected.port}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={btnGhost}
              disabled={d.browsing}
              onClick={() =>
                void d.browse(selected, d.username || undefined, d.password || undefined)
              }
            >
              <RefreshCw size={12} className={d.browsing ? "animate-spin" : ""} />
              {d.browsing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {/* Error Banner */}
          {d.browseErr && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 rounded-input p-3 text-[13px] mb-4">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{d.browseErr}</span>
            </div>
          )}

          {/* Auth Credentials Panel */}
          {(d.authRequired || selected.hasCreds || d.username || d.password) && (
            <CredentialsPanel
              engine={selected.engine}
              username={d.username}
              password={d.password}
              browsing={d.browsing}
              authRequired={d.authRequired}
              onChangeUsername={d.setUsername}
              onChangePassword={d.setPassword}
              onSubmit={d.connectAndBrowse}
            />
          )}

          {/* Loading Skeleton */}
          {d.browsing && d.dbs === null && !d.browseErr && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted dark:text-fog">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs font-mono">Reading databases…</span>
            </div>
          )}

          {/* Databases Listing */}
          {d.dbs !== null && (
            <div>
              {d.dbs.length === 0 ? (
                <EmptyState
                  title="No databases found"
                  hint="The server responded but reported zero visible databases."
                />
              ) : (
                <>
                  {/* Toolbar: Search & Bulk Selection Actions */}
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted dark:text-fog"
                      />
                      <input
                        type="text"
                        placeholder="Filter databases..."
                        value={d.dbSearch}
                        onChange={(e) => d.setDbSearch(e.target.value)}
                        className={`${inputCls} pl-7 py-1 text-xs`}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted dark:text-fog hover:text-ink dark:hover:text-bone font-medium">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={d.allTicked}
                          onChange={() =>
                            d.setChecked(
                              d.allTicked
                                ? new Set()
                                : new Set(d.tickable.map((t) => t.name)),
                            )
                          }
                        />
                        Select all ({d.tickable.length})
                      </label>

                      <button
                        type="button"
                        onClick={d.selectNonSystem}
                        className="text-muted dark:text-fog hover:text-ink dark:hover:text-bone underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Exclude system
                      </button>
                    </div>
                  </div>

                  {/* Database Items Card Stack */}
                  <div className="flex flex-col gap-2 max-h-[38vh] overflow-y-auto pr-1">
                    {d.filteredDbs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted dark:text-fog">
                        No databases match "{d.dbSearch}"
                      </div>
                    ) : (
                      d.filteredDbs.map((db) => (
                        <DatabaseRowItem
                          key={db.name}
                          db={db}
                          isChecked={d.checked.has(db.name)}
                          engine={selected.engine}
                          onToggle={() => d.toggle(db.name)}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Registration Action Bar */}
      {selected && d.dbs && d.dbs.length > 0 && (
        <div className="mt-5 pt-4 border-t border-line/60 dark:border-edge/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              className={`${inputCls} min-w-[210px] py-1.5 cursor-pointer`}
              value={d.projectId}
              onChange={(e) => d.setProjectId(e.target.value)}
            >
              <option value="">Select target project…</option>
              {d.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`${btnAccent} justify-center`}
            disabled={d.registering || d.checked.size === 0 || !d.projectId}
            onClick={() => void d.register()}
          >
            {d.registering ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <PlusCircle size={14} />
            )}
            {d.registering
              ? "Registering…"
              : `Register ${d.checked.size} selected`}
          </button>
        </div>
      )}
    </div>
  );
}

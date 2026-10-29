import { BellRing, Plus, Sparkles } from "lucide-react";

// Empty state: distinguishes "no rules exist yet" (seed/create offers) from
// "nothing matches the filters" (reset action).
export function AlertRulesEmpty({
  hasAnyRules,
  canWrite,
  seeding,
  onSeed,
  onCreate,
  onResetFilters,
}: {
  hasAnyRules: boolean;
  canWrite: boolean;
  seeding: boolean;
  onSeed: () => void;
  onCreate: () => void;
  onResetFilters: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-panel border border-line dark:border-edge rounded-card">
      <div className="w-12 h-12 rounded-full bg-paper dark:bg-abyss border border-line dark:border-edge flex items-center justify-center mx-auto mb-3 text-muted dark:text-fog">
        <BellRing size={24} />
      </div>
      {hasAnyRules ? (
        <>
          <h3 className="text-base font-bold text-ink dark:text-bone">No matching rules</h3>
          <p className="text-xs text-muted dark:text-fog mt-1">
            No alert rules match the active search query or filter criteria.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-3 py-1.5 rounded-md text-xs font-mono border border-line dark:border-edge bg-paper dark:bg-abyss text-ink dark:text-bone hover:border-accent dark:hover:border-ember cursor-pointer"
          >
            Reset Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-base font-bold text-ink dark:text-bone">
            No custom alert rules yet
          </h3>
          <p className="text-xs text-muted dark:text-fog mt-1 max-w-md mx-auto">
            Built-in thresholds still safeguard your servers. Deploy curated starter templates
            or create custom rules to monitor CPU, memory, and disk health.
          </p>
          {canWrite && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={onSeed}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-input text-xs font-semibold bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                <span>{seeding ? "Deploying…" : "Deploy 7 Recommended Rules"}</span>
              </button>
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-input text-xs font-medium bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Blank</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

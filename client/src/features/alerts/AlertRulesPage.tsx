import { BellRing, Plus, RefreshCw, Sparkles } from "lucide-react";
import { AlertRuleFilters } from "../../components/AlertRuleFilters";
import { AlertRulesEmpty } from "../../components/AlertRulesEmpty";
import { AlertRuleStats } from "../../components/AlertRuleStats";
import { AlertRuleTemplates } from "../../components/AlertRuleTemplates";
import { RuleCard } from "../../components/RuleCard";
import { RuleModal } from "../../components/RuleModal";
import { useAlertRules } from "../../hooks/useAlertRules";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// Alert rules shell: header, stats, template gallery, filters, list and the
// create/edit modal. Queries, actions and filter state come from
// useAlertRules; sections live in their own files.
export function AlertRulesPage() {
  useDocumentTitle("Alert Rules");
  const a = useAlertRules();

  return (
    <div className="min-h-screen pt-20 pb-36 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 dark:bg-ember/15 flex items-center justify-center text-accent dark:text-ember shadow-xs">
            <BellRing size={22} />
          </div>
          <div>
            <h1 className="text-ink dark:text-bone font-bold text-2xl tracking-tight">
              Alert Rules
            </h1>
            <p className="text-xs text-muted dark:text-fog mt-0.5">
              Custom per-server and global threshold rules with sustained evaluation windows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void a.refetch()}
            className="w-9 h-9 rounded-input bg-white dark:bg-panel border border-line dark:border-edge flex items-center justify-center text-muted dark:text-fog hover:text-ink dark:hover:text-bone transition-colors cursor-pointer"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={a.isFetching ? "animate-spin" : ""} />
          </button>

          {a.canWrite && (
            <>
              <button
                onClick={() => void a.seedDefaults()}
                disabled={a.seeding}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-input text-xs font-semibold bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:border-accent dark:hover:border-ember transition-colors cursor-pointer disabled:opacity-50"
                title="Deploy all recommended starter rules"
              >
                <Sparkles size={14} className="text-accent dark:text-ember" />
                <span>{a.seeding ? "Deploying…" : "Starter Pack"}</span>
              </button>

              <button
                onClick={() => a.setShowAdd(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-input text-xs font-semibold bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>Add Rule</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Deck */}
      <AlertRuleStats
        total={a.rules.length}
        enabled={a.enabledCount}
        critical={a.criticalCount}
        warning={a.warningCount}
      />

      {/* Recommended Presets Drawer / Toggle */}
      <AlertRuleTemplates
        rules={a.rules}
        canWrite={a.canWrite}
        open={a.showTemplates}
        onToggle={() => a.setShowTemplates(!a.showTemplates)}
        onDeploy={(p) => void a.deploySinglePreset(p)}
      />

      {/* Filter and Search Toolbar */}
      <AlertRuleFilters
        searchQuery={a.searchQuery}
        onSearch={a.setSearchQuery}
        metricFilter={a.metricFilter}
        onMetric={a.setMetricFilter}
        severityFilter={a.severityFilter}
        onSeverity={a.setSeverityFilter}
        statusFilter={a.statusFilter}
        onStatus={a.setStatusFilter}
      />

      {/* Loading Skeleton */}
      {a.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-panel border border-line dark:border-edge rounded-card animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!a.isLoading && a.filteredRules.length === 0 && (
        <AlertRulesEmpty
          hasAnyRules={a.rules.length > 0}
          canWrite={a.canWrite}
          seeding={a.seeding}
          onSeed={() => void a.seedDefaults()}
          onCreate={() => a.setShowAdd(true)}
          onResetFilters={a.resetFilters}
        />
      )}

      {/* Rules Listing */}
      <div className="space-y-3">
        {a.filteredRules.map((r) => (
          <RuleCard
            key={r.id}
            rule={r}
            canWrite={a.canWrite}
            canDelete={a.canDelete}
            onToggle={() => void a.toggleRule(r)}
            onEdit={() => a.setEditing(r)}
            onDelete={() => void a.deleteRule(r)}
          />
        ))}
      </div>

      {!a.canWrite && a.rules.length > 0 && (
        <p className="text-xs text-muted dark:text-fog mt-4 text-center">
          View-only mode — operators can create/edit rules, and admins can delete them.
        </p>
      )}

      {/* Add / Edit Rule Modal */}
      {(a.showAdd || a.editing) && (
        <RuleModal
          servers={a.servers}
          initial={a.editing}
          onClose={() => {
            a.setShowAdd(false);
            a.setEditing(null);
          }}
          onSaved={a.invalidate}
        />
      )}
    </div>
  );
}

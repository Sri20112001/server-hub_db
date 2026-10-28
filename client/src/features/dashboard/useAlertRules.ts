import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth, useUi } from "../../stores/store";
import type { AlertRule } from "../../lib/types/alerts";
import type { RulePreset } from "./alertRulePresets";

// Data, actions and filter state for the alert-rules page. The page shell
// only composes sections on top of what this hook returns.
export function useAlertRules() {
  const qc = useQueryClient();
  const { pushToast } = useUi();
  const { user } = useAuth();
  const canWrite = user?.role === "operator" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: rules = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["alert-rules"],
    queryFn: () => api.alertRules(),
    refetchInterval: 30_000,
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: () => api.servers(),
    staleTime: 60_000,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["alert-rules"] });

  const toggleRule = async (rule: AlertRule) => {
    try {
      await api.updateAlertRule(rule.id, { enabled: !rule.enabled });
      invalidate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to toggle rule", true);
    }
  };

  const deleteRule = async (rule: AlertRule) => {
    if (!confirm(`Delete rule "${rule.name}"? Any active firings will resolve automatically.`))
      return;
    try {
      await api.deleteAlertRule(rule.id);
      pushToast("Rule deleted");
      invalidate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to delete rule", true);
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await api.seedAlertRules();
      if (res.seeded > 0) {
        pushToast(`Successfully deployed ${res.seeded} recommended alert rules!`);
      } else {
        pushToast("Recommended alert rules are already deployed.");
      }
      invalidate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to seed rules", true);
    } finally {
      setSeeding(false);
    }
  };

  const deploySinglePreset = async (p: RulePreset) => {
    try {
      await api.createAlertRule({
        name: p.name,
        metric: p.metric,
        operator: p.operator,
        threshold: p.threshold,
        severity: p.severity,
        forSec: p.forSec,
        enabled: true,
      });
      pushToast(`Deployed "${p.name}" rule`);
      invalidate();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to deploy preset", true);
    }
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (metricFilter !== "all" && r.metric.toLowerCase() !== metricFilter) return false;
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      if (statusFilter === "enabled" && !r.enabled) return false;
      if (statusFilter === "disabled" && r.enabled) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesServer = r.serverName?.toLowerCase().includes(q) ?? false;
        const matchesMetric = r.metric.toLowerCase().includes(q);
        if (!matchesName && !matchesServer && !matchesMetric) return false;
      }
      return true;
    });
  }, [rules, metricFilter, severityFilter, statusFilter, searchQuery]);

  const enabledCount = rules.filter((r) => r.enabled).length;
  const criticalCount = rules.filter((r) => r.severity === "CRITICAL").length;
  const warningCount = rules.filter((r) => r.severity === "WARNING").length;

  // "Reset Filters" action in the no-match empty state.
  const resetFilters = () => {
    setSearchQuery("");
    setMetricFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
  };

  return {
    canWrite,
    canDelete,
    showAdd,
    setShowAdd,
    editing,
    setEditing,
    seeding,
    searchQuery,
    setSearchQuery,
    metricFilter,
    setMetricFilter,
    severityFilter,
    setSeverityFilter,
    statusFilter,
    setStatusFilter,
    showTemplates,
    setShowTemplates,
    rules,
    isLoading,
    refetch,
    isFetching,
    servers,
    invalidate,
    toggleRule,
    deleteRule,
    seedDefaults,
    deploySinglePreset,
    filteredRules,
    enabledCount,
    criticalCount,
    warningCount,
    resetFilters,
  };
}

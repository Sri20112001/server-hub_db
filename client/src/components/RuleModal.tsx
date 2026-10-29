import { useState } from "react";
import { BellRing, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useUi } from "../stores/store";
import { RECOMMENDED_PRESETS, type RulePreset } from "../utils/alertRulePresets";
import { MetricIcon } from "./MetricIcon";
import type { AlertRule } from "../lib/types/alerts";
import type { ManagedServer } from "../lib/types/servers";

const METRICS = ["cpu", "memory", "disk"] as const;
const OPERATORS = ["above", "below"] as const;
const SEVERITIES = ["WARNING", "CRITICAL"] as const;
const FOR_PRESETS = [0, 30, 60, 120, 300, 900];

type RuleForm = {
  name: string;
  serverId: number | null;
  metric: "cpu" | "memory" | "disk";
  operator: "above" | "below";
  threshold: string;
  severity: "WARNING" | "CRITICAL";
  forSec: string;
  enabled: boolean;
};

// Create/edit dialog for one alert rule: quick presets, server scope, metric
// condition, threshold, severity, sustained window and the enable flag.
export function RuleModal({
  servers,
  initial,
  onClose,
  onSaved,
}: {
  servers: ManagedServer[];
  initial: AlertRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { pushToast } = useUi();
  const [form, setForm] = useState<RuleForm>({
    name: initial?.name ?? "",
    serverId: initial?.serverId ?? null,
    metric: initial?.metric ?? "cpu",
    operator: initial?.operator ?? "above",
    threshold: initial ? String(initial.threshold) : "85",
    severity: initial?.severity ?? "WARNING",
    forSec: initial ? String(initial.forSec) : "300",
    enabled: initial?.enabled ?? true,
  });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof RuleForm>(k: K, v: RuleForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const applyPreset = (p: RulePreset) => {
    setForm((f) => ({
      ...f,
      name: p.name,
      metric: p.metric,
      operator: p.operator,
      threshold: String(p.threshold),
      severity: p.severity,
      forSec: String(p.forSec),
    }));
  };

  const submit = async () => {
    const threshold = Number(form.threshold);
    const forSec = Math.round(Number(form.forSec));
    if (!Number.isFinite(threshold) || !Number.isFinite(forSec) || forSec < 0) {
      pushToast("Threshold and sustained window must be valid numbers", true);
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: form.name.trim() || undefined,
        serverId: form.serverId,
        metric: form.metric,
        operator: form.operator,
        threshold,
        severity: form.severity,
        forSec,
        enabled: form.enabled,
      };
      if (initial) {
        await api.updateAlertRule(initial.id, body);
        pushToast(`Rule "${form.name || initial.name}" updated`);
      } else {
        await api.createAlertRule(body);
        pushToast(`Rule "${form.name || "Custom alert rule"}" created`);
      }
      onSaved();
      onClose();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to save rule", true);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2 outline-none focus:border-accent dark:focus:border-ember";
  const labelCls = "text-muted dark:text-fog text-xs mb-1 block font-medium";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-6 w-full max-w-lg shadow-chrome max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line dark:border-edge mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent/10 dark:bg-ember/15 text-accent dark:text-ember">
              <BellRing size={18} />
            </div>
            <div>
              <h2 className="text-ink dark:text-bone font-bold text-lg leading-tight">
                {initial ? "Edit Alert Rule" : "Create Alert Rule"}
              </h2>
              <p className="text-xs text-muted dark:text-fog">
                Set custom trigger thresholds and evaluation windows
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets Picker */}
        <div className="mb-4 p-3 rounded-xl bg-paper/60 dark:bg-abyss/60 border border-line dark:border-edge">
          <div className="flex items-center justify-between text-xs font-medium text-ink dark:text-bone mb-2">
            <span className="flex items-center gap-1.5 text-accent dark:text-ember font-semibold">
              <Sparkles size={13} /> Quick Presets
            </span>
            <span className="text-[11px] text-muted dark:text-fog">Click to auto-fill</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {RECOMMENDED_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border border-line dark:border-edge bg-white dark:bg-panel text-ink dark:text-bone hover:border-accent dark:hover:border-ember transition-colors cursor-pointer"
              >
                <MetricIcon metric={p.metric} size={11} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Rule Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. High CPU Spike, Database Disk Low"
            />
          </div>

          <div>
            <label className={labelCls}>Server Scope</label>
            <select
              className={inputCls}
              value={form.serverId === null ? "" : String(form.serverId)}
              onChange={(e) =>
                set("serverId", e.target.value === "" ? null : Number(e.target.value))
              }
            >
              <option value="">All servers (global threshold)</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.ipAddress || s.hostname || `#${s.id}`})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Metric</label>
              <select
                className={inputCls}
                value={form.metric}
                onChange={(e) => set("metric", e.target.value as RuleForm["metric"])}
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition</label>
              <select
                className={inputCls}
                value={form.operator}
                onChange={(e) => set("operator", e.target.value as RuleForm["operator"])}
              >
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>
                    {o === "above" ? "Above (>)" : "Below (<)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Threshold Percentage (%)</label>
              <input
                className={`${inputCls} font-mono`}
                inputMode="decimal"
                value={form.threshold}
                onChange={(e) => set("threshold", e.target.value)}
                placeholder="85"
              />
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[75, 80, 85, 90, 95].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set("threshold", String(val))}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                      form.threshold === String(val)
                        ? "bg-accent dark:bg-ember text-white dark:text-black border-transparent font-bold"
                        : "border-line dark:border-edge text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Severity</label>
              <select
                className={inputCls}
                value={form.severity}
                onChange={(e) => set("severity", e.target.value as RuleForm["severity"])}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Sustained Breach Window (0 = instant firing)</label>
            <input
              className={`${inputCls} font-mono`}
              inputMode="numeric"
              value={form.forSec}
              onChange={(e) => set("forSec", e.target.value)}
              placeholder="0"
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {FOR_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("forSec", String(p))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer ${
                    form.forSec === String(p)
                      ? "bg-accent dark:bg-ember text-white dark:text-black border-transparent font-bold"
                      : "border-line dark:border-edge bg-paper dark:bg-abyss text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
                  }`}
                >
                  {p === 0 ? "Instant (0s)" : p < 60 ? `${p}s` : `${p / 60}m`}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-[13px] text-ink dark:text-bone cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
              className="w-4 h-4 rounded border-line dark:border-edge accent-accent dark:accent-ember"
            />
            <span className="font-medium">Enable this alert rule immediately</span>
          </label>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-line dark:border-edge">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-input text-[13px] font-medium bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="px-5 py-2 rounded-input text-[13px] font-semibold bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover disabled:opacity-50 cursor-pointer transition-colors"
            >
              {busy ? "Saving…" : initial ? "Save Changes" : "Create Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { api } from "../lib/api";
import type { AmAlert } from "../lib/types/monitoring";
import type { BusEvent } from "../lib/types/logs";
import { Modal } from "./ui/Modal";
import { Field } from "./ui/Field";
import { useEvents } from "../lib/useEvents";
import { fmtDuration, severityColor } from "../utils/monitoringFormat";

// Alerts tab: full Alertmanager alert list with counts, refresh and the
// create-silence modal for firing alerts.
export function MonitoringAlertsTab() {
  const [alerts, setAlerts] = useState<AmAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [silencing, setSilencing] = useState<AmAlert | null>(null);
  const [silenceDur, setSilenceDur] = useState("1h");
  const [silenceComment, setSilenceComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.monitoringAlerts()
      .then(setAlerts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Intentional: initial fetch on mount (load is a stable useCallback).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEvents((ev: BusEvent) => {
    if (ev.type === "monitoring.alert.firing" || ev.type === "monitoring.alert.resolved") load();
  });

  const doSilence = async () => {
    if (!silencing) return;
    setBusy(true);
    const durs: Record<string, number> = { "30m": 30, "1h": 60, "4h": 240, "custom": 60 };
    const mins = durs[silenceDur] ?? 60;
    const now = new Date();
    const end = new Date(now.getTime() + mins * 60000);
    const matchers = Object.entries(silencing.labels).map(([name, value]) => ({
      name, value, isRegex: false, isEqual: true,
    }));
    try {
      await api.createSilence({
        matchers,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        createdBy: "serverhub",
        comment: silenceComment || `Silenced via ServerHub for ${silenceDur}`,
      });
      setSilencing(null);
      setSilenceComment("");
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-muted dark:text-fog text-[13px]">Loading…</div>;
  if (error) return (
    <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-6 text-center">
      <div className="text-brick font-medium mb-1">Alertmanager unavailable</div>
      <div className="text-muted dark:text-fog text-[13px]">{error}</div>
    </div>
  );

  const firing = alerts.filter(a => a.status.state === "active");
  const suppressed = alerts.filter(a => a.status.state === "suppressed");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-[12px] text-muted dark:text-fog">
          {firing.length} firing · {suppressed.length} suppressed · {alerts.length} total
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-[12px] text-muted dark:text-fog hover:text-ink dark:hover:text-bone cursor-pointer bg-transparent border-0">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-8 text-center">
          <CheckCircle size={24} className="text-moss mx-auto mb-2" />
          <div className="font-medium">No active alerts</div>
          <div className="text-muted dark:text-fog text-[13px] mt-1">All systems nominal.</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl overflow-hidden">
          {alerts.map((a, i) => (
            <div key={a.fingerprint} className={`px-4 py-3.5 flex items-start gap-3 ${i > 0 ? "border-t border-line dark:border-edge" : ""}`}>
              <div className="mt-0.5 shrink-0">
                {a.status.state === "active"
                  ? <XCircle size={15} className={severityColor(a.labels.severity)} />
                  : <CheckCircle size={15} className="text-muted dark:text-fog" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[13px]">{a.labels.alertname ?? "Alert"}</span>
                  <span className={`font-mono text-[11px] uppercase ${severityColor(a.labels.severity)}`}>
                    {a.labels.severity ?? ""}
                  </span>
                  <span className="font-mono text-[11px] text-muted dark:text-fog">
                    {a.status.state}
                  </span>
                </div>
                {a.labels.instance && (
                  <div className="font-mono text-[11px] text-muted dark:text-fog mt-0.5">{a.labels.instance}</div>
                )}
                {a.annotations.summary && (
                  <div className="text-[12px] text-muted dark:text-fog mt-0.5">{a.annotations.summary}</div>
                )}
                <div className="font-mono text-[11px] text-muted dark:text-fog mt-1">
                  Started {fmtDuration(a.startsAt)} ago
                </div>
              </div>
              {a.status.state === "active" && (
                <button
                  onClick={() => setSilencing(a)}
                  className="shrink-0 text-[12px] px-2.5 py-1 rounded-lg border border-line dark:border-edge bg-paper dark:bg-abyss hover:bg-white dark:hover:bg-panel cursor-pointer"
                >
                  Silence
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {silencing && (
        <Modal onClose={() => setSilencing(null)}>
          <h3 className="text-[18px] mb-1">Silence alert</h3>
          <p className="text-muted dark:text-fog text-[13px] mb-4">
            {silencing.labels.alertname} · {silencing.labels.instance ?? ""}
          </p>
          <Field label="Duration">
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-paper dark:bg-abyss border border-line dark:border-edge">
              {["30m", "1h", "4h", "custom"].map(d => (
                <button key={d} onClick={() => setSilenceDur(d)}
                  className={`px-2 py-1.5 rounded-lg font-mono text-[12px] cursor-pointer border transition-colors ${silenceDur === d ? "bg-white dark:bg-panel border-line dark:border-edge" : "bg-transparent border-transparent text-muted dark:text-fog"}`}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <div className="mt-3">
            <Field label="Comment (optional)">
              <input
                className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-lg text-[13px] px-3 py-2 outline-none focus:border-accent dark:focus:border-ember"
                value={silenceComment}
                onChange={e => setSilenceComment(e.target.value)}
                placeholder="Reason for silence…"
              />
            </Field>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setSilencing(null)} className="px-4 py-2 text-[13px] rounded-lg border border-line dark:border-edge bg-white dark:bg-panel cursor-pointer">Cancel</button>
            <button onClick={doSilence} disabled={busy} className="px-4 py-2 text-[13px] rounded-lg bg-accent-deep dark:bg-ember text-white dark:text-black cursor-pointer disabled:opacity-50">
              {busy ? "Creating…" : "Create silence"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

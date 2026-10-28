import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import type { AmSilence } from "../../lib/types/monitoring";

// Silences tab: Alertmanager silence list with counts, refresh and expire.
export function MonitoringSilencesTab() {
  const [silences, setSilences] = useState<AmSilence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.monitoringSilences()
      .then(setSilences)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Intentional: initial fetch on mount (load is a stable useCallback).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const doDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.deleteSilence(id);
      load();
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="text-muted dark:text-fog text-[13px]">Loading…</div>;
  if (error) return (
    <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-6 text-center">
      <div className="text-brick font-medium mb-1">Alertmanager unavailable</div>
      <div className="text-muted dark:text-fog text-[13px]">{error}</div>
    </div>
  );

  const active = silences.filter(s => s.status.state === "active");
  const expired = silences.filter(s => s.status.state !== "active");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-[12px] text-muted dark:text-fog">{active.length} active · {expired.length} expired</div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-[12px] text-muted dark:text-fog hover:text-ink dark:hover:text-bone cursor-pointer bg-transparent border-0">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {silences.length === 0 ? (
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-8 text-center text-muted dark:text-fog text-[13px]">
          No silences configured.
        </div>
      ) : (
        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl overflow-hidden">
          {silences.map((s, i) => (
            <div key={s.id} className={`px-4 py-3.5 flex items-start gap-3 ${i > 0 ? "border-t border-line dark:border-edge" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-[11px] uppercase ${s.status.state === "active" ? "text-moss" : "text-muted dark:text-fog"}`}>
                    {s.status.state}
                  </span>
                  <span className="font-mono text-[11px] text-muted dark:text-fog">by {s.createdBy}</span>
                </div>
                <div className="text-[13px] mt-0.5">{s.comment || "—"}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {s.matchers.map((m, j) => (
                    <span key={j} className="font-mono text-[11px] bg-paper dark:bg-abyss border border-line dark:border-edge rounded px-1.5 py-0.5">
                      {m.name}{m.isRegex ? "=~" : "="}{m.value}
                    </span>
                  ))}
                </div>
                <div className="font-mono text-[11px] text-muted dark:text-fog mt-1">
                  {new Date(s.startsAt).toLocaleString()} → {new Date(s.endsAt).toLocaleString()}
                </div>
              </div>
              {s.status.state === "active" && (
                <button
                  onClick={() => doDelete(s.id)}
                  disabled={deleting === s.id}
                  className="shrink-0 text-[12px] px-2.5 py-1 rounded-lg border border-brick text-brick hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer disabled:opacity-50"
                >
                  {deleting === s.id ? "…" : "Expire"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

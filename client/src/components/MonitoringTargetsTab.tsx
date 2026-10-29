import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { PromTarget, PromTargetsData } from "../lib/types/monitoring";

// Targets tab: Prometheus scrape target table (health, last scrape, errors).
export function MonitoringTargetsTab() {
  const [targets, setTargets] = useState<PromTargetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.prometheusTargets()
      .then(r => setTargets(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted dark:text-fog text-[13px]">Loading…</div>;
  if (error) return (
    <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-6 text-center">
      <div className="text-brick font-medium mb-1">Prometheus unavailable</div>
      <div className="text-muted dark:text-fog text-[13px]">{error}</div>
    </div>
  );
  if (!targets) return null;

  const all: (PromTarget & { pool: string })[] = targets.activeTargets.map(t => ({ ...t, pool: t.scrapePool }));
  const up = all.filter(t => t.health === "up").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="font-mono text-[12px] text-muted dark:text-fog">
        {up} / {all.length} targets up
      </div>
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Job", "Instance", "Health", "Last scrape", "Duration", "Error"].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map((t, i) => (
              <tr key={i} className="group">
                <td className="px-4 py-2.5 border-t border-line dark:border-edge font-mono">{t.labels.job ?? t.pool}</td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge font-mono text-[12px]">{t.labels.instance ?? "—"}</td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge">
                  <span className={`inline-flex items-center gap-1.5 font-mono text-[11px]`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.health === "up" ? "bg-moss" : "bg-brick"}`} />
                    {t.health.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge font-mono text-[12px] text-muted dark:text-fog">
                  {/* Intentional: live "Xs ago" label; rows refresh on the 30s poll. */}
                  {/* eslint-disable-next-line react-hooks/purity */}
                  {t.lastScrape ? `${Math.round((Date.now() - new Date(t.lastScrape).getTime()) / 1000)}s ago` : "—"}
                </td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge font-mono text-[12px] text-muted dark:text-fog">
                  {t.lastScrapeDuration ? `${(t.lastScrapeDuration * 1000).toFixed(0)}ms` : "—"}
                </td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge font-mono text-[11px] text-brick max-w-[200px] truncate group-hover:bg-paper dark:group-hover:bg-emboss">
                  {t.lastError || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

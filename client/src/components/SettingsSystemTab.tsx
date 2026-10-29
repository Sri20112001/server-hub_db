import { Kicker } from "./ui/Kicker";
import { fmtUptime } from "../lib/format";
import type { SettingsController } from "../hooks/useSettings";

// Tab 3: host parameters (API endpoint, Docker socket, uptime, census) and
// the version footer card.
export function SettingsSystemTab({ c }: { c: SettingsController }) {
  const info = c.info;

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-bone">Host Parameters</h2>
            <p className="text-muted dark:text-fog text-[13px]">Core runtime metrics and daemon routing points.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            SERVERHUB · v2.0
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
            <Kicker>API Endpoint</Kicker>
            <div className="font-mono text-[13px] mt-1.5 truncate text-ink dark:text-bone font-medium">{c.apiUrl}</div>
          </div>
          <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <Kicker>Docker Socket</Kicker>
              <span
                className={
                  info?.dockerAvailable
                    ? "w-2.5 h-2.5 rounded-full bg-moss shadow-[0_0_0_3px_rgba(22,163,74,0.18)]"
                    : "w-2.5 h-2.5 rounded-full bg-stone shadow-[0_0_0_3px_rgba(168,162,158,0.25)]"
                }
              />
            </div>
            <div className="font-mono text-[13px] mt-1.5 truncate text-ink dark:text-bone font-medium">
              {info ? (info.dockerAvailable ? "/var/run/docker.sock · live" : "unreachable") : "probing…"}
            </div>
          </div>
          <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
            <Kicker>Uptime</Kicker>
            <div className="font-mono text-[13px] mt-1.5 text-ink dark:text-bone font-medium">{info ? fmtUptime(info.uptimeSec) : "—"}</div>
          </div>
          <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
            <Kicker>Fleet Census</Kicker>
            <div className="font-mono text-[13px] mt-1.5 truncate text-ink dark:text-bone font-medium">
              {info
                ? `${info.projects} ships · ${info.services} stations · ${
                    info.runningContainers < 0 ? "?" : info.runningContainers
                  } running`
                : "—"}
            </div>
          </div>
        </div>

        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 mt-4 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-ink dark:text-bone">Heartbeat interval</span>
          <span className="font-mono text-xs text-muted dark:text-fog">
            Every tick <strong className="font-mono text-ink dark:text-bone font-semibold">30s</strong>
          </span>
        </div>
      </section>

      <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
              v2.0
            </span>
            <span className="font-mono text-xs text-muted dark:text-fog flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-moss shadow-[0_0_0_3px_rgba(22,163,74,0.18)]" />
              Bridge manned
            </span>
          </div>
          <em className="text-muted dark:text-fog text-[13px] not-italic">Self-hosted container & server orchestrator.</em>
        </div>
      </section>
    </div>
  );
}

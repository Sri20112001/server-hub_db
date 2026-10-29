import { Kicker } from "./ui/Kicker";
import { fmtUptime } from "../lib/format";
import { Fact, TelemetrySection } from "./TelemetrySection";
import { fmtSize } from "../utils/telemetryFormat";
import type { ServerDetail } from "../lib/types/host";

function pressureDot(level: string): string {
  if (level === "High") return "bg-brick";
  if (level === "Elevated") return "bg-status-amber";
  return "bg-moss";
}

// Host detail sections: system pressure, host facts, memory breakdown and the
// process table.
export function TelemetryDetail({ detail }: { detail: ServerDetail }) {
  return (
    <>
      <TelemetrySection title="System pressure">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            ["CPU", detail.pressure.cpu],
            ["Memory", detail.pressure.memory],
            ["Disk", detail.pressure.disk],
          ].map(([label, level]) => (
            <div
              key={label}
              className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 flex items-center gap-2.5"
            >
              <span className={`w-2 h-2 rounded-full ${pressureDot(level)}`} />
              <div>
                <Kicker>{label}</Kicker>
                <div className="text-[13px] font-medium">{level}</div>
              </div>
            </div>
          ))}
        </div>
      </TelemetrySection>

      <TelemetrySection title="Host">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Fact label="Hostname" value={detail.host.hostname || "—"} />
          <Fact
            label="OS"
            value={`${detail.host.platform || detail.host.os || "—"} · ${detail.host.arch || ""}`}
          />
          <Fact label="Kernel" value={detail.host.kernel || "—"} />
          <Fact label="Uptime" value={fmtUptime(detail.host.uptimeSec)} />
          <Fact
            label="CPU"
            value={`${detail.cpu.logicalCores || "?"} cores · ${detail.cpu.physicalCores || "?"} physical · ${(detail.cpu.mhz / 1000 || 0).toFixed(1)} GHz`}
          />
          <Fact
            label="Load average"
            value={`${detail.cpu.load1.toFixed(2)} / ${detail.cpu.load5.toFixed(2)} / ${detail.cpu.load15.toFixed(2)}`}
          />
        </div>
        <div className="font-mono text-[11px] text-muted dark:text-fog mt-2 truncate">
          {detail.cpu.model || "unknown processor"}
        </div>
      </TelemetrySection>

      <TelemetrySection title="Memory">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Fact
            label="Used"
            value={`${fmtSize(detail.memory.usedMB)} / ${fmtSize(detail.memory.totalMB)} · ${detail.memory.usedPct.toFixed(1)}%`}
          />
          <Fact label="Available" value={fmtSize(detail.memory.availableMB)} />
          <Fact label="Free" value={fmtSize(detail.memory.freeMB)} />
          <Fact
            label="Cached + buffers"
            value={`${fmtSize(detail.memory.cachedMB + detail.memory.buffersMB)}`}
          />
          <Fact
            label="Swap"
            value={
              detail.memory.swapTotalMB > 0
                ? `${fmtSize(detail.memory.swapUsedMB)} / ${fmtSize(detail.memory.swapTotalMB)} · ${detail.memory.swapPct.toFixed(0)}%`
                : "no swap configured"
            }
          />
          <Fact label="Total" value={fmtSize(detail.memory.totalMB)} />
        </div>
      </TelemetrySection>

      <TelemetrySection title="Processes">
        <div className="flex items-center gap-2 flex-wrap mb-2.5 font-mono text-[12px]">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            {detail.processes.total} total
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            {detail.processes.running} running
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            {detail.processes.sleeping} sleeping
          </span>
          {detail.processes.zombie > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
              {detail.processes.zombie} zombie
            </span>
          )}
        </div>
        <div className="overflow-x-auto bg-white dark:bg-panel border border-line dark:border-edge rounded-xl">
          <table className="w-full min-w-[520px] sm:min-w-0 border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Process</th>
                <th className="hidden sm:table-cell text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">PID</th>
                <th className="hidden md:table-cell text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">State</th>
                <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss last:text-right">Memory</th>
              </tr>
            </thead>
            <tbody>
              {detail.processes.top.map((p) => (
                <tr key={p.pid} className="group">
                  <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono max-w-[160px] sm:max-w-[220px] truncate">
                    {p.name}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono text-muted dark:text-fog">
                    {p.pid}
                  </td>
                  <td className="hidden md:table-cell px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono text-muted dark:text-fog">
                    {p.status}
                  </td>
                  <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss font-mono">
                    {fmtSize(p.memMB)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TelemetrySection>
    </>
  );
}

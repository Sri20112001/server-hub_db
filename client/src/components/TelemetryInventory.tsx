import { TelemetrySection } from "./TelemetrySection";
import { fmtBytesTotal, fmtSize } from "../utils/telemetryFormat";
import type { ContainerStat, ServerDetail } from "../lib/types/host";

// Network interface, disk I/O and per-container resource tables. Each table
// renders only when its data is present.
export function TelemetryInventory({
  detail,
  cstats,
}: {
  detail: ServerDetail | null;
  cstats: ContainerStat[] | null;
}) {
  return (
    <>
      {detail && detail.network.length > 0 && (
        <TelemetrySection title="Network interfaces">
          <div className="overflow-x-auto bg-white dark:bg-panel border border-line dark:border-edge rounded-xl">
            <table className="w-full min-w-[440px] sm:min-w-0 border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Interface</th>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Received</th>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss last:text-right">Transmitted</th>
                </tr>
              </thead>
              <tbody>
                {detail.network.map((n) => (
                  <tr key={n.name} className="group">
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                      {n.name}
                    </td>
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                      {fmtBytesTotal(n.rxBytes)}
                    </td>
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss font-mono">
                      {fmtBytesTotal(n.txBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TelemetrySection>
      )}

      {detail && detail.diskIO.length > 0 && (
        <TelemetrySection title="Disk I/O totals">
          <div className="overflow-x-auto bg-white dark:bg-panel border border-line dark:border-edge rounded-xl">
            <table className="w-full min-w-[440px] sm:min-w-0 border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Device</th>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Read</th>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss last:text-right">Written</th>
                </tr>
              </thead>
              <tbody>
                {detail.diskIO.map((d) => (
                  <tr key={d.device} className="group">
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                      {d.device}
                    </td>
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                      {fmtSize(d.readMB)}
                    </td>
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss font-mono">
                      {fmtSize(d.writeMB)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TelemetrySection>
      )}

      {cstats !== null && cstats.length > 0 && (
        <TelemetrySection title="Container resources">
          <div className="overflow-x-auto bg-white dark:bg-panel border border-line dark:border-edge rounded-xl">
            <table className="w-full min-w-[560px] md:min-w-0 border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Container</th>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">CPU</th>
                  <th className="hidden sm:table-cell text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Memory</th>
                  <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss last:text-right">Net ↓↑</th>
                </tr>
              </thead>
              <tbody>
                {cstats.map((c) => (
                  <tr key={c.id} className="group">
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle">
                      <div className="font-mono">{c.name}</div>
                      <div className="font-mono text-muted dark:text-fog text-[11px] truncate max-w-[220px]">
                        {c.image}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                      {c.cpuPercent.toFixed(1)}%
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                      {fmtSize(c.memMB)}
                      {c.memLimitMB > 0 ? ` / ${fmtSize(c.memLimitMB)}` : ""}
                    </td>
                    <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss font-mono">
                      {fmtSize(c.netRxMB)} / {fmtSize(c.netTxMB)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TelemetrySection>
      )}
    </>
  );
}

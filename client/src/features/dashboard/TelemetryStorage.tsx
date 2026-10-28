import { Fact, TelemetrySection } from "./TelemetrySection";
import { fmtGB, fmtSize } from "./telemetryFormat";
import type { StorageInfo } from "../../lib/types/host";

// Storage section: filesystem table, per-application footprint bars and the
// Docker image/volume/cache breakdown.
export function TelemetryStorage({ storage }: { storage: StorageInfo }) {
  return (
    <TelemetrySection title="Storage">
      <div className="overflow-x-auto bg-white dark:bg-panel border border-line dark:border-edge rounded-xl mb-4">
        <table className="w-full min-w-[440px] sm:min-w-0 border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Filesystem</th>
              <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss">Used</th>
              <th className="text-left text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog px-4 py-2.5 bg-paper dark:bg-abyss last:text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {storage.filesystems.map((f) => (
              <tr key={f.mount} className="group">
                <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle">
                  <div className="font-mono">{f.mount}</div>
                  <div className="font-mono text-muted dark:text-fog text-[11px]">
                    {f.device} · {f.fstype}
                  </div>
                </td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle font-mono">
                  {fmtGB(f.usedGB)} · {f.usedPct.toFixed(0)}%
                </td>
                <td className="px-4 py-2.5 border-t border-line dark:border-edge align-middle last:text-right group-hover:bg-paper dark:group-hover:bg-emboss font-mono">
                  {fmtGB(f.totalGB)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {storage.apps.length > 0 && (
        <div className="mb-4">
          <div className="font-mono text-[11px] text-muted dark:text-fog mb-1.5">
            {storage.appsRoot || "applications"}
            {storage.appsPartial ? " · partial scan" : ""}
          </div>
          <div className="flex flex-col gap-1.5">
            {(() => {
              const top = Math.max(...storage.apps.map((a) => a.bytesMB), 1);
              return storage.apps.slice(0, 10).map((a) => {
                const filled = Math.max(
                  a.bytesMB > 0 ? 1 : 0,
                  Math.round((a.bytesMB / top) * 10),
                );
                return (
                  <div key={a.path} className="flex items-center gap-2.5">
                    <span className="font-mono text-[12px] w-32 truncate shrink-0">{a.name}</span>
                    <span className="flex gap-[3px] flex-1" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < filled
                              ? "bg-accent dark:bg-ember"
                              : "bg-paper dark:bg-abyss border border-line dark:border-edge"
                          }`}
                        />
                      ))}
                    </span>
                    <span className="font-mono text-[11px] text-muted dark:text-fog w-20 text-right shrink-0">
                      {fmtSize(a.bytesMB)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {storage.docker && (
        <div>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 sm:gap-4 mb-2.5">
            <Fact label="Images" value={fmtSize(storage.docker.imagesMB)} />
            <Fact label="Containers" value={fmtSize(storage.docker.containersMB)} />
            <Fact label="Volumes" value={fmtSize(storage.docker.volumesMB)} />
            <Fact label="Build cache" value={fmtSize(storage.docker.buildCacheMB)} />
          </div>
          {storage.docker.imagesTop.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {storage.docker.imagesTop.slice(0, 6).map((im) => (
                <div key={im.name} className="flex items-center gap-2.5">
                  <span className="font-mono text-[12px] flex-1 truncate">{im.name}</span>
                  <span className="font-mono text-[11px] text-muted dark:text-fog shrink-0">
                    {fmtSize(im.sizeMB)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </TelemetrySection>
  );
}

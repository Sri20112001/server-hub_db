import { TelemetryCharts, TelemetryRangeControls } from "./TelemetryCharts";
import { TelemetryDetail } from "./TelemetryDetail";
import { TelemetryInventory } from "./TelemetryInventory";
import { TelemetryStorage } from "./TelemetryStorage";
import { useTelemetry } from "./useTelemetry";

// Telemetry shell: page header, range switcher, then the history charts and
// the one-shot host detail, storage and inventory sections inside a single
// flex column. Data fetching lives in useTelemetry; each section is its own
// file.
export function TelemetryPage() {
  const t = useTelemetry();

  return (
    <main className="w-full max-w-7xl mx-auto px-10 max-md:px-4 pt-24 pb-36">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-head text-[32px] capitalize font-bold tracking-[-0.03em] leading-[1.2] max-md:text-[26px]">
            Telemetry.
          </h1>
          <p className="text-muted dark:text-fog mt-1.5">
            Host resources and metrics
          </p>
        </div>
      </div>

      <TelemetryRangeControls range={t.range} onRange={t.setRange} />

      <div className="flex flex-col gap-5">
        <TelemetryCharts loading={t.loading} hasPoints={t.points.length > 0} rich={t.rich} />
        {t.detail && <TelemetryDetail detail={t.detail} />}
        {t.storage && <TelemetryStorage storage={t.storage} />}
        <TelemetryInventory detail={t.detail} cstats={t.cstats} />
      </div>
    </main>
  );
}

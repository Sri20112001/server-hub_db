import { TelemetryCharts, TelemetryRangeControls } from "../../components/TelemetryCharts";
import { TelemetryDetail } from "../../components/TelemetryDetail";
import { TelemetryInventory } from "../../components/TelemetryInventory";
import { TelemetryStorage } from "../../components/TelemetryStorage";
import { Page } from "../../components/ui/Page";
import { PageHeader } from "../../components/ui/PageHeader";
import { useTelemetry } from "../../hooks/useTelemetry";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// Telemetry shell: page header, range switcher, then the history charts and
// the one-shot host detail, storage and inventory sections inside a single
// flex column. Data fetching lives in useTelemetry; each section is its own
// file.
export function TelemetryPage() {
  useDocumentTitle("Host Telemetry");
  const t = useTelemetry();

  return (
    <Page width="wide">
      <PageHeader
        className="mb-8"
        title="Telemetry."
        subtitle="Host resources and metrics"
      />

      <TelemetryRangeControls range={t.range} onRange={t.setRange} />

      <div className="flex flex-col gap-5">
        <TelemetryCharts key={t.range} loading={t.loading} hasPoints={t.points.length > 0} rich={t.rich} />
        {t.detail && <TelemetryDetail detail={t.detail} />}
        {t.storage && <TelemetryStorage storage={t.storage} />}
        <TelemetryInventory detail={t.detail} cstats={t.cstats} />
      </div>
    </Page>
  );
}

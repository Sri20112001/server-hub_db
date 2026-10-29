import { useState } from "react";
import { Activity, Server } from "lucide-react";
import { MonitoringDashboardTab } from "../../components/MonitoringDashboardTab";
import { MonitoringAlertsTab } from "../../components/MonitoringAlertsTab";
import { MonitoringTargetsTab } from "../../components/MonitoringTargetsTab";
import { MonitoringSilencesTab } from "../../components/MonitoringSilencesTab";
import { MonitoringMetricsTab } from "../../components/MonitoringMetricsTab";

type Tab = "dashboard" | "alerts" | "targets" | "silences" | "metrics";
const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "alerts", label: "Alerts" },
  { id: "targets", label: "Targets" },
  { id: "silences", label: "Silences" },
  { id: "metrics", label: "Metrics" },
];

// Monitoring shell: page header and tab bar; each tab is a self-contained
// component (own queries and state) in its own file.
export function MonitoringPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <main className="w-full max-w-7xl mx-auto px-10 max-md:px-4 pt-24 pb-36">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-head text-[32px] font-bold tracking-[-0.03em] leading-[1.2] max-md:text-[26px]">
            Monitoring.
          </h1>
          <p className="text-muted dark:text-fog mt-1.5">
            Prometheus metrics · Alertmanager alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Server size={14} className="text-muted dark:text-fog" />
          <Activity size={14} className="text-muted dark:text-fog" />
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-line dark:border-edge">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px cursor-pointer bg-transparent transition-colors ${
              tab === t.id
                ? "border-accent dark:border-ember text-ink dark:text-bone"
                : "border-transparent text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <MonitoringDashboardTab />}
      {tab === "alerts" && <MonitoringAlertsTab />}
      {tab === "targets" && <MonitoringTargetsTab />}
      {tab === "silences" && <MonitoringSilencesTab />}
      {tab === "metrics" && <MonitoringMetricsTab />}
    </main>
  );
}

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Activity,
  ArrowRight,
  Clock,
  Plus,
  Radar,
  Radio,
  RefreshCw,
  Rocket,
  Ship,
} from "lucide-react";
import { fmtDuration, greeting, todayLong } from "../../lib/format";
import { useAuth } from "../../stores/store";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Meter } from "../../components/ui/Meter";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { ProjectDrawer } from "../../components/ProjectDrawer";
import { DiscoveryModal } from "../../components/DiscoveryModal";
import { CreateShipModal } from "../../components/CreateShipModal";
import { RecentLaunches } from "../../components/RecentLaunches";
import { ShipCard } from "../../components/ShipCard";
import { StatShell, HealthRow } from "../../components/StatShell";
import { SubOrbitalFeed } from "../../components/SubOrbitalFeed";
import { useDashboard } from "../../hooks/useDashboard";

// Fleet preview stays compact; the full registry lives on the Fleet page.
export const FLEET_PREVIEW_LIMIT = 6;

// Dashboard shell: masthead, stat tiles, fleet preview, launches table and
// sub-orbital feed. Data, live events and modal state come from useDashboard;
// sections live in their own files.
export function DashboardPage({
  setOnline,
}: {
  setOnline: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();

  const {
    data,
    loading,
    feed,
    servicesByProject,
    load,
    clearFeed,
    wipeHistory,
    showCreate,
    setShowCreate,
    showScan,
    setShowScan,
    confirmWipe,
    setConfirmWipe,
    projectById,
    recentByProject,
    deployStats,
    healthLine,
    docked,
  } = useDashboard(setOnline);

  // Opened from the command palette ("Scan shipyard" action).
  useEffect(() => {
    if (params.get("scan") !== null) {
      // Intentional: consume the one-shot ?scan URL param on mount.
      setShowScan(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams, setShowScan]);

  const selectedId = params.get("project");
  const selected = selectedId
    ? (projectById.get(Number(selectedId)) ?? null)
    : null;

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="w-full max-w-7xl mx-auto px-10 max-md:px-4 pt-24 pb-36">
      {/* masthead */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          {/* <div className="flex items-center gap-2 flex-wrap text-accent-deep dark:text-ember mb-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-accent-deep dark:bg-ember" />
            <Kicker>Bridge console · Station 04</Kicker>
          </div> */}
          <h1 className="font-head text-[32px] capitalize font-bold tracking-[-0.03em] leading-[1.2] max-md:text-[26px]">
            {greeting()}, {user?.username ?? "Captain"}.
          </h1>
          <p className="text-muted dark:text-fog mt-1.5">
            {todayLong()} <span className="mx-1.5">•</span> {healthLine}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss"
            onClick={() => void load()}
          >
            <RefreshCw size={14} /> Run Diagnostics
          </button>
          <button
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} /> New Dispatch
          </button>
        </div>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mt-5">
        <StatShell
          kicker="Server load"
          icon={<Activity size={15} />}
          foot={
            <span>
              {data.dockerAvailable
                ? "Shipyard connected"
                : "Shipyard unreachable"}
            </span>
          }
          onClick={() => nav("/telemetry")}
        >
          <Meter
            label="CPU"
            pct={data.server.cpuPercent}
            display={`${Math.round(data.server.cpuPercent)}%`}
          />
          <Meter
            label="RAM"
            pct={data.server.memPercent}
            display={`${Math.round(data.server.memPercent)}%`}
          />
          <Meter
            label="Disk"
            pct={data.server.diskPercent}
            display={`${Math.round(data.server.diskPercent)}%`}
          />
        </StatShell>

        <StatShell
          kicker="Fleet"
          icon={<Ship size={15} />}
          foot={<span>{data.counts.services} stations crewed</span>}
        >
          <div className="flex items-center gap-2 flex-wrap items-baseline mt-2">
            <span className="font-head text-[34px] font-bold">
              {data.counts.projects}
            </span>
            <span className="text-muted dark:text-fog">ships active</span>
          </div>
          <div className="text-muted dark:text-fog text-xs mt-1.5">
            <span className="font-mono">{docked}</span> idle in shipyard
          </div>
        </StatShell>

        <StatShell
          kicker="Deploys"
          icon={<Rocket size={15} />}
          foot={
            <>
              <span>
                Avg duration:{" "}
                {deployStats.avg !== undefined
                  ? fmtDuration(deployStats.avg)
                  : "—"}
              </span>
              <Clock size={13} />
            </>
          }
        >
          <div className="flex items-center gap-2 flex-wrap items-baseline mt-2">
            <span className="font-head text-[34px] font-bold">
              {data.counts.deployments}
            </span>
            <span className="text-muted dark:text-fog">launches logged</span>
          </div>
          <div className="text-muted dark:text-fog text-xs mt-1.5">
            <span className="font-mono">{deployStats.todayCount}</span> today ·{" "}
            <span className="font-mono">{deployStats.rate}%</span> success rate
          </div>
        </StatShell>

        <StatShell
          kicker="Fleet health"
          icon={<Radio size={15} />}
          foot={<span>Heartbeat: 30s</span>}
        >
          <div className="flex flex-col gap-2 mt-2">
            <HealthRow
              label="Sailing"
              count={data.counts.healthy}
              tag="NOMINAL"
              pip="bg-moss"
            />
            <HealthRow
              label="Choppy"
              count={data.counts.degraded}
              tag={data.counts.degraded ? "WATCH" : "CALM"}
              pip="bg-status-amber"
            />
            <HealthRow
              label="Lost signal"
              count={data.counts.down}
              tag={data.counts.down ? "ALERT" : "NONE"}
              pip="bg-brick"
            />
          </div>
        </StatShell>
      </div>

      {/* fleet */}
      <div className="flex items-center justify-between gap-4 mt-8 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-head text-[22px] font-bold tracking-[-0.02em]">
            Fleet
          </h2>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            {data.projects.length} Active Units
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
            onClick={() => setShowScan(true)}
          >
            <Radar size={13} /> Scan
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={13} /> New Ship
          </button>
        </div>
      </div>
      {data.projects.length === 0 ? (
        <EmptyState
          title="No ships in the fleet yet"
          hint="Dispatch your first project to see it charted here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.projects.slice(0, FLEET_PREVIEW_LIMIT).map((p) => (
              <ShipCard
                key={p.id}
                project={p}
                services={servicesByProject[p.id] ?? []}
                last={recentByProject.get(p.id)}
                onOpen={() => setParams({ project: String(p.id) })}
              />
            ))}
          </div>
          {data.projects.length > FLEET_PREVIEW_LIMIT && (
            <div className="flex justify-center mt-5">
              <button
                className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer border whitespace-nowrap transition-colors duration-150 bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-4 py-2 text-[13px]"
                onClick={() => nav("/fleet")}
              >
                View all {data.projects.length} ships <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* recent launches */}
      <RecentLaunches
        data={data}
        projectById={projectById}
        onWipe={() => setConfirmWipe(true)}
      />

      {/* telemetry card — sub-orbital feed (live TTY on the audit bus) */}
      <SubOrbitalFeed feed={feed} onClear={clearFeed} />

      {showCreate && (
        <CreateShipModal
          onClose={() => setShowCreate(false)}
          onCreated={() => void load()}
        />
      )}

      {showScan && (
        <DiscoveryModal
          onClose={() => setShowScan(false)}
          onImported={() => void load()}
        />
      )}

      {selected && (
        <ProjectDrawer
          project={selected}
          onClose={() => setParams({})}
          onChanged={() => void load()}
        />
      )}

      {confirmWipe && (
        <ConfirmModal
          title="Wipe deployment history?"
          body="This deletes every recorded launch. Projects, services and secrets are untouched. This cannot be undone."
          confirmLabel="Wipe history"
          requireText="WIPE"
          onClose={() => setConfirmWipe(false)}
          onConfirm={() => void wipeHistory()}
        />
      )}
    </main>
  );
}

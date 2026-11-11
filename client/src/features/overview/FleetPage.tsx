import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Play, Power, RotateCcw, Trash2, X } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import type { DashboardData } from "../../lib/types/dashboard";
import type { Deployment, Project, Service } from "../../lib/types/projects";
import { toFleetStatus, type FleetStatus } from "../../lib/types/status";
import { useUi } from "../../stores/store";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Kicker } from "../../components/ui/Kicker";
import { Page } from "../../components/ui/Page";
import { PageHeader } from "../../components/ui/PageHeader";
import { RegistryToolbar, type RegistryView } from "../../components/ui/RegistryToolbar";
import { ProjectDrawer } from "../../components/ProjectDrawer";
import { ShipCard } from "../../components/ShipCard";
import { ShipTable } from "../../components/ShipTable";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

type BulkAction = "start" | "stop" | "restart";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "sailing", label: "Sailing" },
  { value: "choppy", label: "Choppy" },
  { value: "lost", label: "Lost signal" },
  { value: "docked", label: "Docked" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "status", label: "Status" },
  { value: "stations-desc", label: "Most stations" },
  { value: "launch-desc", label: "Recently launched" },
];

const STATUS_RANK: Record<FleetStatus, number> = {
  sailing: 0,
  choppy: 1,
  lost: 2,
  docked: 3,
};

// Full fleet registry: every registered ship in one place with search,
// status filter, sort and card/table views. Cards and rows open the same
// details drawer as the dashboard preview. Tick entries to run one lifecycle
// action across many ships at once.
export function FleetPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  useDocumentTitle("Fleet Registry");
  const pushToast = useUi((s) => s.pushToast);
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [servicesByProject, setServicesByProject] = useState<Record<number, Service[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [view, setView] = useState<RegistryView>("cards");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [pendingBulk, setPendingBulk] = useState<BulkAction | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const dash = await api.dashboard();
      setData(dash);
      setOnline(true);
      const entries = await Promise.all(
        dash.projects.map(async (p) => {
          try {
            const s = await api.services(p.id);
            return [p.id, s] as const;
          } catch {
            return [p.id, []] as const;
          }
        }),
      );
      setServicesByProject(Object.fromEntries(entries));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setOnline(true);
      } else {
        setOnline(false);
      }
    } finally {
      setLoading(false);
    }
  }, [setOnline]);

  useEffect(() => {
    // Intentional: fetch-on-mount effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const projectById = useMemo(() => {
    const m = new Map<number, Project>();
    data?.projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [data]);

  const selectedId = params.get("project");
  const selected = selectedId ? (projectById.get(Number(selectedId)) ?? null) : null;

  const recentByProject = useMemo(() => {
    const m = new Map<number, Deployment>();
    data?.recentDeployments.forEach((d) => {
      if (!m.has(d.projectId)) m.set(d.projectId, d);
    });
    return m;
  }, [data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = (data?.projects ?? []).filter((p) => {
      if (status !== "all" && toFleetStatus(p.status) !== status) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        (p.repository ?? "").toLowerCase().includes(needle) ||
        (p.environment ?? "").toLowerCase().includes(needle)
      );
    });

    const launchedAt = (p: Project) => {
      const d = recentByProject.get(p.id);
      return d ? new Date(d.startedAt).getTime() : 0;
    };

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "status":
          return STATUS_RANK[toFleetStatus(a.status)] - STATUS_RANK[toFleetStatus(b.status)];
        case "stations-desc":
          return (servicesByProject[b.id]?.length ?? 0) - (servicesByProject[a.id]?.length ?? 0);
        case "launch-desc":
          return launchedAt(b) - launchedAt(a);
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [data, q, status, sort, recentByProject, servicesByProject]);

  const togglePick = (id: number) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickedShips = useMemo(
    () => (data?.projects ?? []).filter((p) => picked.has(p.id)),
    [data, picked],
  );

  const runBulk = async (action: BulkAction, confirm: boolean) => {
    setBulkBusy(true);
    try {
      const r = await api.bulkLifecycle([...picked], action, confirm);
      const verb = action === "start" ? "started" : action === "stop" ? "stopped" : "restarted";
      pushToast(
        r.failed === 0
          ? `${r.succeeded} ship${r.succeeded === 1 ? "" : "s"} ${verb}.`
          : `${r.succeeded}/${r.succeeded + r.failed} ${verb} — ${r.failed} failed.`,
        r.failed > 0,
      );
      setPendingBulk(null);
      setPicked(new Set());
      await load();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Bulk action failed", true);
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkDelete = async () => {
    setBulkBusy(true);
    let count = 0;
    try {
      for (const id of picked) {
        try {
          await api.deleteProject(id);
          count++;
        } catch {
          /* continue deleting other projects */
        }
      }
      pushToast(`Deleted ${count} ship${count === 1 ? "" : "s"} from fleet.`);
      setPicked(new Set());
      setConfirmBulkDelete(false);
      await load();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Bulk delete failed", true);
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const allPicked = filtered.length > 0 && filtered.every((p) => picked.has(p.id));

  return (
    <Page width="wide">
      <PageHeader
        className="mb-5"
        back={{ label: "Dashboard", onClick: () => nav("/") }}
        title="Fleet registry"
        subtitle={
          <Kicker>
            {filtered.length} of {data.projects.length} ships
          </Kicker>
        }
      />

      <RegistryToolbar
        search={q}
        onSearch={setQ}
        placeholder="Filter ships by name, repo or environment…"
        status={status}
        onStatus={setStatus}
        statusOptions={STATUS_OPTIONS}
        sort={sort}
        onSort={setSort}
        sortOptions={SORT_OPTIONS}
        view={view}
        onView={setView}
      />

      {picked.size > 0 && (
        <div className="sticky top-16 z-30 bg-white dark:bg-panel border border-line dark:border-edge rounded-card px-4 py-3 mt-1 mb-4 flex items-center gap-2 flex-wrap shadow-chrome">
          <span className="font-mono text-[13px] text-ink dark:text-bone font-medium">
            {picked.size} ship{picked.size === 1 ? "" : "s"} picked
          </span>
          <span className="flex-1" />
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
            disabled={bulkBusy}
            onClick={() => void runBulk("start", false)}
          >
            <Play size={12} /> Wake all
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
            disabled={bulkBusy}
            onClick={() => setPendingBulk("stop")}
          >
            <Power size={12} /> Nap all
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
            disabled={bulkBusy}
            onClick={() => setPendingBulk("restart")}
          >
            <RotateCcw size={12} /> Restart all
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-input font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border border-line dark:border-edge text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 px-3 py-1.5 text-xs"
            disabled={bulkBusy}
            onClick={() => setConfirmBulkDelete(true)}
          >
            <Trash2 size={12} /> Delete all
          </button>
          <button
            className="inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-muted dark:text-fog hover:text-ink dark:hover:text-bone text-xs px-1"
            onClick={() => setPicked(new Set())}
            aria-label="Clear selection"
          >
            <X size={13} /> Clear
          </button>
        </div>
      )}

      <div>
        {filtered.length === 0 ? (
          <EmptyState
            title={data.projects.length === 0 ? "No ships in the fleet yet" : "No ships match"}
            hint={
              data.projects.length === 0
                ? "New Docker finds auto-register on dashboard load."
                : "Try a different search, status or sort."
            }
          />
        ) : (
          <>
            <label className="flex items-center gap-2 text-[13px] mb-3 cursor-pointer select-none text-muted dark:text-fog">
              <input
                type="checkbox"
                checked={allPicked}
                onChange={() =>
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (allPicked) {
                      filtered.forEach((p) => next.delete(p.id));
                    } else {
                      filtered.forEach((p) => next.add(p.id));
                    }
                    return next;
                  })
                }
              />
              Select all {filtered.length} in view
            </label>

            {view === "table" ? (
              <ShipTable
                projects={filtered}
                servicesByProject={servicesByProject}
                recentByProject={recentByProject}
                picked={picked}
                onTogglePick={togglePick}
                onOpen={(p) => setParams({ project: String(p.id) })}
              />
            ) : (
              <div className="grid-cards">
                {filtered.map((p) => (
                  <ShipCard
                    key={p.id}
                    project={p}
                    services={servicesByProject[p.id] ?? []}
                    last={recentByProject.get(p.id)}
                    onOpen={() => setParams({ project: String(p.id) })}
                    selection={{ checked: picked.has(p.id), onToggle: () => togglePick(p.id) }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <ProjectDrawer
          project={selected}
          onClose={() => setParams({})}
          onChanged={() => void load()}
        />
      )}

      {pendingBulk && (
        <ConfirmModal
          title={pendingBulk === "stop" ? `Nap ${picked.size} ships?` : `Restart ${picked.size} ships?`}
          body={`This will ${pendingBulk} every picked ship: ${pickedShips.map((p) => p.name).join(", ")}. Expect blackouts on running traffic.`}
          confirmLabel={pendingBulk === "stop" ? "Nap them" : "Restart them"}
          busy={bulkBusy}
          onClose={() => setPendingBulk(null)}
          onConfirm={() => void runBulk(pendingBulk, true)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmModal
          title={`Delete ${picked.size} ship${picked.size === 1 ? "" : "s"}?`}
          body={`This will remove ${pickedShips.map((p) => p.name).join(", ")} from the ServerHub fleet registry. Local files and running containers are kept.`}
          confirmLabel={bulkBusy ? "Deleting…" : "Delete ships"}
          busy={bulkBusy}
          onClose={() => setConfirmBulkDelete(false)}
          onConfirm={() => void runBulkDelete()}
        />
      )}
    </Page>
  );
}

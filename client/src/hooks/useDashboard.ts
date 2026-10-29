import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import { loadAlertPrefs } from "../lib/alertPrefs";
import { useEvents } from "../lib/useEvents";
import { useUi } from "../stores/store";
import { fleetLabel, toFleetStatus } from "../lib/types/status";
import { type BusEvent } from "../lib/types/logs";
import { type DashboardData } from "../lib/types/dashboard";
import { type Deployment, type Project, type Service } from "../lib/types/projects";
import { type DiscoveryResult } from "../lib/types/discovery";
import { handleBusEvent } from "../utils/dashboardBusEvents";

// Data, live events, feed and modal state for the dashboard page. The page
// shell only composes sections on top of what this hook returns.
export function useDashboard(setOnline: (v: boolean) => void) {
  const pushToast = useUi((s) => s.pushToast);

  const [data, setData] = useState<DashboardData | null>(null);
  const [servicesByProject, setServicesByProject] = useState<
    Record<number, Service[]>
  >({});
  const [feed, setFeed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const prevHealth = useRef<Map<number, string> | null>(null);
  const prevDepIds = useRef<Set<number> | null>(null);
  const prevHot = useRef(false);

  // Browser alerts for health transitions / fresh successful launches /
  // resource pressure, gated by Settings → Alerts toggles. First poll only
  // arms the baselines so it never spams on page load.
  // Declared (and memoized) before `load` so the dependency is stable.
  const notifyTransitions = useCallback(
    (dash: DashboardData) => {
      const prefs = loadAlertPrefs();
      const cur = new Map(
        dash.projects.map((p) => [p.id, toFleetStatus(p.status)]),
      );
      if (prevHealth.current !== null && prefs.healthChanged) {
        for (const [id, st] of cur) {
          const before = prevHealth.current.get(id);
          if (before !== undefined && before !== st && st !== "docked") {
            const name =
              dash.projects.find((p) => p.id === id)?.name ?? `#${id}`;
            pushToast(
              `${name} is ${fleetLabel[st]}.`,
              st === "lost" || st === "choppy",
            );
          }
        }
      }
      prevHealth.current = cur;

      const ids = new Set(dash.recentDeployments.map((d) => d.id));
      if (prevDepIds.current !== null && prefs.deployFinished) {
        for (const d of dash.recentDeployments) {
          if (!prevDepIds.current.has(d.id) && d.status === "SUCCESS") {
            const name =
              dash.projects.find((p) => p.id === d.projectId)?.name ??
              `#${d.projectId}`;
            pushToast(
              `Launch succeeded: ${name} @ ${d.commitSha || "unknown"}.`,
            );
            break;
          }
        }
      }
      prevDepIds.current = ids;

      const hot = dash.server.cpuPercent > 85 || dash.server.memPercent > 85;
      if (hot && !prevHot.current && prefs.highUsage) {
        pushToast("Decks hot — CPU or RAM above 85%.", true);
      }
      prevHot.current = hot;
    },
    [pushToast],
  );

  const load = useCallback(async () => {
    try {
      const [dash, audit] = await Promise.all([api.dashboard(), api.audit(9)]);
      setData(dash);
      setOnline(true);
      setFeed(
        audit.map(
          (a) =>
            `[${(a.timestamp ?? "").slice(11, 19) || "--:--:--"}] ${a.actor} ${a.action} ${a.resource}${a.resourceId ? ` #${a.resourceId}` : ""} → ${a.result}`,
        ),
      );
      notifyTransitions(dash);
      // service chips per ship (best-effort, personal scale)
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
  }, [setOnline, notifyTransitions]);

  // Auto-sync on app load: scan the shipyard once and import everything
  // unregistered, so no Docker find is ever missed and nobody has to click
  // Scan → Import one by one. Silent unless something actually joined.
  // Import-all is idempotent, so re-running on every mount is safe.
  const autoSync = useCallback(async () => {
    try {
      const r: DiscoveryResult = await api.discovery();
      const pending =
        r.projects.filter((p) => !p.registered).length +
        (r.filesystem ?? []).filter((f) => !f.registered).length;
      if (pending === 0) return;
      const res = await api.importAllDiscovered();
      if (res.imported > 0) {
        pushToast(
          `${res.imported} ship${res.imported === 1 ? "" : "s"} auto-registered with ${res.servicesAdded} station${res.servicesAdded === 1 ? "" : "s"}.`,
        );
        await load();
      }
    } catch {
      // Offline, logged out, or Docker unreachable — stay silent;
      // manual Scan and New Ship keep working.
    }
  }, [load, pushToast]);

  useEffect(() => {
    // Intentional: initial load + poll subscription in one mount effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void autoSync();
    const t = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(t);
  }, [load, autoSync]);

  // Live signals: refresh the workbench and toast on deployments,
  // container/project lifecycle, gateway reloads, backups and threshold
  // crossings. Health transitions keep coming through the poll alerts
  // above to respect the Settings toggles without double-notifying.
  useEvents((ev: BusEvent) =>
    handleBusEvent(ev, pushToast, () => void load()),
  );

  // CLEAR button on the telemetry card: wipe the local buffer (the next
  // poll or live event repopulates it).
  const clearFeed = useCallback(() => {
    const ts = new Date().toTimeString().slice(0, 8);
    setFeed([
      `[${ts}] tty::ready — console buffer cleared. Waiting on signal.`,
    ]);
  }, []);

  // Footer button on the launches table: wipe deployment history.
  const wipeHistory = useCallback(async () => {
    try {
      const r = await api.wipeDeployments();
      pushToast(`History wiped. ${r.deleted} entries cleared.`);
      setConfirmWipe(false);
      void load();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Wipe failed", true);
    }
  }, [load, pushToast]);

  const projectById = useMemo(() => {
    const m = new Map<number, Project>();
    data?.projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [data]);

  const recentByProject = useMemo(() => {
    const m = new Map<number, Deployment>();
    data?.recentDeployments.forEach((d) => {
      if (!m.has(d.projectId)) m.set(d.projectId, d);
    });
    return m;
  }, [data]);

  const deployStats = useMemo(() => {
    const list = data?.recentDeployments ?? [];
    const withDur = list.filter(
      (d) => d.durationSec !== undefined && d.durationSec !== null,
    );
    const avg = withDur.length
      ? Math.round(
          withDur.reduce((a, d) => a + (d.durationSec ?? 0), 0) /
            withDur.length,
        )
      : undefined;
    const ok = list.filter((d) => d.status === "SUCCESS").length;
    const rate = list.length ? Math.round((ok / list.length) * 100) : 100;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = list.filter((d) =>
      (d.startedAt ?? "").startsWith(today),
    ).length;
    return { avg, rate, todayCount };
  }, [data]);

  const healthLine = useMemo(() => {
    if (!data) return "Reading the waters…";
    const { healthy, degraded, down } = data.counts;
    if (down > 0)
      return `${down} ship${down === 1 ? "" : "s"} flashing distress`;
    if (degraded > 0) return "Choppy waters on one or more ships";
    if (healthy > 0) return "All systems normal";
    return "No ships reporting yet";
  }, [data]);

  const docked = useMemo(
    () =>
      (data?.projects ?? []).filter(
        (p) => toFleetStatus(p.status) === "docked",
      ).length,
    [data],
  );

  return {
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
  };
}

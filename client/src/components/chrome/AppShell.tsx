import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  BellRing,
  Database,
  LayoutGrid,
  Rocket,
  Search,
  Server,
  Ship,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useUi } from "../../stores/store";
import { useTheme } from "../../lib/useTheme";
import { NetworkStatusWidget, DeckMenu } from "../SystemDeck";
import { Brand } from "./Brand";
import { CommandPalette } from "./CommandPalette";

/* ---------- app shell ---------- */

export function AppShell({ online }: { online: boolean }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { theme, setTheme } = useTheme();
  const { toasts, dismissToast, paletteOpen, setPaletteOpen } = useUi();

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [paletteOpen, setPaletteOpen]);

  const onDock = (path: string) => {
    if (loc.pathname !== path) nav(path);
  };

  const dockBtn = (active: boolean) =>
    `relative w-11 h-11 rounded-full flex items-center justify-center bg-transparent border-0 cursor-pointer hover:bg-paper dark:hover:bg-emboss hover:text-ink dark:hover:text-bone ${
      active ? "text-ink dark:text-bone" : "text-muted dark:text-fog"
    }`;

  return (
    <>
      <Brand />
      <button
        className="bg-white dark:bg-panel border border-line dark:border-edge rounded-full shadow-chrome fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-2 h-[42px] pl-4 pr-2 w-[calc(100vw-9.5rem)] min-w-0 min-[420px]:w-[calc(100vw-12rem)] sm:w-auto sm:min-w-[480px] text-muted dark:text-fog text-[13px] cursor-pointer hover:border-accent dark:hover:border-ember"
        onClick={() => setPaletteOpen(true)}
        aria-label="Search ships, pages, and actions"
      >
        <div className="flex items-center justify-center gap-2.5 min-w-0">
          <Search size={15} className="shrink-0" />
          <span className="truncate hidden min-[420px]:inline">Search ships, actions, or press</span>
          <span className="truncate min-[420px]:hidden">Search…</span>
        </div>

        <span className="hidden sm:flex items-center justify-center font-mono text-[11px] bg-paper dark:bg-abyss border border-line dark:border-edge rounded-md px-2.5 py-1.5 text-muted dark:text-fog">
          ⌘ K
        </span>
      </button>
      <div className="fixed top-3 sm:top-5 right-3 sm:right-6 z-40 flex items-center gap-2">
        <NetworkStatusWidget serverOnline={online} />
        <DeckMenu theme={theme} setTheme={setTheme} />
      </div>

      <Outlet />

      <nav
        className="bg-white dark:bg-panel border border-line dark:border-edge rounded-full shadow-chrome fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 max-w-[calc(100vw-1rem)] overflow-x-auto [padding-bottom:calc(0.5rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Primary"
      >
        <button
          className={dockBtn(loc.pathname === "/")}
          title="Dashboard"
          aria-label="Dashboard"
          onClick={() => onDock("/")}
        >
          <LayoutGrid size={19} />
          {loc.pathname === "/" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname.startsWith("/servers"))}
          title="Servers"
          aria-label="Servers"
          onClick={() => onDock("/servers")}
        >
          <Server size={19} />
          {loc.pathname.startsWith("/servers") && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/alerts")}
          title="Alerts"
          aria-label="Alerts"
          onClick={() => onDock("/alerts")}
        >
          <AlertTriangle size={19} />
          {loc.pathname === "/alerts" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/alert-rules")}
          title="Alert Rules"
          aria-label="Alert Rules"
          onClick={() => onDock("/alert-rules")}
        >
          <BellRing size={19} />
          {loc.pathname === "/alert-rules" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/fleet")}
          title="Fleet"
          aria-label="Fleet"
          onClick={() => onDock("/fleet")}
        >
          <Ship size={19} />
          {loc.pathname === "/fleet" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/databases")}
          title="Databases"
          aria-label="Databases"
          onClick={() => onDock("/databases")}
        >
          <Database size={19} />
          {loc.pathname === "/databases" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/telemetry")}
          title="Telemetry"
          aria-label="Telemetry"
          onClick={() => onDock("/telemetry")}
        >
          <Activity size={19} />
          {loc.pathname === "/telemetry" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/monitoring")}
          title="Monitoring"
          aria-label="Monitoring"
          onClick={() => onDock("/monitoring")}
        >
          <BarChart2 size={19} />
          {loc.pathname === "/monitoring" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
        <button
          className={dockBtn(loc.pathname === "/settings")}
          title="Settings"
          aria-label="Settings"
          onClick={() => onDock("/settings")}
        >
          <SlidersHorizontal size={19} />
          {loc.pathname === "/settings" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
      </nav>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <div className="fixed bottom-24 sm:bottom-6 right-3 sm:right-6 z-[80] flex flex-col gap-2 max-w-[min(360px,calc(100vw-1.5rem))]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl px-4 py-2.5 text-[13px] flex gap-2.5 items-center shadow-chrome ${
              t.bad
                ? "bg-red-900 dark:bg-red-900 text-white dark:text-red-100"
                : "bg-ink dark:bg-bone text-paper dark:text-ink"
            }`}
          >
            {t.bad ? <X size={14} /> : <Rocket size={14} />}
            <span>{t.text}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="bg-transparent border-0 text-inherit cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

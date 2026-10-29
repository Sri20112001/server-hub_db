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
    `relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 bg-transparent border-0 cursor-pointer hover:bg-paper dark:hover:bg-emboss hover:text-ink dark:hover:text-bone transition-all ${
      active ? "text-ink dark:text-bone" : "text-muted dark:text-fog"
    }`;

  return (
    <>
      {/* Unified top bar — flexible layout prevents collisions across mobile, tablet, and desktop */}
      <header className="fixed top-0 inset-x-0 z-40 pointer-events-none px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <div className="pointer-events-auto flex items-center shrink-0">
            <Brand />
          </div>

          {/* Search Action */}
          <div className="pointer-events-auto flex-1 flex justify-center max-w-md min-w-0 mx-2">
            <button
              className="bg-white dark:bg-panel border border-line dark:border-edge rounded-full shadow-chrome flex items-center justify-center sm:justify-between gap-2 h-9 sm:h-[42px] px-2.5 sm:px-4 w-9 sm:w-auto max-w-full text-muted dark:text-fog text-[13px] cursor-pointer hover:border-accent dark:hover:border-ember transition-all"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search ships, pages, and actions"
              title="Search (⌘K)"
            >
              <div className="flex items-center justify-center gap-2 min-w-0">
                <Search size={15} className="shrink-0" />
                <span className="truncate hidden sm:inline">Search ships, actions…</span>
              </div>

              <span className="hidden md:flex items-center justify-center font-mono text-[11px] bg-paper dark:bg-abyss border border-line dark:border-edge rounded-md px-2 py-0.5 text-muted dark:text-fog shrink-0 ml-2">
                ⌘ K
              </span>
            </button>
          </div>

          {/* System status & account */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            <NetworkStatusWidget serverOnline={online} />
            <DeckMenu theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>

      <Outlet />

      <nav
        className="bg-white/95 dark:bg-panel/95 backdrop-blur-md border border-line dark:border-edge rounded-full shadow-chrome fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 max-w-[calc(100vw-1rem)] overflow-x-auto [padding-bottom:calc(0.375rem+env(safe-area-inset-bottom,0px))] sm:[padding-bottom:calc(0.5rem+env(safe-area-inset-bottom,0px))] scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-label="Primary"
      >
        <button
          className={dockBtn(loc.pathname === "/")}
          title="Dashboard"
          aria-label="Dashboard"
          onClick={() => onDock("/")}
        >
          <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <Server className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <BellRing className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <Ship className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <Database className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          {loc.pathname === "/settings" && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent dark:bg-ember" />
          )}
        </button>
      </nav>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-[80] flex flex-col gap-2 max-w-[min(360px,calc(100vw-1.5rem))]">
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

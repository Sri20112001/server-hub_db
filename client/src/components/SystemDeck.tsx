import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Wifi,
  WifiOff,
  Network,
  Signal,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Radio,
  Zap,
} from "lucide-react";

import { useNetwork } from "../lib/useNetwork";
import type { ThemeKey } from "../lib/useTheme";
import { useAuth, useUi } from "../stores/store";

/* ==========================================================================
   Minimal Network Status Widget
   ========================================================================== */
export function NetworkStatusWidget({ serverOnline }: { serverOnline: boolean }) {
  const network = useNetwork();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const isHealthy = network.online && serverOnline;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const renderIcon = () => {
    if (!isHealthy) return <WifiOff size={13} className="text-brick" />;
    switch (network.type) {
      case "ethernet":
        return <Network size={13} className="text-moss" />;
      case "wifi":
        return <Wifi size={13} className="text-moss" />;
      case "cellular":
        return <Signal size={13} className="text-moss" />;
      case "bluetooth":
        return <Radio size={13} className="text-moss" />;
      default:
        return <Zap size={13} className="text-moss" />;
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Minimal Status Pill */}
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-2 sm:px-3 rounded-full border border-line dark:border-edge bg-white/90 dark:bg-panel/90 hover:bg-white dark:hover:bg-panel backdrop-blur-md shadow-sm flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors text-xs font-mono select-none"
        title={`Network: ${network.label} — click for details`}
        aria-label="Network status"
        aria-expanded={open}
      >
        {/* Status Dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            !isHealthy
              ? "bg-brick"
              : network.statusTone === "amber"
                ? "bg-status-amber"
                : "bg-moss"
          }`}
        />

        {/* Dynamic Protocol Icon */}
        <span className="opacity-90">{renderIcon()}</span>

        {/* Dynamic Network Type */}
        <span className="font-semibold text-ink dark:text-bone uppercase tracking-wide text-[11px] hidden lg:inline">
          {isHealthy ? network.label : "Offline"}
        </span>

        {/* 3-tier Micro Signal Bars */}
        <div className="hidden lg:flex items-end gap-[1.5px] h-2.5 ml-0.5 opacity-80">
          {[1, 2, 3].map((bar) => {
            const active = isHealthy && bar <= Math.min(3, network.signalBars);
            const heights = ["h-1", "h-1.5", "h-2.5"];
            return (
              <span
                key={bar}
                className={`w-[2px] rounded-full ${heights[bar - 1]} ${
                  active ? "bg-moss" : "bg-stone/30 dark:bg-edge"
                }`}
              />
            );
          })}
        </div>
      </button>

      {/* Minimal Telemetry Popover */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-panel border border-line dark:border-edge shadow-xl p-3 flex flex-col gap-2 font-mono text-xs backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-line dark:border-edge text-[10px] text-muted dark:text-fog uppercase tracking-wider font-semibold">
            <span>Link Telemetry</span>
            <span className={isHealthy ? "text-moss font-bold" : "text-brick font-bold"}>
              {isHealthy ? "Connected" : "Severed"}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted dark:text-fog">Type:</span>
              <span className="text-ink dark:text-bone font-medium uppercase">{network.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted dark:text-fog">Latency:</span>
              <span className="text-ink dark:text-bone font-medium">
                {network.rtt ? `${network.rtt} ms` : "< 30 ms"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted dark:text-fog">Speed:</span>
              <span className="text-ink dark:text-bone font-medium">
                {network.downlink ? `${network.downlink} Mb/s` : "Broadband"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted dark:text-fog">Server:</span>
              <span className={serverOnline ? "text-moss font-medium" : "text-brick font-medium"}>
                {serverOnline ? "Sync" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Minimal Unified System & Theme Menu
   ========================================================================== */
export function DeckMenu({
  theme,
  setTheme,
}: {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuth();
  const pushToast = useUi((s) => s.pushToast);
  const nav = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      pushToast("Signed out. Fair winds.");
      nav("/login");
    } catch {
      pushToast("Signed out. Fair winds.");
      nav("/login");
    }
  };

  const isDark = theme === "cyberdeck";

  const toggleTheme = () => {
    setTheme(isDark ? "workbench" : "cyberdeck");
  };

  return (
    <div className="relative" ref={ref}>
      {/* Minimal Trigger Pill */}
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-2 sm:px-2.5 rounded-full border border-line dark:border-edge bg-white/90 dark:bg-panel/90 hover:bg-white dark:hover:bg-panel backdrop-blur-md shadow-sm flex items-center gap-2 cursor-pointer transition-colors text-xs select-none"
        title="Account & Theme menu"
        aria-label="Account and theme menu"
        aria-expanded={open}
      >
        {/* User Avatar Circle */}
        <span className="w-5 h-5 rounded-full bg-accent-deep dark:bg-ember text-white dark:text-black font-semibold text-[10px] flex items-center justify-center">
          {user?.username ? user.username.slice(0, 1).toUpperCase() : "C"}
        </span>

        {/* Theme mode preview icon */}
        <span className="text-muted dark:text-fog">
          {theme === "cyberdeck" ? <Moon size={12} /> : <Sun size={12} />}
        </span>

        {/* Username */}
        <span className="font-mono text-xs text-ink dark:text-bone hidden lg:inline font-medium">
          {user?.username ?? "Captain"}
        </span>

        <ChevronDown
          size={12}
          className={`text-muted dark:text-fog transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Minimal Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-60 rounded-xl bg-white dark:bg-panel border border-line dark:border-edge shadow-xl p-2 flex flex-col gap-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 text-xs font-body">
          {/* User Account Info */}
          <div className="px-2 py-1.5 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-mono font-semibold text-ink dark:text-bone truncate">
                {user?.username ?? "Captain"}
              </div>
              <div className="text-[10px] text-muted dark:text-fog font-mono uppercase tracking-wider">
                {user?.role ?? "Operator"}
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-moss" title="Session active" />
          </div>

          <div className="h-px bg-line/60 dark:bg-edge/60 my-0.5" />

          {/* Minimal Inline Segmented Theme Selector */}
          <div className="flex items-center justify-between w-full px-1 py-0.5">
            <div className="text-[10px] font-semibold text-muted dark:text-fog uppercase tracking-wider mb-1 px-1">
              Theme
            </div>
<button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="relative flex items-center h-6 w-11 p-0.5 rounded-full bg-paper dark:bg-abyss border border-line dark:border-edge transition-colors cursor-pointer focus:outline-none"
    >
      {/* Sliding Knob */}
      <span
        className={`flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-panel shadow-sm transition-transform duration-200 ease-in-out ${
          isDark ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon size={10} className="text-ember" />
        ) : (
          <Sun size={10} className="text-accent" />
        )}
      </span>
    </button>
          </div>

          <div className="h-px bg-line/60 dark:bg-edge/60 my-0.5" />

          {/* Settings Shortcut */}
          {/* <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss transition-colors no-underline text-xs"
          >
            <SlidersHorizontal size={13} className="text-muted dark:text-fog" />
            <span>Settings</span>
          </Link> */}

          <div className="h-px bg-line/60 dark:bg-edge/60 my-0.5" />

          {/* Minimal Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brick dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  BellRing,
  ClipboardList,
  Database,
  FolderGit2,
  LayoutGrid,
  Radar,
  Server,
  Ship,
  SlidersHorizontal,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Project } from "../../lib/types/projects";

/* ---------- command palette ---------- */

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    api
      .projects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pages = [
      {
        icon: <LayoutGrid size={15} />,
        title: "Go to Dashboard",
        sub: "page",
        run: () => nav("/"),
      },
      {
        icon: <Ship size={15} />,
        title: "View all ships",
        sub: "page",
        run: () => nav("/fleet"),
      },
      {
        icon: <Database size={15} />,
        title: "Browse databases",
        sub: "page",
        run: () => nav("/databases"),
      },
      {
        icon: <Activity size={15} />,
        title: "View Host Telemetry",
        sub: "page",
        run: () => nav("/telemetry"),
      },
      {
        icon: <BarChart2 size={15} />,
        title: "Monitoring",
        sub: "page",
        run: () => nav("/monitoring"),
      },
      {
        icon: <Server size={15} />,
        title: "Managed Servers",
        sub: "page",
        run: () => nav("/servers"),
      },
      {
        icon: <AlertTriangle size={15} />,
        title: "Alerts",
        sub: "page",
        run: () => nav("/alerts"),
      },
      {
        icon: <BellRing size={15} />,
        title: "Alert Rules",
        sub: "page",
        run: () => nav("/alert-rules"),
      },
      {
        icon: <Activity size={15} />,
        title: "Health Checks",
        sub: "page",
        run: () => nav("/health-checks"),
      },
      {
        icon: <ClipboardList size={15} />,
        title: "Audit Log",
        sub: "page",
        run: () => nav("/audit"),
      },
      {
        icon: <SlidersHorizontal size={15} />,
        title: "Go to Settings",
        sub: "page",
        run: () => nav("/settings"),
      },
      {
        icon: <Radar size={15} />,
        title: "Scan shipyard",
        sub: "action",
        run: () => nav("/?scan=1"),
      },
    ];
    const ships = projects.map((p) => ({
      icon: <FolderGit2 size={15} />,
      title: p.name,
      sub: "open ship",
      run: () => nav(`/?project=${p.id}`),
    }));
    const all = [...pages, ...ships];
    if (!needle) return all;
    return all.filter((i) => i.title.toLowerCase().includes(needle));
  }, [q, projects, nav]);

  const choose = useCallback(
    (i: number) => {
      const item = items[i];
      if (!item) return;
      onClose();
      item.run();
    },
    [items, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[8dvh] sm:pt-[12vh] bg-[rgba(28,25,23,0.28)] dark:bg-[rgba(0,0,0,0.55)] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-white dark:bg-panel border border-line dark:border-edge rounded-card overflow-hidden shadow-chrome my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="w-full outline-none text-[15px] px-5 py-4 border-x-0 border-t-0 border-b border-line dark:border-edge bg-white dark:bg-panel text-ink dark:text-bone"
          placeholder="Search ships, pages, actions…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, items.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            }
            if (e.key === "Enter") choose(sel);
          }}
        />
        <div className="max-h-[50dvh] sm:max-h-[320px] overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="p-4 text-muted dark:text-fog text-[13px]">
              Nothing on this heading.
            </div>
          )}
          {items.map((item, i) => (
            <button
              key={`${item.sub}-${item.title}`}
              className={`flex items-center gap-3 w-full text-left bg-transparent border-0 cursor-pointer px-3 py-2.5 rounded-[10px] text-[13px] text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss ${
                i === sel ? "bg-paper dark:bg-emboss" : ""
              }`}
              onMouseEnter={() => setSel(i)}
              onClick={() => choose(i)}
            >
              <span className="text-muted dark:text-fog flex">{item.icon}</span>
              {item.title}
              <span className="text-muted dark:text-fog text-xs ml-auto">
                {item.sub}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

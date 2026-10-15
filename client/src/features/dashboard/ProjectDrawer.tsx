import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Trash2, X } from "lucide-react";
import type { Project } from "../../lib/types";
import { ConfirmModal, Kicker, StatusPill } from "../../components/ui";
import { useProjectDetails } from "./useProjectDetails";
import { api } from "../../lib/api";
import { useUi } from "../../stores/store";

// Slim summary drawer: identity, key facts and counts only. The full
// manifest (helm, stations, logs, launches, vault, snapshots) lives on the
// project details page behind "View details".
export function ProjectDrawer({
  project,
  onClose,
  onChanged,
}: {
  project: Project;
  onClose: () => void;
  onChanged: () => void;
}) {
  const nav = useNavigate();
  const d = useProjectDetails(project, onChanged);
  const pushToast = useUi((s) => s.pushToast);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.deleteProject(project.id);
      pushToast(`Ship "${project.name}" deleted from fleet.`);
      setConfirmDelete(false);
      onClose();
      onChanged();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to delete ship", true);
    } finally {
      setDeleteBusy(false);
    }
  };

  const facts: Array<[string, string]> = [
    ["Repository", project.repository || "—"],
    ["Branch", project.branch || "—"],
    ["Environment", project.environment || "—"],
    ["Status", project.status || "—"],
    ["Auto-deploy", project.autoDeploy ? "ON — webhook steers" : "OFF — manual helm"],
  ];

  const counts: Array<[string, number]> = [
    ["Stations", d.services.length],
    ["Launches", d.deployments.length],
    ["Secrets sealed", d.secrets.length],
    ["Snapshots", d.backups.length],
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-[rgba(28,25,23,0.28)] dark:bg-[rgba(0,0,0,0.55)]"
      onClick={onClose}
    >
      <aside
        className="bg-paper dark:bg-abyss border-l border-line dark:border-edge w-full sm:max-w-[440px] h-[100dvh] overflow-y-auto px-4 sm:px-6 pt-6 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <Kicker>Ship manifest</Kicker>
            <h2 className="text-[24px] mt-1 text-ink dark:text-bone">{project.name}</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={project.status} />
            <button className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-4 shadow-sm">
          <Kicker>Rigging</Kicker>
          <div className="mt-2.5 flex flex-col gap-4">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 text-[13px]">
                <span className="text-muted dark:text-fog">{k}</span>
                <span className="font-mono text-right max-w-[60%] overflow-hidden text-ellipsis text-ink dark:text-bone" title={v}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-4 shadow-sm">
          <Kicker>Manifest</Kicker>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            {counts.map(([k, v]) => (
              <div key={k} className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3">
                <div className="font-head text-[22px] font-bold text-ink dark:text-bone">{v}</div>
                <div className="text-muted dark:text-fog text-xs mt-0.5">{k}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-input text-[13px] font-medium px-4 py-2.5 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover w-full shadow-sm"
            onClick={() => {
              onClose();
              nav(`/projects/${project.id}`);
            }}
          >
            View details <ArrowRight size={14} />
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-brick/40 text-brick hover:bg-brick hover:text-white transition-colors w-full"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={13} /> Delete ship
          </button>
        </div>

        {confirmDelete && (
          <ConfirmModal
            title={`Delete ship "${project.name}"?`}
            body="This will remove the project registration from ServerHub. Underlying files and containers are kept intact."
            confirmLabel={deleteBusy ? "Deleting…" : "Delete ship"}
            busy={deleteBusy}
            onClose={() => setConfirmDelete(false)}
            onConfirm={handleDelete}
          />
        )}
      </aside>
    </div>
  );
}

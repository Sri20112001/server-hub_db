import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import type { Project } from "../lib/types/projects";
import { useUi } from "../stores/store";
import { ConfirmModal } from "./ui/ConfirmModal";
import { Kicker } from "./ui/Kicker";
import { StatusPill } from "./ui/StatusPill";
import { TerminalModal } from "./TerminalModal";
import { EditShipModal } from "./EditShipModal";
import { DeployProgress } from "./DeployProgress";
import { useProjectDetails } from "../hooks/useProjectDetails";
import { ProjectHelmActions } from "./ProjectHelmActions";
import { ProjectRigging } from "./ProjectRigging";
import { ProjectStationsTable } from "./ProjectStationsTable";
import { ProjectLiveLogs } from "./ProjectLiveLogs";
import { ProjectLaunchLog } from "./ProjectLaunchLog";
import { ProjectVault } from "./ProjectVault";
import { ProjectSnapshots } from "./ProjectSnapshots";
import { ProjectConfirmModals } from "./ProjectConfirmModals";

// Composed ship manifest: header, helm, rigging, stations, logs, launches,
// vault and snapshots, plus the terminal / progress / edit / delete chrome.
export function ProjectDetailsBody({
  project,
  onBack,
  onChanged,
}: {
  project: Project;
  onBack: () => void;
  onChanged: () => void;
}) {
  const pushToast = useUi((s) => s.pushToast);
  const d = useProjectDetails(project, onChanged);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleDeleteProject = async () => {
    setDeleteBusy(true);
    try {
      await api.deleteProject(project.id);
      pushToast(`Ship "${project.name}" deleted from fleet.`);
      onBack();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to delete ship", true);
    } finally {
      setDeleteBusy(false);
      setConfirmDeleteProject(false);
    }
  };

  return (
    <main className="w-full max-w-5xl mx-auto px-10 max-md:px-4 pt-24 pb-36">
      <button
        className="inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-muted dark:text-fog hover:text-ink dark:hover:text-bone text-[13px] mb-2 px-0"
        onClick={onBack}
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Kicker>Ship manifest</Kicker>
          <h1 className="font-head text-[32px] font-bold tracking-[-0.03em] leading-[1.2] max-md:text-[26px] mt-1">
            {project.name}
          </h1>
        </div>
        <StatusPill status={project.status} />
      </div>

      <ProjectHelmActions
        d={d}
        onEdit={() => setShowEdit(true)}
        onDelete={() => setConfirmDeleteProject(true)}
      />
      <ProjectRigging project={project} />
      <ProjectStationsTable d={d} />
      <ProjectLiveLogs d={d} />
      <ProjectLaunchLog d={d} />
      <ProjectVault d={d} />
      <ProjectSnapshots d={d} />

      {d.showTerminal && (
        <TerminalModal
          projectName={project.name}
          services={d.services}
          onClose={() => d.setShowTerminal(false)}
        />
      )}

      {d.progress && (
        <DeployProgress
          projectName={project.name}
          operationId={d.progress.id}
          onClose={() => d.setProgress(null)}
          onDone={() => {
            onChanged();
            void d.refreshLists();
          }}
        />
      )}

      <ProjectConfirmModals d={d} projectName={project.name} />

      {showEdit && (
        <EditShipModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={(saved) => {
            setShowEdit(false);
            pushToast(`Ship "${saved.name}" refitted.`);
            onChanged();
          }}
        />
      )}
      {confirmDeleteProject && (
        <ConfirmModal
          title={`Delete ship "${project.name}"?`}
          body="This will remove the project registration from the fleet registry. Any running containers and project files on disk are preserved."
          confirmLabel={deleteBusy ? "Deleting…" : "Delete ship"}
          busy={deleteBusy}
          onClose={() => setConfirmDeleteProject(false)}
          onConfirm={() => void handleDeleteProject()}
        />
      )}
    </main>
  );
}

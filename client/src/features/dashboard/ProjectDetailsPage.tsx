import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import type { Project } from "../../lib/types/projects";
import { useUi } from "../../stores/store";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProjectDetailsBody } from "./ProjectDetailsBody";

// Project details shell: loads the ship from the route id, renders the
// not-found / skeleton states, then hands off to ProjectDetailsBody.
export function ProjectDetailsPage({ setOnline }: { setOnline: (v: boolean) => void }) {
  const { id } = useParams();
  const nav = useNavigate();
  const pushToast = useUi((s) => s.pushToast);
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);

  const reload = async () => {
    try {
      const p = await api.project(Number(id));
      setProject(p);
      setOnline(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
      else pushToast(e instanceof Error ? e.message : "Could not load ship", true);
    }
  };

  useEffect(() => {
    // Intentional: refetch when the route id changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const goBack = () => {
    if (window.history.length > 1) nav(-1);
    else nav("/");
  };

  if (missing) {
    return (
      <main className="w-full max-w-7xl mx-auto px-10 max-md:px-4 pt-24 pb-36">
        <EmptyState title="Ship not found" hint="It may have been deleted." />
        <div className="flex justify-center mt-4">
          <button
            className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss"
            onClick={() => nav("/")}
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!project) {
    return <DashboardSkeleton />;
  }

  return <ProjectDetailsBody key={project.id} project={project} onBack={goBack} onChanged={() => void reload()} />;
}

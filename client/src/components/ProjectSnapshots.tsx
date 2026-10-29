import { Archive, Download, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { Kicker } from "./ui/Kicker";
import { EmptyState } from "./ui/EmptyState";
import type { ProjectDetails } from "../hooks/useProjectDetails";

// Snapshots card: create, download, restore and delete deployment backups.
export function ProjectSnapshots({ d }: { d: ProjectDetails }) {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 sm:p-5 mt-4">
      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-2 min-[420px]:justify-between mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Archive size={15} />
          <Kicker>Snapshots · {d.backups.length}</Kicker>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
          disabled={d.busy}
          onClick={() => void d.createBackup()}
        >
          <Plus size={12} /> Snapshot now
        </button>
      </div>
      {d.backups.length === 0 ? (
        <EmptyState
          title="No snapshots yet"
          hint="Snapshots tar the deployment directory plus a metadata manifest."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {d.backups.map((b) => (
            <div key={b.id} className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-2 min-[420px]:justify-between text-[13px]">
              <div>
                <div className="font-mono">
                  {new Date(b.createdAt.replace(" ", "T") + "Z").toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="font-mono text-muted dark:text-fog text-[11px]">
                  {(b.sizeBytes / 1024 / 1024).toFixed(1)} MB · {b.status}
                </div>
              </div>
              <span className="flex items-center gap-2 flex-wrap">
                <a
                  href={api.downloadBackupUrl(b.id)}
                  download
                  className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
                  aria-label={`Download snapshot ${b.id}`}
                >
                  <Download size={12} />
                </a>
                <button
                  className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
                  disabled={d.busy}
                  onClick={() => d.setPendingRestore(b)}
                >
                  Restore
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
                  disabled={d.busy}
                  onClick={() => void d.deleteBackup(b.id)}
                  aria-label={`Delete snapshot ${b.id}`}
                >
                  <Trash2 size={12} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

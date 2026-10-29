import { ConfirmModal } from "./ui/ConfirmModal";
import { shortSha } from "../lib/format";
import type { ProjectDetails } from "../hooks/useProjectDetails";

// The three lifecycle confirmation modals driven by the useProjectDetails
// controller: nap/fresh-start, rollback and snapshot restore.
export function ProjectConfirmModals({ d, projectName }: { d: ProjectDetails; projectName: string }) {
  return (
    <>
      {d.pending && (
        <ConfirmModal
          title={d.pending === "stop" ? `Nap “${projectName}”?` : `Fresh-start “${projectName}”?`}
          body={
            d.pending === "stop"
              ? "This stops every container in the ship. Traffic goes dark until you wake it up."
              : "This restarts every container in the ship. Expect a brief blackout."
          }
          confirmLabel={d.pending === "stop" ? "Nap it" : "Fresh-start it"}
          busy={d.busy}
          onClose={() => d.setPending(null)}
          onConfirm={() => void d.runLifecycle(d.pending ?? "stop")}
        />
      )}
      {d.pendingRollback && (
        <ConfirmModal
          title={`Roll back to ${shortSha(d.pendingRollback.commitSha)}?`}
          body="This re-runs docker compose up for that launch's commit and records a new rollback deployment. Current containers will be replaced."
          confirmLabel="Roll back"
          busy={d.busy}
          onClose={() => d.setPendingRollback(null)}
          onConfirm={() => {
            const dep = d.pendingRollback;
            if (dep) void d.rollbackTo(dep);
          }}
        />
      )}
      {d.pendingRestore && (
        <ConfirmModal
          title="Restore this snapshot?"
          body="Live files in the deployment directory will be overwritten with the snapshot contents. Current state is not saved unless you snapshot first."
          confirmLabel="Restore snapshot"
          requireText="RESTORE"
          busy={d.busy}
          onClose={() => d.setPendingRestore(null)}
          onConfirm={() => {
            const b = d.pendingRestore;
            if (b) void d.restoreBackup(b);
          }}
        />
      )}
    </>
  );
}

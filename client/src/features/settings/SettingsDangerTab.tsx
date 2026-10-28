import { TriangleAlert } from "lucide-react";
import type { SettingsController } from "./useSettings";

// Tab 5: irreversible host actions — restart command and history wipe.
export function SettingsDangerTab({ c }: { c: SettingsController }) {
  return (
    <section className="bg-white dark:bg-panel border border-brick/40 rounded-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5 flex-wrap text-brick mb-2">
        <TriangleAlert size={20} />
        <h2 className="text-lg font-bold text-ink dark:text-bone">Danger Zone</h2>
      </div>
      <p className="text-muted dark:text-fog text-[13px] mb-5">
        Irreversible host actions. Proceed with operational clearance.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-brick/30 bg-brick/5 dark:bg-brick/10 flex-wrap">
          <div>
            <div className="font-semibold text-ink dark:text-bone text-sm">Fresh start (Restart ServerHub)</div>
            <div className="text-muted dark:text-fog text-xs mt-0.5">Copy host command to cleanly restart the bridge container.</div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-brick text-brick hover:bg-brick hover:text-white transition-colors"
            onClick={() => c.setConfirmRestart(true)}
          >
            Copy restart command
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-brick/30 bg-brick/5 dark:bg-brick/10 flex-wrap">
          <div>
            <div className="font-semibold text-ink dark:text-bone text-sm">Wipe Deployment History</div>
            <div className="text-muted dark:text-fog text-xs mt-0.5">Purges every past build and launch record. Active services remain running.</div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-brick text-brick hover:bg-brick hover:text-white transition-colors"
            onClick={() => c.setConfirmWipe(true)}
          >
            Wipe deployment logs
          </button>
        </div>
      </div>
    </section>
  );
}

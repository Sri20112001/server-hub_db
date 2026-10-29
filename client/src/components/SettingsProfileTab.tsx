import { Check, Eye, EyeOff, LogOut, Shield } from "lucide-react";
import { Field } from "./ui/Field";
import type { SettingsController } from "../hooks/useSettings";

// Tab 1: operator identity card, session invalidation and password rotation.
export function SettingsProfileTab({ c }: { c: SettingsController }) {
  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-bone">Operator Identity</h2>
            <p className="text-muted dark:text-fog text-[13px]">Manage current operator session and access level.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            NODE-01
          </span>
        </div>

        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-11 h-11 rounded-full bg-tint dark:bg-emboss border border-line dark:border-edge flex items-center justify-center font-head font-bold text-lg text-accent dark:text-ember">
              {(c.user?.username ?? "C").slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-ink dark:text-bone">{c.user?.username ?? "—"}</strong>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                  {c.user?.role ?? "admin"}
                </span>
              </div>
              <div className="font-mono text-muted dark:text-fog text-[11px] mt-0.5">single-operator station · cookie session</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full font-mono text-[11px] bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-moss" /> Auth: Local
          </span>
        </div>

        <div className="mt-5 pt-4 border-t border-line dark:border-edge flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="text-ink dark:text-bone text-sm font-medium">Session Management</div>
            <div className="text-muted dark:text-fog text-xs">Terminate all active operator sessions on other devices.</div>
          </div>
          <button
            type="button"
            onClick={() => c.setConfirmLogoutAll(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-line dark:border-edge text-muted dark:text-fog hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 transition-colors"
          >
            <LogOut size={13} /> Invalidate all sessions
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-bone">Password Rotation</h2>
            <p className="text-muted dark:text-fog text-[13px]">Rotate the account master authentication credential.</p>
          </div>
          <Shield size={18} className="text-muted dark:text-fog" />
        </div>

        <form onSubmit={(e) => void c.changePassword(e)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Current master password">
              <div className="relative">
                <input
                  className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog pr-10 font-mono"
                  type={c.showPw ? "text" : "password"}
                  value={c.current}
                  onChange={(e) => c.setCurrent(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted dark:text-fog bg-transparent border-0 cursor-pointer flex p-1"
                  onClick={() => c.setShowPw((v) => !v)}
                  aria-label="Toggle visibility"
                >
                  {c.showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="New master password">
              <input
                className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                type={c.showPw ? "text" : "password"}
                value={c.next}
                onChange={(e) => c.setNext(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <Field label="Confirm new password">
            <input
              className="w-full bg-paper dark:bg-emboss border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
              type={c.showPw ? "text" : "password"}
              value={c.again}
              onChange={(e) => c.setAgain(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover"
              disabled={c.pwBusy || !c.current || c.next.length < 8 || c.next !== c.again}
            >
              <Check size={14} /> {c.pwBusy ? "Rotating…" : "Save password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

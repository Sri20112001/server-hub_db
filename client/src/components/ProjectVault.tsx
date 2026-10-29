import { Copy, Eye, EyeOff, Plus } from "lucide-react";
import { Kicker } from "./ui/Kicker";
import { EmptyState } from "./ui/EmptyState";
import { Field } from "./ui/Field";
import { useUi } from "../stores/store";
import type { ProjectDetails } from "../hooks/useProjectDetails";

// Vault card: peek/copy/hide secrets and the seal-a-new-secret form.
export function ProjectVault({ d }: { d: ProjectDetails }) {
  const pushToast = useUi((s) => s.pushToast);

  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-4 sm:p-5 mt-4">
      <Kicker>Vault · {d.secrets.length} sealed</Kicker>
      <div className="mt-2.5 flex flex-col gap-3">
        {d.secrets.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[13px]">
            <span className="font-mono break-all">{s.name}</span>
            <span className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
                {s.environment}
              </span>
              {d.revealed[s.id] ? (
                <span className="flex items-center gap-2 flex-wrap">
                  <code className="font-mono text-[11px] bg-paper dark:bg-abyss px-1.5 py-[2px] rounded-md">
                    {d.revealed[s.id].slice(0, 24)}{d.revealed[s.id].length > 24 ? "…" : ""}
                  </code>
                  <button
                    className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs"
                    title="Copy"
                    onClick={() => {
                      void navigator.clipboard.writeText(d.revealed[s.id]);
                      pushToast("Copied to clipboard.");
                    }}
                  >
                    <Copy size={12} />
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs" onClick={() => void d.peek(s.id)} aria-label="Hide">
                    <EyeOff size={12} />
                  </button>
                </span>
              ) : (
                <button className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs" onClick={() => void d.peek(s.id)}>
                  <Eye size={12} /> Peek
                </button>
              )}
            </span>
          </div>
        ))}
        {d.secrets.length === 0 && <EmptyState title="Vault is empty" hint="Seal your first secret below." />}
        <form onSubmit={(e) => void d.addSecret(e)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                value={d.newName}
                onChange={(e) => d.setNewName(e.target.value)}
                placeholder="JWT_SECRET"
              />
            </Field>
            <Field label="Value">
              <input
                className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
                type="password"
                value={d.newValue}
                onChange={(e) => d.setNewValue(e.target.value)}
                placeholder="••••••"
              />
            </Field>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs mt-4"
            disabled={!d.newName.trim() || !d.newValue}
          >
            <Plus size={12} /> Seal secret
          </button>
        </form>
      </div>
    </div>
  );
}

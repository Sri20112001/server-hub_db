import { useState } from "react";
import { api } from "../../lib/api";
import { useUi } from "../../stores/store";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";

// "New Dispatch" form: registers a project (ship) with the bridge. Runtime
// details can be charted afterwards on the project page.
export function CreateShipModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const pushToast = useUi((s) => s.pushToast);
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("main");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.createProject({
        name: name.trim(),
        repository: repository.trim(),
        branch: branch.trim() || "main",
      });
      pushToast(`“${name.trim()}” joined the fleet.`);
      onCreated();
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not register ship");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-[18px] mb-1">New dispatch</h3>
      <p className="text-muted dark:text-fog text-[13px] mb-4">
        Register a vessel with the bridge. Runtime details can be charted
        afterwards.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Ship name">
          <input
            className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nodevault"
            autoFocus
          />
        </Field>
        <Field label="Repository">
          <input
            className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="github.com/acme/nodevault"
          />
        </Field>
        <Field label="Branch">
          <input
            className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </Field>
        {err && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-input px-3 py-2.5 text-[13px]">
            {err}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover"
            disabled={busy || !name.trim()}
          >
            {busy ? "Dispatching…" : "Dispatch ship"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

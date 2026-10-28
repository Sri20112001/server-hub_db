import { useState } from "react";
import { api } from "../../lib/api";
import { useUi } from "../../stores/store";

// Modal form to register a new managed server (name, hostname, IP).
export function AddServerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { pushToast } = useUi();
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [ip, setIp] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createServer({ name: name.trim(), hostname, ipAddress: ip });
      pushToast(`Server "${name}" added`);
      onCreated();
      onClose();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Failed to add server", true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-6 w-full max-w-md shadow-chrome" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-ink dark:text-bone font-bold text-lg mb-4">Add Server</h2>
        <div className="space-y-3">
          <Field label="Name *" value={name} onChange={setName} placeholder="production-api" />
          <Field label="Hostname" value={hostname} onChange={setHostname} placeholder="api.example.com" />
          <Field label="IP Address" value={ip} onChange={setIp} placeholder="192.168.1.10" />
        </div>
        <p className="text-muted dark:text-fog text-xs mt-3">
          After adding, generate an agent token and install the agent on the server.
        </p>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted dark:text-fog hover:text-ink dark:hover:text-bone border border-line dark:border-edge rounded-lg">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !name.trim()}
            className="px-4 py-2 text-sm bg-accent dark:bg-ember text-white dark:text-black font-semibold rounded-lg disabled:opacity-50 hover:bg-accent-hover dark:hover:bg-ember-hover"
          >
            {busy ? "Adding…" : "Add Server"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-muted dark:text-fog text-xs mb-1 block">{label}</label>
      <input
        className="w-full bg-paper dark:bg-panel border border-line dark:border-edge rounded-input px-3 py-2 text-ink dark:text-bone text-sm outline-none focus:border-accent dark:focus:border-ember"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

import { useState } from "react";
import { api } from "../lib/api";
import type { Project } from "../lib/types/projects";
import { Field } from "./ui/Field";
import { Modal } from "./ui/Modal";
import { Toggle } from "./ui/Toggle";

const INPUT =
  "w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog";
const INPUT_MONO = `${INPUT} font-mono`;

const BTN_SECONDARY =
  "inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss";
const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover";

// Edit the ship manifest. Mirrors ProjectHandler.Update on the server, which
// rewrites every editable column in one statement — so the form always
// submits the full field set seeded from the current project.
export function EditShipModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: (saved: Project) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [repository, setRepository] = useState(project.repository ?? "");
  const [branch, setBranch] = useState(project.branch ?? "");
  const [environment, setEnvironment] = useState(project.environment ?? "");
  const [deploymentPath, setDeploymentPath] = useState(project.deploymentPath ?? "");
  const [composeFile, setComposeFile] = useState(project.composeFile ?? "");
  const [gatewayPrefix, setGatewayPrefix] = useState(project.gatewayPrefix ?? "");
  const [healthUrl, setHealthUrl] = useState(project.healthUrl ?? "");
  const [autoDeploy, setAutoDeploy] = useState(project.autoDeploy);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const saved = await api.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        repository: repository.trim(),
        branch: branch.trim(),
        environment: environment.trim(),
        deploymentPath: deploymentPath.trim(),
        composeFile: composeFile.trim(),
        gatewayPrefix: gatewayPrefix.trim(),
        healthUrl: healthUrl.trim(),
        autoDeploy,
      });
      onSaved(saved);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not save changes");
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-[18px] mb-1">Refit “{project.name}”</h3>
      <p className="text-muted dark:text-fog text-[13px] mb-4">
        Update the ship's manifest. Running containers and files on disk are
        untouched.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Ship name">
          <input
            className={INPUT}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="nodevault"
            autoFocus
          />
        </Field>
        <Field label="Description">
          <input
            className={INPUT}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this vessel carry?"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Repository">
            <input
              className={INPUT_MONO}
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="github.com/acme/nodevault"
            />
          </Field>
          <Field label="Branch">
            <input
              className={INPUT_MONO}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </Field>
          <Field label="Environment">
            <input
              className={INPUT_MONO}
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="production"
            />
          </Field>
          <Field label="Compose file">
            <input
              className={INPUT_MONO}
              value={composeFile}
              onChange={(e) => setComposeFile(e.target.value)}
              placeholder="docker-compose.yml"
            />
          </Field>
          <Field label="Deployment path">
            <input
              className={INPUT_MONO}
              value={deploymentPath}
              onChange={(e) => setDeploymentPath(e.target.value)}
              placeholder="/srv/nodevault"
            />
          </Field>
          <Field label="Gateway prefix">
            <input
              className={INPUT_MONO}
              value={gatewayPrefix}
              onChange={(e) => setGatewayPrefix(e.target.value)}
              placeholder="/nodevault"
            />
          </Field>
        </div>
        <Field label="Health URL">
          <input
            className={INPUT_MONO}
            value={healthUrl}
            onChange={(e) => setHealthUrl(e.target.value)}
            placeholder="http://localhost:3000/healthz"
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted dark:text-fog">Auto-deploy on push</span>
          <Toggle checked={autoDeploy} onChange={setAutoDeploy} label="Auto-deploy on push" />
        </div>
        {err && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 rounded-input px-3 py-2.5 text-[13px]">
            {err}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button type="button" className={BTN_SECONDARY} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={BTN_PRIMARY} disabled={busy || !name.trim()}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

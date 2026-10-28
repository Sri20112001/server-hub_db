import { fmtBytes, shortId, shortSha } from "../../lib/format";
import { loadAlertPrefs } from "../../lib/alertPrefs";
import type { BusEvent } from "../../lib/types/logs";

type PushToast = (text: string, bad?: boolean) => void;

// Map one live bus event to its toast (and dashboard reload). Extracted from
// the dashboard hook so the whole event table reads as one unit.
export function handleBusEvent(ev: BusEvent, pushToast: PushToast, reload: () => void): void {
  const d = (ev.data ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  switch (ev.type) {
    case "deployment.completed":
      pushToast(
        `Launch complete: ${str(d.project)} @ ${shortSha(str(d.commit))} (${str(d.durationSec)}s).`,
      );
      reload();
      break;
    case "deployment.failed":
      pushToast(
        `Launch failed: ${str(d.project)} @ ${shortSha(str(d.commit))}.`,
        true,
      );
      reload();
      break;
    case "deployment.started":
      reload();
      break;
    case "container.start":
    case "container.stop":
    case "container.restart":
      if (d.ok) {
        pushToast(`Container ${str(d.action)}: ${shortId(str(d.id))}.`);
        reload();
      } else if (str(d.detail)) {
        pushToast(
          `Container ${str(d.action)} failed: ${str(d.detail)}.`,
          true,
        );
      }
      break;
    case "project.start":
    case "project.stop":
    case "project.restart":
      if (d.ok) {
        pushToast(`Ship ${str(d.action)}: ${str(d.project)}.`);
        reload();
      } else if (str(d.detail)) {
        pushToast(`Ship ${str(d.action)} failed: ${str(d.detail)}.`, true);
      }
      break;
    case "gateway.reloaded":
      pushToast(
        d.ok
          ? "Gateway reloaded."
          : `Gateway reload failed: ${str(d.detail)}.`,
        !d.ok,
      );
      break;
    case "discovery.completed":
      pushToast(`“${str(d.project)}” joined the fleet.`);
      reload();
      break;
    case "backup.created":
      pushToast(
        `Snapshot ready: ${str(d.project)} (${fmtBytes(Number(d.sizeBytes ?? 0))}).`,
      );
      break;
    case "backup.failed":
      pushToast(`Snapshot failed: ${str(d.error)}.`, true);
      break;
    case "backup.restored":
      pushToast(`Snapshot restored: ${str(d.project)}.`);
      break;
    case "backup.restoreFailed":
      pushToast(`Restore failed: ${str(d.error)}.`, true);
      break;
    case "backup.deleted":
      break;
    case "telemetry.threshold":
      if (loadAlertPrefs().highUsage) {
        pushToast(
          `Resource signal: host ${str(d.resource)} at ${Number(d.value ?? 0).toFixed(1)}% (limit ${str(d.threshold)}%).`,
          true,
        );
      }
      break;
    default:
      break;
  }
}

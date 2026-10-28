import { useUi } from "../stores/store";

// Copy text to the clipboard and announce it with a toast. `label` names what
// was copied ("Hostname", "Token"…). Write failures are swallowed — the
// clipboard can be blocked by browser permissions and there is nothing the
// user can do from a toast anyway.
export function copyToClipboard(text: string, label: string) {
  void navigator.clipboard.writeText(text);
  useUi.getState().pushToast(`${label} copied to clipboard`);
}

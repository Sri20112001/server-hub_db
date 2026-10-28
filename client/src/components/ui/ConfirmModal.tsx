import { Modal } from "./Modal";
import { Field } from "./Field";

/**
 * High-risk confirmation. When `requireText` is set, the user must type it
 * exactly before the confirm button enables.
 */
export function ConfirmModal({
  title,
  body,
  confirmLabel,
  requireText,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  requireText?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <h3 className="text-[18px] mb-2">{title}</h3>
      <p className="text-muted dark:text-fog text-[13px] mb-3">{body}</p>
      {requireText && (
        <Field label={`Type ${requireText} to confirm`}>
          <input
            className="w-full bg-white dark:bg-panel border border-line dark:border-edge rounded-input font-body text-[13px] text-ink dark:text-bone px-3 py-2.5 outline-none focus:border-accent dark:focus:border-ember placeholder:text-stone dark:placeholder:text-fog font-mono"
            id="confirm-text"
            placeholder={requireText}
            autoComplete="off"
            onChange={(e) => {
              const btn = document.getElementById("confirm-go") as HTMLButtonElement | null;
              if (btn) btn.disabled = e.target.value !== requireText;
            }}
          />
        </Field>
      )}
      <div className="flex items-center gap-2 flex-wrap justify-end mt-4">
        <button
          className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-white dark:bg-panel border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          id="confirm-go"
          className="inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-55 disabled:cursor-not-allowed bg-transparent border-brick text-brick hover:bg-red-50 dark:hover:bg-red-950"
          disabled={busy || !!requireText}
          onClick={onConfirm}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

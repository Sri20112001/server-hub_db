import { useEffect, type ReactNode } from "react";

/** Generic centered modal. Esc closes. */
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[8dvh] sm:pt-[12vh] bg-[rgba(28,25,23,0.28)] dark:bg-[rgba(0,0,0,0.55)] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card w-full max-w-[480px] p-4 sm:p-6 shadow-chrome max-h-[88dvh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

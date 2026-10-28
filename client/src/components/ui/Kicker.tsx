import type { ReactNode } from "react";

/* ---------- primitives following DESIGN.md §Components ---------- */

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog">
      {children}
    </div>
  );
}

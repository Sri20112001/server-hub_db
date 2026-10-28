import type { ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-muted dark:text-fog mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

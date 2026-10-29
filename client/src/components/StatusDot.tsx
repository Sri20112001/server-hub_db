// Green/red status pip with a label; grey while still being determined.
export function StatusDot({ ok, label }: { ok: boolean | undefined; label: string }) {
  if (ok === undefined) return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted dark:text-fog">
      <span className="w-2 h-2 rounded-full bg-stone" />{label}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[12px]">
      <span className={`w-2 h-2 rounded-full ${ok ? "bg-moss" : "bg-brick"}`} />
      {label}
    </span>
  );
}

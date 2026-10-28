/* 5%-bucket widths keep meter fills as static, scannable classes */
const METER_WIDTHS = [
  "w-0", "w-[5%]", "w-[10%]", "w-[15%]", "w-[20%]", "w-[25%]", "w-[30%]",
  "w-[35%]", "w-[40%]", "w-[45%]", "w-1/2", "w-[55%]", "w-[60%]",
  "w-[65%]", "w-[70%]", "w-[75%]", "w-[80%]", "w-[85%]", "w-[90%]",
  "w-[95%]", "w-full",
] as const;

const FILL_TONES = [
  "bg-ink dark:bg-bone",
  "bg-accent dark:bg-ember",
  "bg-brick",
] as const;

export function Meter({
  label,
  pct,
  display,
}: {
  label: string;
  pct: number;
  display: string;
}) {
  const p = Math.max(0, Math.min(100, pct));
  const tone = p >= 90 ? FILL_TONES[2] : p >= 70 ? FILL_TONES[1] : FILL_TONES[0];
  return (
    <div className="my-2">
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span>{label}</span>
        <span className="font-mono">{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-paper dark:bg-abyss border border-line dark:border-edge overflow-hidden">
        <div className={`h-full rounded-full ${tone} ${METER_WIDTHS[Math.round(p / 5)]}`} />
      </div>
    </div>
  );
}

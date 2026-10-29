import { Toggle } from "./ui/Toggle";

// One labelled toggle row used across the settings notification sections.
export function AlertRow({
  title,
  hint,
  on,
  onFlip,
  last,
}: {
  title: string;
  hint: string;
  on: boolean;
  onFlip: () => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3.5 border-t border-line dark:border-edge ${
        last ? "border-b-0" : ""
      }`}
    >
      <div>
        <div className="font-medium text-sm text-ink dark:text-bone">{title}</div>
        <div className="text-muted dark:text-fog text-[13px]">{hint}</div>
      </div>
      <Toggle checked={on} onChange={onFlip} label={title} />
    </div>
  );
}

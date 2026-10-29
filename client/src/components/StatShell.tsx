import { Kicker } from "./ui/Kicker";

// Framed tile used across the dashboard stat row: kicker + icon header,
// body, optional footer. Clickable tiles open the telemetry timeline.
export function StatShell({
  kicker,
  icon,
  children,
  foot,
  onClick,
}: {
  kicker: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  foot?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5${
        onClick
          ? " transition-colors duration-150 cursor-pointer hover:border-accent dark:hover:border-ember"
          : ""
      }`}
      onClick={onClick}
      title={onClick ? "Open telemetry timeline" : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <Kicker>{kicker}</Kicker>
        <span className="text-muted dark:text-fog flex">{icon}</span>
      </div>
      {children}
      {foot && (
        <div className="flex items-center gap-2 flex-wrap justify-between mt-3 text-muted dark:text-fog text-xs">
          {foot}
        </div>
      )}
    </div>
  );
}

// One row in the fleet-health tile: status pip + count, with a short tag.
export function HealthRow({
  label,
  count,
  tag,
  pip,
}: {
  label: string;
  count: number;
  tag: string;
  pip: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-between">
      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full font-mono text-[11px] bg-paper dark:bg-abyss text-ink dark:text-bone whitespace-nowrap border-0">
        <span className={`w-1.5 h-1.5 rounded-full ${pip}`} /> {count} {label}
      </span>
      <span className="font-mono text-[11px] text-muted dark:text-fog">
        {tag}
      </span>
    </div>
  );
}

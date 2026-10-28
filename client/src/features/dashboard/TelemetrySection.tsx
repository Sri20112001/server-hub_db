import { Kicker } from "../../components/ui/Kicker";

// Titled block used throughout the telemetry page.
export function TelemetrySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2.5">
        <Kicker>{title}</Kicker>
      </div>
      {children}
    </div>
  );
}

// Single labelled value tile (hostname, uptime, memory figures, …).
export function Fact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
      <Kicker>{label}</Kicker>
      <div className={`text-[13px] mt-1.5 truncate ${mono === false ? "" : "font-mono"}`}>
        {value}
      </div>
    </div>
  );
}

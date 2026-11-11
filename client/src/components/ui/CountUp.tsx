import { useCountUp } from "../../hooks/useCountUp";

// Text wrapper for useCountUp. `decimals` controls rounding, prefix/suffix
// keep units (%, GB, ms) in place, and `format` covers custom output such as
// rate formatting on the telemetry charts.
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration,
  className,
  format,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}) {
  const display = useCountUp(value, duration);
  const text = format ? format(display) : display.toFixed(decimals);
  return (
    <span className={className}>
      {format ? text : `${prefix}${text}${suffix}`}
    </span>
  );
}

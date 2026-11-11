import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Kicker } from "./Kicker";

const TITLE_LG =
  "font-head font-bold tracking-[-0.03em] leading-[1.2] text-[32px] max-md:text-[26px] text-ink dark:text-bone";
const TITLE_SM = "font-bold text-xl tracking-tight text-ink dark:text-bone";

const BACK_BTN =
  "inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-muted dark:text-fog hover:text-ink dark:hover:text-bone text-[13px] px-0 transition-colors";

// One header for every page. Three shapes, one contract:
//   lg + kicker/title/subtitle  → dashboard, telemetry, monitoring, settings
//   lg + back                   → fleet, databases, ship manifest
//   sm + icon                   → servers, alerts, alert rules, audit, health
// Actions always sit on the right; status/badge sit beside the title.
export function PageHeader({
  size = "lg",
  back,
  kicker,
  title,
  subtitle,
  icon,
  status,
  badge,
  actions,
  className = "mb-6",
}: {
  size?: "lg" | "sm";
  back?: { label: string; onClick: () => void };
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  status?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const titleCls = size === "lg" ? TITLE_LG : TITLE_SM;

  let content: ReactNode;
  if (back) {
    content = (
      <>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" className={BACK_BTN} onClick={back.onClick}>
            <ArrowLeft size={14} /> {back.label}
          </button>
          <span className="text-line dark:text-edge">/</span>
          {kicker && <Kicker>{kicker}</Kicker>}
          <h1 className={titleCls}>{title}</h1>
          {status}
        </div>
        {subtitle && (
          <p className="text-muted dark:text-fog mt-1.5">{subtitle}</p>
        )}
      </>
    );
  } else if (size === "sm") {
    content = (
      <div className="flex items-center gap-3">
        {icon && (
          <span className="w-9 h-9 shrink-0 rounded-full bg-accent/10 dark:bg-ember/10 flex items-center justify-center text-accent dark:text-ember">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {kicker && <Kicker>{kicker}</Kicker>}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={titleCls}>{title}</h1>
            {status}
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-muted dark:text-fog mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    );
  } else {
    content = (
      <div className="min-w-0">
        {kicker && <Kicker>{kicker}</Kicker>}
        <div className={`flex items-center gap-3 flex-wrap${kicker ? " mt-1.5" : ""}`}>
          <h1 className={titleCls}>{title}</h1>
          {status}
          {badge}
        </div>
        {subtitle && (
          <p className="text-muted dark:text-fog mt-1.5 text-[13px]">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 flex-wrap ${className}`}
    >
      <div className="min-w-0">{content}</div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

import { Link } from "react-router";
import { ShipWheel } from "lucide-react";

/* ---------- brand logo (header left) ---------- */

export function Brand() {
  return (
    <Link
      className="flex items-center gap-2.5 no-underline shrink-0 select-none group"
      to="/"
      aria-label="ServerHub home"
    >
      <span className="w-[34px] h-[34px] rounded-full bg-accent-deep dark:bg-ember text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
        <ShipWheel size={18} strokeWidth={2.2} />
      </span>
      <span className="font-head font-bold text-[17px] text-ink dark:text-bone hidden sm:inline">
        ServerHub
      </span>
    </Link>
  );
}


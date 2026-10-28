import { Link } from "react-router";
import { User } from "lucide-react";

/* ---------- floating brand (top-left) ---------- */

export function Brand() {
  return (
    <Link
      className="fixed top-3 sm:top-5 left-3 sm:left-6 z-40 flex items-center gap-2.5 no-underline"
      to="/"
      aria-label="ServerHub home"
    >
      <span className="w-[34px] h-[34px] rounded-full bg-accent-deep dark:bg-ember text-white dark:text-black flex items-center justify-center">
        <User size={17} strokeWidth={2.2} />
      </span>
      <span className="font-head font-bold text-[17px] max-md:hidden">
        ServerHub
      </span>
    </Link>
  );
}

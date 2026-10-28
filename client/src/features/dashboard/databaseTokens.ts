// Shared styling tokens for the databases page: chips, buttons and inputs
// matching the design system.

export const chip =
  "inline-flex items-center gap-1.5 font-mono text-[11px] bg-paper dark:bg-abyss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-0.5 whitespace-nowrap";

export const btnGhost =
  "inline-flex items-center gap-2 rounded-input font-medium cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-panel border border-line dark:border-edge text-ink dark:text-bone hover:bg-paper dark:hover:bg-emboss px-3 py-1.5 text-xs";

export const btnAccent =
  "inline-flex items-center gap-2 rounded-input text-[13px] font-medium px-4 py-2 cursor-pointer border border-transparent whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-accent dark:bg-ember text-white dark:text-black hover:bg-accent-hover dark:hover:bg-ember-hover";

export const inputCls =
  "bg-white dark:bg-panel border border-line dark:border-edge rounded-input px-3 py-2 text-[13px] text-ink dark:text-bone placeholder:text-muted dark:placeholder:text-fog outline-none w-full focus:border-accent dark:focus:border-ember transition-colors";

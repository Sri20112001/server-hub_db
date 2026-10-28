export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`w-11 h-6 rounded-full border-0 cursor-pointer relative transition-colors duration-150 shrink-0 ${
        checked ? "bg-accent-deep dark:bg-ember" : "bg-line dark:bg-edge"
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-150 shadow-[0_1px_2px_rgba(28,25,23,0.2)] ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

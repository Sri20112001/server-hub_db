import { DatabaseIcon } from "../../components/DatabaseIcon";
import { fmtBytes } from "../../lib/format";
import { chip } from "./databaseTokens";
import type { DbItem } from "../../lib/types/databases";

// One database in the browser list: checkbox, engine glyph, name, and its
// system / registered / size markers. Registered rows are locked.
export function DatabaseRowItem({
  db,
  isChecked,
  engine,
  onToggle,
}: {
  db: DbItem;
  isChecked: boolean;
  engine: string;
  onToggle: () => void;
}) {
  const isSelected = db.registered || isChecked;

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={db.registered ? -1 : 0}
      onClick={() => {
        if (!db.registered) onToggle();
      }}
      onKeyDown={(e) => {
        if (!db.registered && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`flex items-center gap-3 border rounded-xl px-3.5 py-2.5 text-[13px] transition-all select-none ${
        db.registered
          ? "opacity-60 bg-paper/30 dark:bg-abyss/30 border-line/40 dark:border-edge/40 cursor-default"
          : isChecked
          ? "bg-accent/5 dark:bg-ember/5 border-accent/60 dark:border-ember/60 cursor-pointer"
          : "bg-paper dark:bg-abyss border-line dark:border-edge hover:border-line-hover dark:hover:border-edge-hover cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        tabIndex={-1}
        checked={isSelected}
        disabled={db.registered}
        onChange={() => {}}
        className="rounded border-line dark:border-edge pointer-events-none"
      />

      <div className="p-1 rounded bg-paper/80 dark:bg-abyss/80 border border-line/60 dark:border-edge/60 shrink-0 flex items-center justify-center">
        <DatabaseIcon engine={engine} size={14} />
      </div>

      <span className="font-mono font-medium text-ink dark:text-bone truncate">
        {db.name}
      </span>

      {db.system && (
        <span className={`${chip} text-[10px] text-muted dark:text-fog`}>system</span>
      )}

      {db.registered ? (
        <span className={`${chip} ml-auto text-emerald-600 dark:text-emerald-400 font-medium`}>
          registered
        </span>
      ) : (
        <span className="ml-auto font-mono text-muted dark:text-fog text-xs">
          {db.sizeBytes < 0
            ? "—"
            : engine === "redis"
            ? `${db.sizeBytes} keys`
            : fmtBytes(db.sizeBytes)}
        </span>
      )}
    </div>
  );
}

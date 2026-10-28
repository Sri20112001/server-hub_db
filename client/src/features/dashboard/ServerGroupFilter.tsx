import type { ServerGroup } from "../../lib/types/servers";

// Pill row to filter the fleet grid by server group (renders nothing when no
// groups exist).
export function ServerGroupFilter({
  groups,
  active,
  onSelect,
}: {
  groups: ServerGroup[];
  active: number | null;
  onSelect: (id: number | null) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${active === null ? "bg-accent dark:bg-ember text-white dark:text-black border-transparent" : "border-line dark:border-edge text-muted dark:text-fog bg-white dark:bg-panel"}`}
      >
        All
      </button>
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${active === g.id ? "bg-accent dark:bg-ember text-white dark:text-black border-transparent" : "border-line dark:border-edge text-muted dark:text-fog bg-white dark:bg-panel"}`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}

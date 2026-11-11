import { LayoutGrid, List, Search } from "lucide-react";

export type RegistryView = "cards" | "table";

export interface RegistryOption {
  value: string;
  label: string;
}

// Shared toolbar for the server and ship registries: a wide search box,
// status/sort selects and the card/table view switch. Every control is
// client-side, so the pages can filter what they already fetched.
export function RegistryToolbar({
  search,
  onSearch,
  placeholder,
  status,
  onStatus,
  statusOptions,
  sort,
  onSort,
  sortOptions,
  view,
  onView,
  extra,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  status: string;
  onStatus: (v: string) => void;
  statusOptions: RegistryOption[];
  sort: string;
  onSort: (v: string) => void;
  sortOptions: RegistryOption[];
  view: RegistryView;
  onView: (v: RegistryView) => void;
  extra?: React.ReactNode;
}) {
  const selectCls =
    "bg-white dark:bg-panel border border-line dark:border-edge rounded-input text-[13px] text-ink dark:text-bone px-3 py-2 outline-none focus:border-accent dark:focus:border-ember cursor-pointer";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 mb-5">
      <label className="flex items-center gap-2 bg-white dark:bg-panel border border-line dark:border-edge rounded-input px-3 py-2 text-[13px] text-muted dark:text-fog focus-within:border-accent dark:focus-within:border-ember flex-1 min-w-0 w-full lg:max-w-md">
        <Search size={14} className="shrink-0" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="bg-transparent outline-none text-ink dark:text-bone placeholder:text-muted dark:placeholder:text-fog w-full min-w-0"
        />
      </label>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Filter by status"
          className={selectCls}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          aria-label="Sort"
          className={selectCls}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {extra}

        <div
          className="ml-auto lg:ml-0 flex items-center gap-0.5 p-1 rounded-input bg-paper dark:bg-abyss border border-line dark:border-edge"
          role="group"
          aria-label="Layout"
        >
          {(
            [
              { id: "cards" as const, label: "Card view", icon: LayoutGrid },
              { id: "table" as const, label: "Table view", icon: List },
            ]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onView(id)}
              aria-pressed={view === id}
              title={label}
              aria-label={label}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                view === id
                  ? "bg-white dark:bg-panel text-ink dark:text-bone shadow-xs"
                  : "text-muted dark:text-fog hover:text-ink dark:hover:text-bone"
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

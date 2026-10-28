import { Skel } from "./Skel";

export function SettingsSkeleton() {
  return (
    <main
      className="w-full max-w-[760px] mx-auto px-6 max-md:px-4 pt-24 pb-36"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading settings</span>
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-panel border border-line dark:border-edge rounded-full px-3 py-1 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-brick" />
          <span className="text-xs text-muted dark:text-fog">Syncing preferences</span>
        </div>
      </div>
      <Skel className="w-56 h-3 rounded" />
      <Skel className="w-64 h-9 rounded-lg mt-2" />
      <Skel className="w-[420px] max-w-full h-4 rounded mt-2" />

      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <Skel className="w-32 h-5 rounded" />
            <Skel className="w-64 max-w-full h-3 rounded mt-2" />
          </div>
          <Skel className="w-16 h-5 rounded-md" />
        </div>
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-11 h-11 rounded-full bg-skel dark:bg-edge" />
            <div>
              <Skel className="w-28 h-4 rounded" />
              <Skel className="w-40 h-3 rounded mt-1.5" />
            </div>
          </div>
          <Skel className="w-24 h-6 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div>
            <Skel className="w-32 h-3 rounded mb-1.5" />
            <Skel className="h-10 rounded-input" />
          </div>
          <div>
            <Skel className="w-32 h-3 rounded mb-1.5" />
            <Skel className="h-10 rounded-input" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 flex-wrap mt-4">
          <Skel className="w-32 h-9 rounded-input" />
        </div>
      </div>

      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <Skel className="w-36 h-5 rounded" />
            <Skel className="w-64 max-w-full h-3 rounded mt-2" />
          </div>
          <Skel className="w-20 h-5 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5">
              <Skel className="w-24 h-3 rounded" />
              <Skel className="w-3/4 h-4 rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 mt-4 flex items-center justify-between gap-2 flex-wrap">
          <Skel className="w-36 h-4 rounded" />
          <Skel className="w-24 h-4 rounded" />
        </div>
      </div>

      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <Skel className="w-32 h-5 rounded" />
            <Skel className="w-64 max-w-full h-3 rounded mt-2" />
          </div>
          <Skel className="w-4 h-4 rounded" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 py-3.5 border-t border-line dark:border-edge"
          >
            <div>
              <Skel className="w-36 h-4 rounded" />
              <Skel className="w-56 max-w-full h-3 rounded mt-1.5" />
            </div>
            <span className="w-11 h-6 rounded-full border border-line dark:border-edge bg-paper dark:bg-abyss shrink-0" />
          </div>
        ))}
      </div>

      <div className="bg-butter dark:bg-danger-night border border-line dark:border-edge rounded-card p-5 mt-4">
        <Skel className="w-40 h-5 rounded" />
        <Skel className="w-72 max-w-full h-3 rounded mt-2" />
        <div className="flex items-center gap-3 flex-wrap mt-3">
          <Skel className="w-44 h-9 rounded-input" />
          <Skel className="w-44 h-9 rounded-input" />
        </div>
      </div>

      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5 mt-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Skel className="w-16 h-5 rounded-md" />
            <Skel className="w-28 h-3 rounded" />
          </div>
          <Skel className="w-24 h-3 rounded" />
        </div>
      </div>
    </main>
  );
}

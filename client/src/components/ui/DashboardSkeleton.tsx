import { Skel } from "./Skel";

function SyncPill({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white dark:bg-panel border border-line dark:border-edge rounded-full px-3 py-1 mb-3">
      <span className="w-1.5 h-1.5 rounded-full bg-brick" />
      <span className="text-xs text-muted dark:text-fog">{text}</span>
    </div>
  );
}

function StatSkelMeters() {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Skel className="w-24 h-3 rounded" />
        <Skel className="w-4 h-4 rounded" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="my-2">
          <div className="flex justify-between items-baseline mb-1">
            <Skel className="w-10 h-3 rounded" />
            <Skel className="w-8 h-3 rounded" />
          </div>
          <Skel className="h-1.5 rounded-full" />
        </div>
      ))}
      <Skel className="w-28 h-3 rounded mt-3" />
    </div>
  );
}

function StatSkelNumber() {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Skel className="w-24 h-3 rounded" />
        <Skel className="w-4 h-4 rounded" />
      </div>
      <Skel className="w-16 h-10 rounded-lg mt-2" />
      <Skel className="w-40 max-w-full h-3 rounded mt-2" />
      <Skel className="w-32 h-3 rounded mt-3" />
    </div>
  );
}

function StatSkelHealth() {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Skel className="w-24 h-3 rounded" />
        <Skel className="w-4 h-4 rounded" />
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-skel dark:bg-edge" />
              <Skel className="w-20 h-5 rounded-full" />
            </div>
            <Skel className="w-14 h-3 rounded" />
          </div>
        ))}
      </div>
      <Skel className="w-24 h-3 rounded mt-3" />
    </div>
  );
}

function ShipSkel() {
  return (
    <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-skel dark:bg-edge" />
          <Skel className="w-32 h-5 rounded" />
        </div>
        <Skel className="w-14 h-5 rounded-md" />
      </div>
      <Skel className="w-44 max-w-full h-3 rounded mt-2" />
      <div className="flex items-center gap-2 flex-wrap mt-2.5">
        <Skel className="w-14 h-5 rounded-full" />
        <Skel className="w-16 h-5 rounded-full" />
        <Skel className="w-12 h-5 rounded-full" />
      </div>
      <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3.5 flex items-center gap-2 flex-wrap justify-between mt-3">
        <div className="flex items-center gap-4 flex-wrap">
          <Skel className="w-12 h-6 rounded" />
          <Skel className="w-12 h-6 rounded" />
        </div>
        <Skel className="w-16 h-5 rounded-md" />
      </div>
      <div className="flex items-center justify-between gap-4 mt-3">
        <Skel className="w-24 h-3 rounded" />
        <Skel className="w-24 h-9 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main
      className="w-full max-w-[1240px] mx-auto px-10 max-md:px-4 pt-24 pb-36"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading ServerHub telemetry</span>
      <SyncPill text="Syncing telemetry" />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Skel className="w-36 h-3 rounded" />
          <Skel className="w-[320px] max-w-full h-10 rounded-lg mt-2" />
          <Skel className="w-[360px] max-w-full h-4 rounded mt-2" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skel className="w-32 h-9 rounded-lg" />
          <Skel className="w-32 h-9 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mt-5">
        <StatSkelMeters />
        <StatSkelNumber />
        <StatSkelNumber />
        <StatSkelHealth />
      </div>

      <div className="flex items-center justify-between gap-4 mt-8 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Skel className="w-24 h-6 rounded" />
          <Skel className="w-28 h-5 rounded-md" />
        </div>
        <Skel className="w-24 h-9 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ShipSkel key={i} />
        ))}
      </div>

      <div className="mt-8 mb-4">
        <Skel className="w-40 h-3 rounded" />
        <Skel className="w-56 h-6 rounded mt-2" />
      </div>
      <div className="bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-paper dark:bg-abyss">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skel key={i} className="h-3 rounded w-16 max-md:hidden first:max-md:block" />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 px-4 py-3 border-t border-line dark:border-edge"
          >
            <Skel className="w-40 max-w-[40%] h-5 rounded-full" />
            <Skel className="w-24 h-4 rounded max-md:hidden" />
            <Skel className="w-16 h-4 rounded max-md:hidden" />
            <Skel className="w-20 h-5 rounded-full" />
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 px-4 py-[0.7rem] border-t border-line dark:border-edge">
          <Skel className="w-48 h-3 rounded" />
          <Skel className="w-24 h-8 rounded-lg" />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Skel className="w-40 h-5 rounded" />
            <Skel className="w-16 h-5 rounded-md" />
          </div>
          <Skel className="w-20 h-5 rounded-md" />
        </div>
        <div className="font-mono text-xs leading-[1.7] bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-5 py-4">
          <Skel className="h-3 rounded w-full" />
          <Skel className="h-3 rounded w-4/5 mt-2" />
          <Skel className="h-3 rounded w-3/5 mt-2" />
        </div>
      </div>
    </main>
  );
}

import emptyDockImg from "../../assets/empty-docking-bay.png";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-8 text-center flex flex-col items-center justify-center">
      <img src={emptyDockImg} alt="Empty State" className="w-48 h-auto opacity-70 mb-4 mix-blend-luminosity dark:mix-blend-normal" />
      <div className="font-head font-semibold mb-1">{title}</div>
      {hint && <div className="text-muted dark:text-fog text-[13px]">{hint}</div>}
    </div>
  );
}

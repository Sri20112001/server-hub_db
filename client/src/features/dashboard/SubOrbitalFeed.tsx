import { useEffect, useRef } from "react";
import { Eraser, Terminal } from "lucide-react";

// One telemetry line: "[stamp] actor action resource → result", with the
// result colour-coded by keyword.
function FeedLine({ line }: { line: string }) {
  const m = line.match(/^(\[[^\]]*\])\s?(.*)$/);
  const stamp = m?.[1];
  const body = m?.[2] ?? line;
  const arrow = body.lastIndexOf("→");
  const head = arrow >= 0 ? body.slice(0, arrow).trimEnd() : body;
  const result = arrow >= 0 ? body.slice(arrow + 1).trim() : null;
  const tone =
    result === null
      ? "text-muted dark:text-fog"
      : /fail|error|blocked|denied|lost|choppy|alert/i.test(result)
        ? "text-brick"
        : /ok|success|created|restored|reload|complete|sailing/i.test(result)
          ? "text-moss"
          : "text-muted dark:text-fog";
  return (
    <div>
      {stamp && <span className="text-muted dark:text-fog">{stamp} </span>}
      <span className="text-ink dark:text-bone">{head}</span>
      {result !== null && (
        <>
          <span className="text-muted dark:text-fog"> → </span>
          <span className={tone}>{result}</span>
        </>
      )}
    </div>
  );
}

// Telemetry card — sub-orbital feed (live TTY on the audit bus). Owns the
// scroll box so the card stays pinned to the newest line as rows arrive.
export function SubOrbitalFeed({
  feed,
  onClear,
}: {
  feed: string[];
  onClear: () => void;
}) {
  const feedBoxRef = useRef<HTMLDivElement | null>(null);

  // Live TTY follows the tail: keep the telemetry card pinned to the
  // newest line as fresh audit rows arrive.
  useEffect(() => {
    const box = feedBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [feed]);

  return (
    <section className="mt-8 bg-white dark:bg-panel border border-line dark:border-edge rounded-card p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Terminal size={18} className="text-accent-deep dark:text-ember" />
          <h2 className="font-head text-[18px] font-bold tracking-[-0.02em]">
            Sub-orbital Feed
          </h2>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-tint dark:bg-emboss border border-line dark:border-edge text-ink dark:text-bone rounded-md px-2 py-[3px] whitespace-nowrap">
            LIVE TTY
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted dark:text-fog hover:text-ink dark:hover:text-bone bg-paper dark:bg-abyss border border-line dark:border-edge rounded-md px-2 py-[3px] transition-colors"
            onClick={onClear}
            title="Clear console buffer"
          >
            <Eraser size={12} /> CLEAR
          </button>
          <span className="relative flex h-2 w-2" title="Live">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-moss" />
          </span>
        </div>
      </div>
      <div
        ref={feedBoxRef}
        className="bg-paper dark:bg-abyss border border-line dark:border-edge rounded-xl px-4 py-3 font-mono text-xs leading-[1.7] space-y-1 overflow-y-auto overflow-x-auto max-h-32 whitespace-pre-wrap break-words"
      >
        {feed.length === 0 ? (
          <span className="text-muted dark:text-fog">
            — silence on the bus —
          </span>
        ) : (
          feed.map((line, i) => <FeedLine key={i} line={line} />)
        )}
      </div>
    </section>
  );
}

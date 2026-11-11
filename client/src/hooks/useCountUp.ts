import { useEffect, useRef, useState } from "react";

// Animated counter used by dashboard tiles, cards and chart readouts: eases
// the displayed value toward a new target whenever the target changes.
// Honors prefers-reduced-motion by snapping straight to the value.

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target: number, duration = 650): number {
  const goal = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(REDUCED_MOTION ? goal : 0);
  const current = useRef(REDUCED_MOTION ? goal : 0);
  const frame = useRef(0);

  useEffect(() => {
    if (REDUCED_MOTION) return;
    const from = current.current;
    if (from === goal) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // Cubic ease-out: fast start, gentle settle.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (goal - from) * eased;
      current.current = next;
      setDisplay(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [goal, duration]);

  return REDUCED_MOTION ? goal : display;
}

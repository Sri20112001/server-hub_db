import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

// Animated counter used by dashboard tiles, cards and chart readouts: eases
// the displayed value toward a new target whenever the target changes.
// Honours the shared reduced-motion policy by snapping straight to the value.
export function useCountUp(target: number, duration = 650): number {
  const reduced = useReducedMotion();
  const goal = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(0);
  const current = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    if (reduced) return;
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
  }, [goal, duration, reduced]);

  return reduced ? goal : display;
}

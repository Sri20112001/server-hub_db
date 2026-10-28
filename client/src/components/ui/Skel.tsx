/* ---------- loading skeletons (see design/*loading_skeleton) ---------- */

export function Skel({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skel ${className}`} />;
}

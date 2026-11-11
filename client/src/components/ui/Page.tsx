import type { ComponentProps, ReactNode } from "react";

export type PageWidth = "wide" | "default" | "narrow";

// Three width tokens replace the six ad-hoc max-widths pages used to carry.
const WIDTH: Record<PageWidth, string> = {
  wide: "max-w-7xl",
  default: "max-w-5xl",
  narrow: "max-w-[860px]",
};

// The single page frame. Owns the three responsive decisions every page used
// to re-derive: content width, gutters and the top/bottom offsets that clear
// the fixed top bar and the floating dock. Those offsets come from
// --page-top / --page-bottom in index.css so the chrome height lives in one
// place instead of ~17 hardcoded `pt-24 pb-36` guesses.
export function Page({
  width = "default",
  className = "",
  children,
  ...rest
}: {
  width?: PageWidth;
  children: ReactNode;
} & Omit<ComponentProps<"main">, "children">) {
  return (
    <main
      className={`w-full ${WIDTH[width]} mx-auto px-4 sm:px-6 lg:px-10 pt-[var(--page-top)] pb-[var(--page-bottom)] ${className}`}
      {...rest}
    >
      {children}
    </main>
  );
}

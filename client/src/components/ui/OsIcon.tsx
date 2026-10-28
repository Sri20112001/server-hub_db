import { Apple, LayoutGrid, Monitor, Terminal } from "lucide-react";

/* ---------- OS icon ---------- */

// OS strings come from the agent as a gopsutil platform id ("ubuntu", "debian",
// "amzn"…), a GOOS value ("linux", "darwin", "windows"), or free text. lucide
// dropped brand icons, so Linux uses the shell prompt and Windows the four
// window panes that echo its logo.
const LINUX_FAMILIES =
  /linux|ubuntu|debian|alpine|centos|rhel|fedora|arch|amzn|rocky|almalinux|suse|opensuse|mint|raspbian|kali|gentoo|slackware|nixos|void/i;

const OS_ICONS = {
  mac: Apple,
  windows: LayoutGrid,
  linux: Terminal,
  generic: Monitor,
} as const;

function osKeyFor(os?: string): keyof typeof OS_ICONS {
  const v = (os ?? "").trim();
  if (!v) return "generic";
  if (/darwin|macos|os\s?x|apple/i.test(v)) return "mac";
  if (/windows|win32|win64/i.test(v)) return "windows";
  if (LINUX_FAMILIES.test(v)) return "linux";
  return "generic";
}

export function OsIcon({ os, size = 13, className }: { os?: string; size?: number; className?: string }) {
  const Icon = OS_ICONS[osKeyFor(os)];
  return <Icon size={size} className={className} aria-hidden="true" />;
}

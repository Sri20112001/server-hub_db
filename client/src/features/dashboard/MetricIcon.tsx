import { Cpu, HardDrive, Layers, Zap } from "lucide-react";

// Metric glyph used on rule cards, in the preset picker and template rows.
export function MetricIcon({ metric, size = 15 }: { metric: string; size?: number }) {
  switch (metric.toLowerCase()) {
    case "cpu":
      return <Cpu size={size} className="text-amber-500 dark:text-amber-400" />;
    case "memory":
      return <Layers size={size} className="text-blue-500 dark:text-blue-400" />;
    case "disk":
      return <HardDrive size={size} className="text-purple-500 dark:text-purple-400" />;
    default:
      return <Zap size={size} className="text-accent dark:text-ember" />;
  }
}

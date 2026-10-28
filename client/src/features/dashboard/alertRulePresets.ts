// Shared alert-rule preset library. Kept in its own module (no components)
// so fast-refresh lint stays happy for AlertRulesPage.
export interface RulePreset {
  id: string;
  name: string;
  metric: "cpu" | "memory" | "disk";
  operator: "above" | "below";
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  forSec: number;
  description: string;
  category: "Performance" | "Memory" | "Storage" | "Efficiency";
}

export const RECOMMENDED_PRESETS: RulePreset[] = [
  {
    id: "cpu-sustained",
    name: "Sustained High CPU",
    metric: "cpu",
    operator: "above",
    threshold: 85,
    severity: "WARNING",
    forSec: 300,
    description: "Alerts when CPU load stays above 85% for 5 minutes continuously",
    category: "Performance",
  },
  {
    id: "cpu-spike",
    name: "Critical CPU Spike",
    metric: "cpu",
    operator: "above",
    threshold: 95,
    severity: "CRITICAL",
    forSec: 60,
    description: "Emergency alert when CPU peaks above 95% for 1 minute",
    category: "Performance",
  },
  {
    id: "ram-pressure",
    name: "High Memory Pressure",
    metric: "memory",
    operator: "above",
    threshold: 85,
    severity: "WARNING",
    forSec: 120,
    description: "Warns when RAM stays above 85% for 2 minutes before OOM termination",
    category: "Memory",
  },
  {
    id: "ram-critical",
    name: "Critical Memory Saturation",
    metric: "memory",
    operator: "above",
    threshold: 92,
    severity: "CRITICAL",
    forSec: 60,
    description: "Critical alert when RAM reaches 92% sustained for 1 minute",
    category: "Memory",
  },
  {
    id: "disk-low",
    name: "Low Disk Space Warning",
    metric: "disk",
    operator: "above",
    threshold: 85,
    severity: "WARNING",
    forSec: 0,
    description: "Instant notification when filesystem disk usage exceeds 85%",
    category: "Storage",
  },
  {
    id: "disk-critical",
    name: "Critical Disk Exhaustion",
    metric: "disk",
    operator: "above",
    threshold: 95,
    severity: "CRITICAL",
    forSec: 0,
    description: "Imminent out-of-disk failure warning at 95% capacity",
    category: "Storage",
  },
  {
    id: "cpu-idle",
    name: "Idle Host Inactivity",
    metric: "cpu",
    operator: "below",
    threshold: 5,
    severity: "WARNING",
    forSec: 900,
    description: "Flags underutilized servers with CPU below 5% for 15 minutes",
    category: "Efficiency",
  },
];

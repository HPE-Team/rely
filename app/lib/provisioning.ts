export type ProvisionLabel = "thin" | "balanced" | "thick" | "overcommitted";

export function classifyRatio(ratio: number): ProvisionLabel {
  if (ratio < 0.70) return "thin";
  if (ratio < 0.95) return "balanced";
  if (ratio < 1.05) return "thick";
  return "overcommitted";
}

const LABEL_ORDER: ProvisionLabel[] = ["thin", "balanced", "thick", "overcommitted"];

export function overallLabel(memRatio: number, coresRatio: number, storageRatio: number): ProvisionLabel {
  const labels = [memRatio, coresRatio, storageRatio].map(classifyRatio);
  return labels.reduce((worst, l) =>
    LABEL_ORDER.indexOf(l) > LABEL_ORDER.indexOf(worst) ? l : worst
  );
}

export function labelMeta(label: ProvisionLabel): {
  text: string;
  description: string;
  badgeClass: string;
  barClass: string;
} {
  switch (label) {
    case "thin":
      return {
        text: "Thin",
        description: "Significant spare capacity — VMs use under 70% of host resources",
        badgeClass: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20",
        barClass: "bg-blue-500",
      };
    case "balanced":
      return {
        text: "Balanced",
        description: "Well-utilized — VMs claim 70–95% of host capacity",
        badgeClass: "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20",
        barClass: "bg-green-500",
      };
    case "thick":
      return {
        text: "Thick",
        description: "Fully committed — VMs claim ~95–105% of host capacity",
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        barClass: "bg-amber-500",
      };
    case "overcommitted":
      return {
        text: "Over",
        description: "Overcommitted — VMs claim more than 105% of host capacity",
        badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
        barClass: "bg-red-500",
      };
  }
}

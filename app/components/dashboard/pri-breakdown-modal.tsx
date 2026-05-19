"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog";
import type { PRIBreakdown, ZoneColor } from "@/app/lib/calculations/pri";

interface PRIBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  score: number;
  breakdown: PRIBreakdown;
  color?: ZoneColor;
}

const COLOR_TEXT: Record<ZoneColor, string> = {
  green: "text-green-400",
  amber: "text-yellow-400",
  red: "text-red-400",
};

const CAUSE: Record<string, string> = {
  "Success rate":
    "Weighted 80%. Non-cascaded server failures drop success rate; each point below 100% costs 0.80 PRI.",
  Stability:
    "Weighted 20%. High variance in provision_time (coefficient of variation) lowers stability. Tighten spread to reduce loss.",
  "Error severity":
    "Weighted 10%. Sum of (error count × per-type weight) ÷ total servers. Critical types (HARDWARE / STORAGE / POWER / HOST_FAILURE) cost the most.",
  "Provision time outliers":
    "Weighted 5%. Share of provisions exceeding their per-VM dynamic fence. Each VM's fence = Q3 + k_i × IQR, where k_i (base 1.5) scales with the VM's resource requirements vs fleet median. Adjust resource impact weights in Settings.",
  "Fleet deviation":
    "Post-hoc penalty applied when this zone's PRI falls below the fleet-wide baseline. Penalty = max(0, fleetPRI − zonePRI) × impact weight. Adjust impact in Settings → Fleet Deviation.",
};

export function PRIBreakdownModal({
  open,
  onOpenChange,
  title,
  score,
  breakdown,
  color,
}: PRIBreakdownModalProps) {
  const scoreColor = color ? COLOR_TEXT[color] : "text-foreground";
  const totalLoss = 100 - breakdown.total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="pr-8 pt-2 mb-1">{title}</DialogTitle>
        <DialogDescription className="mb-4">
          PRI starts at 100 and loses points for each factor below.
        </DialogDescription>

        <div className="space-y-4 pb-2">
          <div className="flex items-baseline justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Final PRI</p>
              <p className={`text-3xl font-bold ${scoreColor}`}>{score.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total loss</p>
              <p className="text-xl font-semibold text-red-400">−{totalLoss.toFixed(1)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-muted-foreground">Starting score</span>
              <span className="font-mono font-semibold">100.0</span>
            </div>

            {breakdown.contributions.map((c) => {
              const loss = Math.abs(c.points);
              return (
                <div
                  key={c.label}
                  className="rounded-md border border-border/30 bg-[#1d1d1d] px-3 py-2 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        loss > 0 ? "text-red-400" : "text-muted-foreground"
                      }`}
                    >
                      {loss > 0 ? `−${loss.toFixed(2)}` : "0.00"}
                    </span>
                  </div>
                  {CAUSE[c.label] && (
                    <p className="text-xs text-muted-foreground leading-snug">
                      {CAUSE[c.label]}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between border-t border-border/40 pt-2 px-1">
              <span className="text-sm font-semibold">Final PRI</span>
              <span className={`font-mono font-bold ${scoreColor}`}>
                {score.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

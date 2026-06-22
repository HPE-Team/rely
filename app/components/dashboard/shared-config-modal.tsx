"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Link2 } from "lucide-react";
import { type PRIConfig } from "@/app/lib/calculations/pri";
import {
  parsePRIConfig,
  readLocalConfig,
  saveLocalConfig,
  mergePRIConfig,
} from "@/app/lib/config/pri-config";
import { ERROR_TYPE_LABELS, type ErrorType } from "@/app/lib/constants/error-weights";
import { sileo } from "sileo";
import { toastFill } from "@/app/lib/toast-style";

const fixed2 = (v: number) => v.toFixed(2);
const intFmt = (v: number) => String(v);
const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
const mult = (v: number) => `${v.toFixed(2)}x`;

interface FieldDesc {
  label: string;
  fmt: (v: number) => string;
  get: (c: PRIConfig) => number;
}

// Flat list of comparable scalar fields, in display order. Error weights appended below.
const FIELDS: ReadonlyArray<FieldDesc> = [
  { label: "PRI green threshold", fmt: intFmt, get: c => c.colorThresholds.pri.green },
  { label: "PRI red threshold",   fmt: intFmt, get: c => c.colorThresholds.pri.amber },
  { label: "Critical-ratio amber", fmt: pct, get: c => c.colorThresholds.criticalRatio.amber },
  { label: "Critical-ratio red",   fmt: pct, get: c => c.colorThresholds.criticalRatio.red },
  { label: "ESX-fail amber", fmt: pct, get: c => c.colorThresholds.esxFailShare.amber },
  { label: "ESX-fail red",   fmt: pct, get: c => c.colorThresholds.esxFailShare.red },
  { label: "CR weight",       fmt: fixed2, get: c => c.crWeight },
  { label: "CR threshold",    fmt: fixed2, get: c => c.crThreshold },
  { label: "Fleet deviation", fmt: fixed2, get: c => c.fleetDeviationImpact },
  { label: "Outlier · memory",  fmt: fixed2, get: c => c.outlierResourceImpact.memory },
  { label: "Outlier · cores",   fmt: fixed2, get: c => c.outlierResourceImpact.cores },
  { label: "Outlier · storage", fmt: fixed2, get: c => c.outlierResourceImpact.storage },
  ...(Object.keys(ERROR_TYPE_LABELS) as ErrorType[]).map(
    (t): FieldDesc => ({
      label: `${ERROR_TYPE_LABELS[t]} weight`,
      fmt: mult,
      get: c => c.errorWeights[t],
    }),
  ),
];

interface DiffRow {
  label: string;
  from: string;
  to: string;
}

function diffConfigs(current: PRIConfig, incoming: PRIConfig): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const f of FIELDS) {
    const a = f.get(current);
    const b = f.get(incoming);
    if (a !== b) rows.push({ label: f.label, from: f.fmt(a), to: f.fmt(b) });
  }
  return rows;
}

/**
 * Detects a `?config=` param on the page URL (a shared config link) and prompts the user to
 * apply it. Mounted globally in the root layout, so it works on any route the link lands on.
 * Reads `window.location` directly (no `useSearchParams`) to mirror EnterGate and avoid a
 * Suspense boundary requirement.
 */
export function SharedConfigGate() {
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState<PRIConfig | null>(null);
  const [diff, setDiff] = useState<DiffRow[]>([]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("config");
    const parsed = parsePRIConfig(raw);
    if (Object.keys(parsed).length === 0) return; // absent or invalid → no prompt

    const incomingCfg = mergePRIConfig(parsed);
    const currentCfg = mergePRIConfig(readLocalConfig());
    setIncoming(incomingCfg);
    setDiff(diffConfigs(currentCfg, incomingCfg));

    // Don't prompt while the entry splash is up: this dialog would sit *behind* the
    // z-100 splash, and the "Enter" click (outside the dialog) would dismiss it,
    // stripping the ?config= param before it's ever seen. Wait until the user enters.
    if (localStorage.getItem("rely-entered") === "1") {
      setOpen(true);
      return;
    }
    const onEntered = () => setOpen(true);
    window.addEventListener("rely-entered", onEntered, { once: true });
    return () => window.removeEventListener("rely-entered", onEntered);
  }, []);

  const stripParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("config");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  };

  const handleApply = () => {
    if (incoming) saveLocalConfig(incoming);
    stripParam();
    setOpen(false);
    sileo.success({
      title: "Configuration applied",
      fill: toastFill(),
      description: "Shared PRI configuration is now active.",
    });
  };

  const handleDismiss = () => {
    stripParam();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleDismiss(); }}>
      <DialogContent
        className="w-[calc(100vw-2rem)] sm:max-w-md p-0 gap-0 overflow-hidden"
        onInteractOutside={e => e.preventDefault()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 bg-popover">
          <div className="flex items-center gap-1.5 text-brand mb-1.5">
            <Link2 className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
              Shared Configuration
            </span>
          </div>
          <DialogTitle className="text-xl font-bold leading-none tracking-tight">
            Apply this configuration?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            A teammate shared these PRI settings via link. Applying replaces your saved configuration.
          </DialogDescription>
        </div>

        {/* ── Diff ───────────────────────────────────────────────────── */}
        <div className="px-6 pb-4">
          {diff.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-surface-1 px-4 py-3 text-sm text-muted-foreground">
              Matches your current configuration — nothing will change.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                  Changes
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground/50">{diff.length}</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-surface-1 divide-y divide-border/40 max-h-[40vh] overflow-y-auto scrollbar-custom">
                {diff.map(row => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]"
                  >
                    <span className="text-muted-foreground truncate">{row.label}</span>
                    <span className="font-mono tabular-nums whitespace-nowrap shrink-0">
                      <span className="text-muted-foreground/55">{row.from}</span>
                      <span className="text-muted-foreground/30 mx-1.5">→</span>
                      <span className="font-semibold text-foreground">{row.to}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="bg-surface-1 border-t border-border/60 px-6 py-4
          flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={handleDismiss} className="font-semibold">
            Dismiss
          </Button>
          <Button onClick={handleApply} className="font-semibold">
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

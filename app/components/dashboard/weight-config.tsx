"use client";

import { useState, useEffect } from "react";
import { Tooltip } from "radix-ui";
import {
  ErrorType,
  type ErrorPhase,
  ERROR_CLASSIFICATIONS,
  getErrorTypeLabel,
} from "@/app/lib/constants/error-weights";
import { type PRIConfig, DEFAULT_PRI_CONFIG } from "@/app/lib/calculations/pri";
import { readLocalConfig, saveLocalConfig, clearLocalConfig, configQueryString } from "@/app/lib/config/pri-config";
import { CONFIG_PRESETS } from "@/app/lib/config/presets";
import { Slider } from "@/app/components/ui/slider";
import { Button } from "@/app/components/ui/button";
import { SlidersHorizontal, Link2, Check, Info, ChevronDown, ChevronRight, Scale, ShieldCheck, Eye } from "lucide-react";
import { sileo } from "sileo";
import { toastFill } from "@/app/lib/toast-style";

interface WeightConfigProps {
  onClose?: () => void;
  onWeightsUpdate?: () => void;
}

function deepMerge(defaults: PRIConfig, partial: Partial<PRIConfig>): PRIConfig {
  return {
    ...defaults,
    ...partial,
    errorWeights: { ...defaults.errorWeights, ...partial.errorWeights },
    outlierResourceImpact: { ...defaults.outlierResourceImpact, ...partial.outlierResourceImpact },
    colorThresholds: {
      ...defaults.colorThresholds,
      ...partial.colorThresholds,
      pri: { ...defaults.colorThresholds.pri, ...partial.colorThresholds?.pri },
      criticalRatio: { ...defaults.colorThresholds.criticalRatio, ...partial.colorThresholds?.criticalRatio },
      esxFailShare: { ...defaults.colorThresholds.esxFailShare, ...partial.colorThresholds?.esxFailShare },
    },
  };
}

/** Order-stable serialization so a config can be compared against a preset for active state. */
function canonConfig(c: PRIConfig): string {
  return JSON.stringify(deepMerge(DEFAULT_PRI_CONFIG, c));
}

// ─── value formatters ──────────────────────────────────────────────────────
const fmtFixed2  = (v: number) => v.toFixed(2);
const fmtMult    = (v: number) => `${v.toFixed(2)}x`;
const fmtInt     = (v: number) => String(v);
const fmtPercent = (v: number) => `${(v * 100).toFixed(0)}%`;

// ─── Collapse — smooth height transition via grid-rows 0fr→1fr ─────────────
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none
        ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
    >
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

// ─── InfoTip — hover tooltip, replaces always-on description text ───────────
function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-label="More info"
          className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] max-w-[260px] rounded-lg bg-popover px-3 py-2 text-[12px] leading-snug text-popover-foreground shadow-xl ring-1 ring-foreground/10"
        >
          {text}
          <Tooltip.Arrow className="fill-popover" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─── PriBandBar — mini visualization of a preset's PRI color thresholds ─────
function PriBandBar({ green, red }: { green: number; red: number }) {
  const redW = Math.max(0, red);
  const amberW = Math.max(0, green - red);
  const greenW = Math.max(0, 100 - green);
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border/40">
      <div style={{ width: `${redW}%` }} className="bg-red-500/80" />
      <div style={{ width: `${amberW}%` }} className="bg-amber-500/80" />
      <div style={{ width: `${greenW}%` }} className="bg-emerald-500/80" />
    </div>
  );
}

// ─── SliderRow — one clean control per row, description in a tooltip ────────
interface SliderRowProps {
  label: React.ReactNode;
  info?: string;
  badge?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

function SliderRow({ label, info, badge, value, onChange, min, max, step, format }: SliderRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 py-2.5">
      <div className="min-w-0 flex items-center gap-1.5">
        <span className="text-sm font-medium truncate">{label}</span>
        {badge && (
          <span className="shrink-0 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/60">
            {badge}
          </span>
        )}
        {info && <InfoTip text={info} />}
      </div>
      <span className="font-mono font-semibold text-[13px] tabular-nums text-foreground/90 text-right leading-none whitespace-nowrap">
        {format(value)}
      </span>
      <div className="col-span-2 mt-2">
        <Slider
          value={[value]}
          onValueChange={v => onChange(v[0])}
          min={min} max={max} step={step}
          className="w-full"
        />
      </div>
    </div>
  );
}

// ─── tree accent tones — one semantic color per settings branch ────────────
type Tone = "rose" | "brand" | "emerald";
const TONES: Record<Tone, {
  dot: string; line: string; label: string;
  openText: string; openChevron: string; openBg: string;
}> = {
  rose: {
    dot: "bg-rose-500", line: "border-rose-500/25", label: "text-rose-500/80",
    openText: "text-rose-600 dark:text-rose-400", openChevron: "text-rose-500", openBg: "bg-rose-500/[0.06]",
  },
  brand: {
    dot: "bg-brand", line: "border-brand/30", label: "text-brand/80",
    openText: "text-brand", openChevron: "text-brand", openBg: "bg-brand/[0.07]",
  },
  emerald: {
    dot: "bg-emerald-500", line: "border-emerald-500/25", label: "text-emerald-500/80",
    openText: "text-emerald-600 dark:text-emerald-400", openChevron: "text-emerald-500", openBg: "bg-emerald-500/[0.06]",
  },
};

// ─── TreeNode — a leaf in the settings tree; expands its sliders ───────────
function TreeNode({
  label,
  count,
  tone,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  tone: Tone;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-2 py-2 pl-2 pr-2.5 text-left rounded-md cursor-pointer transition-colors
          ${open ? t.openBg : "hover:bg-foreground/[0.03]"}`}
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? `rotate-90 ${t.openChevron}` : "text-muted-foreground"}`}
        />
        <span className={`text-sm transition-colors ${open ? `font-semibold ${t.openText}` : "font-medium text-foreground/80"}`}>
          {label}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/45">{count}</span>
      </button>
      <Collapse open={open}>
        <div className="pl-5 pr-1 pb-1">{children}</div>
      </Collapse>
    </div>
  );
}

// ─── TreeBranch — a parent label (color-dotted) with a guide-lined body ────
function TreeBranch({ label, tone, children }: { label: string; tone: Tone; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <div className="pt-3 first:pt-1">
      <div className="flex items-center gap-1.5 px-1 pb-1">
        <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-[0.13em] ${t.label}`}>
          {label}
        </span>
      </div>
      <div className={`ml-[7px] border-l ${t.line} pl-3`}>{children}</div>
    </div>
  );
}

// ─── per-preset visual identity (icon + accent) — presentation only ────────
const PRESET_LOOKS: Record<string, {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  chip: string; ring: string; dot: string;
}> = {
  balanced:  { Icon: Scale,       chip: "bg-brand/10 text-brand",           ring: "border-brand bg-brand/[0.04] ring-brand/30",               dot: "border-brand bg-brand" },
  strict:    { Icon: ShieldCheck, chip: "bg-rose-500/10 text-rose-500",     ring: "border-rose-500 bg-rose-500/[0.04] ring-rose-500/30",       dot: "border-rose-500 bg-rose-500" },
  executive: { Icon: Eye,         chip: "bg-violet-500/10 text-violet-500", ring: "border-violet-500 bg-violet-500/[0.04] ring-violet-500/30", dot: "border-violet-500 bg-violet-500" },
};

// ─── main component ────────────────────────────────────────────────────────
export function WeightConfig({ onClose, onWeightsUpdate }: WeightConfigProps) {
  void onClose;
  const [config, setConfig] = useState<PRIConfig>(DEFAULT_PRI_CONFIG);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [openNode, setOpenNode] = useState<string | null>(null);

  const activePresetId = CONFIG_PRESETS.find(
    p => canonConfig(p.config) === canonConfig(config),
  )?.id;
  const isCustom = !activePresetId;

  useEffect(() => {
    const saved = readLocalConfig();
    const merged = deepMerge(DEFAULT_PRI_CONFIG, saved);
    setConfig(merged);
    const matchesPreset = CONFIG_PRESETS.some(p => canonConfig(p.config) === canonConfig(merged));
    if (!matchesPreset) setAdvancedOpen(true);
  }, []);

  const toggleNode = (id: string) => setOpenNode(cur => (cur === id ? null : id));

  const setErrorWeight = (errorType: ErrorType, value: number) => {
    setConfig(c => ({
      ...c,
      errorWeights: { ...c.errorWeights, [errorType]: value },
    }));
  };

  const handleSave = () => {
    saveLocalConfig(config);
    onWeightsUpdate?.();
    sileo.success({
      title: "Configuration saved",
      fill: toastFill(),
      description: "PRI weights and thresholds updated.",
    });
  };

  const handleReset = () => {
    clearLocalConfig();
    setConfig(DEFAULT_PRI_CONFIG);
    sileo.info({
      title: "Reset to defaults",
      fill: toastFill(),
      description: "All PRI configuration reset to default values.",
    });
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}${configQueryString(config)}`;
    try {
      await navigator.clipboard.writeText(url);
      sileo.success({
        title: "Link copied",
        fill: toastFill(),
        description: "Shareable config link copied to clipboard.",
      });
    } catch {
      sileo.error({
        title: "Copy failed",
        fill: toastFill(),
        description: "Clipboard unavailable. Copy the URL manually.",
      });
    }
  };

  const categorizedErrors: Record<ErrorPhase, Array<[ErrorType, typeof ERROR_CLASSIFICATIONS[ErrorType]]>> = {
    "pre-provision": [],
    "post-provision": [],
  };
  (Object.entries(ERROR_CLASSIFICATIONS) as Array<[ErrorType, typeof ERROR_CLASSIFICATIONS[ErrorType]]>)
    .forEach(([errorType, cfg]) => {
      categorizedErrors[cfg.phase].push([errorType, cfg]);
    });

  const errorSliders = (phase: ErrorPhase) =>
    categorizedErrors[phase].map(([errorType, cfg]) => (
      <SliderRow
        key={errorType}
        label={getErrorTypeLabel(errorType)}
        info={cfg.description}
        badge={cfg.severity}
        value={config.errorWeights[errorType]}
        onChange={v => setErrorWeight(errorType, v)}
        min={0} max={2} step={0.1}
        format={fmtMult}
      />
    ));

  const setColor = (path: (c: PRIConfig["colorThresholds"]) => PRIConfig["colorThresholds"]) =>
    setConfig(c => ({ ...c, colorThresholds: path(c.colorThresholds) }));

  return (
    <Tooltip.Provider delayDuration={150} skipDelayDuration={300}>
      <div className="flex flex-col min-h-0">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 bg-popover flex-shrink-0">
          <div className="flex items-center gap-1.5 text-brand mb-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
              PRI Scoring
            </span>
          </div>
          <h2 className="text-xl font-bold leading-none tracking-tight">Configuration</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Pick a preset, or open advanced settings to fine-tune.
          </p>
        </div>

        {/* ── Scrollable body — caps height, keeps footer pinned ──────── */}
        <div className="overflow-y-auto scrollbar-custom max-h-[min(58vh,480px)] lg:max-h-[calc(90vh-13rem)]">

          {/* ── Presets (the hero) ────────────────────────────────────── */}
          <div className="px-6 pt-1 pb-2">
            <div
              role="radiogroup"
              aria-label="Configuration preset"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {CONFIG_PRESETS.map(preset => {
                const active = activePresetId === preset.id;
                const look = PRESET_LOOKS[preset.id];
                const Icon = look.Icon;
                return (
                  <button
                    key={preset.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setConfig(deepMerge(DEFAULT_PRI_CONFIG, preset.config))}
                    className={`flex flex-col text-left rounded-xl border p-4 transition-all cursor-pointer outline-none
                      focus-visible:ring-2 focus-visible:ring-brand/50
                      ${active
                        ? `${look.ring} ring-1`
                        : "border-border/60 bg-surface-1 hover:border-border hover:bg-foreground/[0.03]"}`}
                  >
                    {/* identity: accent icon + selected check */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${look.chip}`}>
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-all
                          ${active ? `${look.dot} text-white` : "border-border/70"}`}
                      >
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </div>

                    {/* name */}
                    <h3 className="text-sm font-semibold leading-tight mt-3">{preset.label}</h3>

                    {/* scannable descriptors */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.highlights.map(h => (
                        <span
                          key={h}
                          className="rounded-md bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground/90"
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* signature: PRI band + the healthy cutoff number */}
                    <div className="mt-auto pt-4">
                      <PriBandBar green={preset.config.colorThresholds.pri.green} red={preset.config.colorThresholds.pri.amber} />
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-muted-foreground/70">
                          Healthy ≥{" "}
                          <span className="font-mono font-semibold text-foreground/80">{preset.config.colorThresholds.pri.green}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Advanced settings — disclosure + animated tree ────────── */}
          <div className="px-6">
            <button
              onClick={() => setAdvancedOpen(o => !o)}
              aria-expanded={advancedOpen}
              className="w-full flex items-center justify-between gap-3 py-3 border-t border-border/50 cursor-pointer"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                Advanced settings
                {isCustom && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand bg-brand/10 rounded px-1.5 py-0.5">
                    Custom
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>

            <Collapse open={advancedOpen}>
              <div className="pb-3">

                {/* Error weights */}
                <TreeBranch label="Error weights" tone="rose">
                  <TreeNode label="Pre-provisioning"  count={categorizedErrors["pre-provision"].length}  tone="rose" open={openNode === "pre"}  onToggle={() => toggleNode("pre")}>
                    {errorSliders("pre-provision")}
                  </TreeNode>
                  <TreeNode label="Post-provisioning" count={categorizedErrors["post-provision"].length} tone="rose" open={openNode === "post"} onToggle={() => toggleNode("post")}>
                    {errorSliders("post-provision")}
                  </TreeNode>
                </TreeBranch>

                {/* Scoring */}
                <TreeBranch label="Scoring" tone="brand">
                  <TreeNode label="Outliers" count={3} tone="brand" open={openNode === "outliers"} onToggle={() => toggleNode("outliers")}>
                    {(
                      [
                        { key: "memory",  label: "Memory impact",    info: "k shifts based on VM max_memory vs fleet median memory" },
                        { key: "cores",   label: "CPU cores impact", info: "k shifts based on VM max_cores vs fleet median cores" },
                        { key: "storage", label: "Storage impact",   info: "k shifts based on VM max_storage vs fleet median storage" },
                      ] as const
                    ).map(({ key, label, info }) => (
                      <SliderRow
                        key={key}
                        label={label}
                        info={info}
                        value={config.outlierResourceImpact[key]}
                        onChange={v => setConfig(c => ({
                          ...c,
                          outlierResourceImpact: { ...c.outlierResourceImpact, [key]: v },
                        }))}
                        min={0} max={1} step={0.05}
                        format={fmtFixed2}
                      />
                    ))}
                  </TreeNode>
                  <TreeNode label="Capacity reliability" count={2} tone="brand" open={openNode === "capacity"} onToggle={() => toggleNode("capacity")}>
                    <SliderRow
                      label="Capacity weight"
                      info="Loss = (1 − CR) × weight × 100. Uses 1/(1+u²) decay per resource. Set to 0 to disable."
                      value={config.crWeight}
                      onChange={v => setConfig(c => ({ ...c, crWeight: v }))}
                      min={0} max={0.25} step={0.01}
                      format={fmtFixed2}
                    />
                    <SliderRow
                      label="Capacity threshold"
                      info="Free zone — no penalty at or below this utilization. Above it: 1/(1 + max(0, u − t)²)."
                      value={config.crThreshold}
                      onChange={v => setConfig(c => ({ ...c, crThreshold: v }))}
                      min={0} max={1} step={0.05}
                      format={fmtFixed2}
                    />
                  </TreeNode>
                  <TreeNode label="Fleet deviation" count={1} tone="brand" open={openNode === "fleet"} onToggle={() => toggleNode("fleet")}>
                    <SliderRow
                      label="Deviation impact"
                      info="Penalty = max(0, fleetPRI − zonePRI) × impact. Only zones below fleet baseline are penalized."
                      value={config.fleetDeviationImpact}
                      onChange={v => setConfig(c => ({ ...c, fleetDeviationImpact: v }))}
                      min={0} max={0.2} step={0.01}
                      format={fmtFixed2}
                    />
                  </TreeNode>
                </TreeBranch>

                {/* Color thresholds */}
                <TreeBranch label="Color thresholds" tone="emerald">
                  <TreeNode label="PRI score" count={2} tone="emerald" open={openNode === "pri"} onToggle={() => toggleNode("pri")}>
                    <SliderRow
                      label={<><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-1.5" />PRI green</>}
                      info="PRI ≥ this turns green (when severity is also low)."
                      value={config.colorThresholds.pri.green}
                      onChange={v => setColor(ct => ({ ...ct, pri: { ...ct.pri, green: v } }))}
                      min={50} max={100} step={1}
                      format={fmtInt}
                    />
                    <SliderRow
                      label={<><span className="h-2 w-2 rounded-full bg-red-500 inline-block mr-1.5" />PRI red</>}
                      info="PRI below this turns red regardless of severity."
                      value={config.colorThresholds.pri.amber}
                      onChange={v => setColor(ct => ({ ...ct, pri: { ...ct.pri, amber: v } }))}
                      min={0} max={90} step={1}
                      format={fmtInt}
                    />
                  </TreeNode>
                  <TreeNode label="Critical error ratio" count={2} tone="emerald" open={openNode === "critical"} onToggle={() => toggleNode("critical")}>
                    <SliderRow
                      label="Amber at"
                      info="Share of errors that are critical severity (hardware / power / host) at which the cell turns amber."
                      value={config.colorThresholds.criticalRatio.amber}
                      onChange={v => setColor(ct => ({ ...ct, criticalRatio: { ...ct.criticalRatio, amber: v } }))}
                      min={0} max={1} step={0.05}
                      format={fmtPercent}
                    />
                    <SliderRow
                      label="Red at"
                      info="Critical-error share at which the cell turns red."
                      value={config.colorThresholds.criticalRatio.red}
                      onChange={v => setColor(ct => ({ ...ct, criticalRatio: { ...ct.criticalRatio, red: v } }))}
                      min={0} max={1} step={0.05}
                      format={fmtPercent}
                    />
                  </TreeNode>
                  <TreeNode label="ESX failure share" count={2} tone="emerald" open={openNode === "esx"} onToggle={() => toggleNode("esx")}>
                    <SliderRow
                      label="Amber at"
                      info="Share of root-cause failures on ESX hosts (excludes cascaded VMs) at which the cell turns amber."
                      value={config.colorThresholds.esxFailShare.amber}
                      onChange={v => setColor(ct => ({ ...ct, esxFailShare: { ...ct.esxFailShare, amber: v } }))}
                      min={0} max={1} step={0.05}
                      format={fmtPercent}
                    />
                    <SliderRow
                      label="Red at"
                      info="ESX root-cause failure share at which the cell turns red."
                      value={config.colorThresholds.esxFailShare.red}
                      onChange={v => setColor(ct => ({ ...ct, esxFailShare: { ...ct.esxFailShare, red: v } }))}
                      min={0} max={1} step={0.05}
                      format={fmtPercent}
                    />
                  </TreeNode>
                </TreeBranch>
              </div>
            </Collapse>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-surface-1 border-t border-border/60 px-6 py-4 mt-1
          flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="gap-2 font-semibold sm:mr-auto"
          >
            <Link2 className="h-4 w-4" />
            Copy Link
          </Button>
          <Button onClick={handleReset} variant="outline" className="font-semibold">
            Reset
          </Button>
          <Button onClick={handleSave} className="font-semibold">
            Save
          </Button>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

export function usePRIConfig() {
  // Lazy-init from localStorage so the very first data fetch already carries the saved
  // config. Avoids an initial empty-config fetch that races the real one on refresh.
  // (SSR has no localStorage → readLocalConfig returns {}; the effect reconciles on mount.)
  const [config, setConfig] = useState<Partial<PRIConfig>>(() => readLocalConfig());

  useEffect(() => {
    const sync = () =>
      setConfig(prev => {
        const next = readLocalConfig();
        // Replace only when the value actually changed — keeps the reference stable so
        // dependent fetch effects don't re-run (and re-race) needlessly.
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    sync(); // reconcile the SSR-initialized {} with the real client value
    window.addEventListener('pri-config-changed', sync);
    return () => window.removeEventListener('pri-config-changed', sync);
  }, []);

  return config;
}

"use client";

import { useState, useEffect } from "react";
import { Tabs } from "radix-ui";
import {
  ErrorType,
  type ErrorPhase,
  ERROR_CLASSIFICATIONS,
  getErrorTypeLabel,
} from "@/app/lib/constants/error-weights";
import { type PRIConfig, DEFAULT_PRI_CONFIG } from "@/app/lib/calculations/pri";
import { readLocalConfig, saveLocalConfig, clearLocalConfig } from "@/app/lib/config/pri-config";
import { Slider } from "@/app/components/ui/slider";
import { Button } from "@/app/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { sileo } from "sileo";
import { toastFill } from "@/app/lib/toast-style";

type Section = ErrorPhase | "outliers" | "capacity-reliability" | "fleet-deviation" | "color";

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

// ─── value formatters ──────────────────────────────────────────────────────
const fmtFixed2  = (v: number) => v.toFixed(2);
const fmtMult    = (v: number) => `${v.toFixed(2)}x`;
const fmtInt     = (v: number) => String(v);
const fmtPercent = (v: number) => `${(v * 100).toFixed(0)}%`;

// ─── tab descriptors ───────────────────────────────────────────────────────
const TABS: ReadonlyArray<{ id: Section; label: string }> = [
  { id: "pre-provision",        label: "Pre-Provision" },
  { id: "post-provision",       label: "Post-Provision" },
  { id: "outliers",             label: "Outliers" },
  { id: "capacity-reliability", label: "Capacity Reliability" },
  { id: "fleet-deviation",      label: "Fleet Deviation" },
  { id: "color",                label: "Color Thresholds" },
];

// ─── SliderRow ─────────────────────────────────────────────────────────────
interface SliderRowProps {
  label: React.ReactNode;
  description?: string;
  badge?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

function SliderRow({ label, description, badge, value, onChange, min, max, step, format }: SliderRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 py-4">
      <div className="min-w-0 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{label}</span>
        {badge && (
          <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/70">
            {badge}
          </span>
        )}
      </div>
      <span className="font-mono font-semibold text-[13px] tabular-nums text-foreground/90 text-right leading-none whitespace-nowrap">
        {format(value)}
      </span>
      {description && (
        <p className="col-span-2 text-[11px] leading-snug text-muted-foreground/70 line-clamp-1">
          {description}
        </p>
      )}
      <div className="col-span-2 mt-1.5">
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

// ─── SubGroup (labelled hairline rule) ─────────────────────────────────────
function SubGroup({ label, description }: { label: string; description?: string }) {
  return (
    <div className="pt-4 pb-0.5 first:pt-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] font-bold text-muted-foreground whitespace-nowrap">
          {label}
        </span>
        <span className="h-px flex-1 bg-border/60" />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────
export function WeightConfig({ onClose, onWeightsUpdate }: WeightConfigProps) {
  const [config, setConfig] = useState<PRIConfig>(DEFAULT_PRI_CONFIG);
  const [tab, setTab] = useState<Section>("pre-provision");

  useEffect(() => {
    const saved = readLocalConfig();
    setConfig(deepMerge(DEFAULT_PRI_CONFIG, saved));
  }, []);

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

  const categorizedErrors: Record<ErrorPhase, Array<[ErrorType, typeof ERROR_CLASSIFICATIONS[ErrorType]]>> = {
    "pre-provision": [],
    "post-provision": [],
  };

  (Object.entries(ERROR_CLASSIFICATIONS) as Array<[ErrorType, typeof ERROR_CLASSIFICATIONS[ErrorType]]>)
    .forEach(([errorType, cfg]) => {
      categorizedErrors[cfg.phase].push([errorType, cfg]);
    });

  const renderTabBody = (id: Section) => {
    switch (id) {
      case "pre-provision":
      case "post-provision":
        return categorizedErrors[id].map(([errorType, cfg]) => (
          <SliderRow
            key={errorType}
            label={getErrorTypeLabel(errorType)}
            description={cfg.description}
            badge={cfg.severity}
            value={config.errorWeights[errorType]}
            onChange={v => setErrorWeight(errorType, v)}
            min={0} max={2} step={0.1}
            format={fmtMult}
          />
        ));

      case "outliers":
        return (
          <>
            <p className="text-xs text-muted-foreground pt-1 pb-3">
              Each slider shifts the per-VM Tukey fence multiplier k from the 1.5 base.
              Higher impact → more slack for resource-heavy VMs.
            </p>
            {(
              [
                { key: "memory",  label: "Memory impact",    description: "k shifts based on VM max_memory vs fleet median memory" },
                { key: "cores",   label: "CPU cores impact", description: "k shifts based on VM max_cores vs fleet median cores" },
                { key: "storage", label: "Storage impact",   description: "k shifts based on VM max_storage vs fleet median storage" },
              ] as const
            ).map(({ key, label, description }) => (
              <SliderRow
                key={key}
                label={label}
                description={description}
                value={config.outlierResourceImpact[key]}
                onChange={v => setConfig(c => ({
                  ...c,
                  outlierResourceImpact: { ...c.outlierResourceImpact, [key]: v },
                }))}
                min={0} max={1} step={0.05}
                format={fmtFixed2}
              />
            ))}
          </>
        );

      case "capacity-reliability":
        return (
          <>
            <SliderRow
              label="CR weight"
              description="Loss = (1 − CR) × weight × 100. Uses 1/(1+u²) decay per resource. Set to 0 to disable."
              value={config.crWeight}
              onChange={v => setConfig(c => ({ ...c, crWeight: v }))}
              min={0} max={0.25} step={0.01}
              format={fmtFixed2}
            />
            <SliderRow
              label="CR threshold"
              description="Free zone — no penalty at or below this utilization. Above it: 1/(1 + max(0, u − t)²)."
              value={config.crThreshold}
              onChange={v => setConfig(c => ({ ...c, crThreshold: v }))}
              min={0} max={1} step={0.05}
              format={fmtFixed2}
            />
          </>
        );

      case "fleet-deviation":
        return (
          <SliderRow
            label="Deviation impact"
            description="Penalty = max(0, fleetPRI − zonePRI) × impact. Only zones below fleet baseline are penalized."
            value={config.fleetDeviationImpact}
            onChange={v => setConfig(c => ({ ...c, fleetDeviationImpact: v }))}
            min={0} max={0.2} step={0.01}
            format={fmtFixed2}
          />
        );

      case "color":
        return (
          <>
            <SubGroup label="PRI Score" />
            <SliderRow
              label={<><span className="h-2 w-2 rounded-full bg-green-500 inline-block mr-1.5" />Green threshold</>}
              description="PRI ≥ this → green (if severity also low)"
              value={config.colorThresholds.pri.green}
              onChange={v => setConfig(c => ({
                ...c,
                colorThresholds: { ...c.colorThresholds, pri: { ...c.colorThresholds.pri, green: v } },
              }))}
              min={50} max={100} step={1}
              format={fmtInt}
            />
            <SliderRow
              label={<><span className="h-2 w-2 rounded-full bg-red-500 inline-block mr-1.5" />Red threshold</>}
              description="PRI < this → red regardless of severity"
              value={config.colorThresholds.pri.amber}
              onChange={v => setConfig(c => ({
                ...c,
                colorThresholds: { ...c.colorThresholds, pri: { ...c.colorThresholds.pri, amber: v } },
              }))}
              min={0} max={90} step={1}
              format={fmtInt}
            />
            <SubGroup label="Critical Error Ratio" description="Share of errors that are critical severity (hardware/power/host)" />
            <SliderRow
              label={<><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block mr-1.5" />Amber at</>}
              value={config.colorThresholds.criticalRatio.amber}
              onChange={v => setConfig(c => ({
                ...c,
                colorThresholds: { ...c.colorThresholds, criticalRatio: { ...c.colorThresholds.criticalRatio, amber: v } },
              }))}
              min={0} max={1} step={0.05}
              format={fmtPercent}
            />
            <SliderRow
              label={<><span className="h-2 w-2 rounded-full bg-red-500 inline-block mr-1.5" />Red at</>}
              value={config.colorThresholds.criticalRatio.red}
              onChange={v => setConfig(c => ({
                ...c,
                colorThresholds: { ...c.colorThresholds, criticalRatio: { ...c.colorThresholds.criticalRatio, red: v } },
              }))}
              min={0} max={1} step={0.05}
              format={fmtPercent}
            />
            <SubGroup label="ESX Failure Share" description="Share of root-cause failures on ESX hosts (excludes cascaded VMs)" />
            <SliderRow
              label={<><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block mr-1.5" />Amber at</>}
              value={config.colorThresholds.esxFailShare.amber}
              onChange={v => setConfig(c => ({
                ...c,
                colorThresholds: { ...c.colorThresholds, esxFailShare: { ...c.colorThresholds.esxFailShare, amber: v } },
              }))}
              min={0} max={1} step={0.05}
              format={fmtPercent}
            />
            <SliderRow
              label={<><span className="h-2 w-2 rounded-full bg-red-500 inline-block mr-1.5" />Red at</>}
              value={config.colorThresholds.esxFailShare.red}
              onChange={v => setConfig(c => ({
                ...c,
                colorThresholds: { ...c.colorThresholds, esxFailShare: { ...c.colorThresholds.esxFailShare, red: v } },
              }))}
              min={0} max={1} step={0.05}
              format={fmtPercent}
            />
          </>
        );
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 bg-popover border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-brand mb-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
            PRI Scoring
          </span>
        </div>
        <h2 className="text-xl font-bold leading-none tracking-tight">Configuration</h2>
      </div>

      {/* ── Tabs: sidebar rail (lg) + content panel ──────────────────── */}
      <Tabs.Root
        value={tab}
        onValueChange={v => setTab(v as Section)}
        orientation="vertical"
        className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[210px_1fr]"
      >
        {/* Sidebar / horizontal strip */}
        <Tabs.List
          className="flex gap-1 overflow-x-auto flex-shrink-0 bg-surface-1 px-3 py-2.5 border-b border-border/60
            lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-2.5 lg:py-3
            lg:border-b-0 lg:border-r lg:border-border/60"
        >
          {TABS.map(t => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className="
                relative whitespace-nowrap lg:whitespace-normal
                rounded-md px-3 py-2 text-left font-mono text-[13px]
                text-muted-foreground transition-all
                hover:bg-foreground/[0.05] hover:text-foreground/80
                focus-visible:outline-none
                lg:w-full lg:rounded-l-none lg:border-l-[3px] lg:border-transparent lg:pl-3
                data-[state=active]:bg-popover data-[state=active]:text-foreground data-[state=active]:font-semibold
                data-[state=active]:[box-shadow:inset_0_1px_3px_rgba(0,0,0,0.10),inset_0_0_0_1px_rgba(0,0,0,0.03)]
                lg:data-[state=active]:border-brand
              "
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Content panel */}
        <div className="min-h-0 flex-1 bg-popover">
          {TABS.map(t => (
            <Tabs.Content
              key={t.id}
              value={t.id}
              className="h-[min(50vh,420px)] lg:h-[52vh] overflow-y-auto scrollbar-custom px-6 py-4 outline-none data-[state=inactive]:hidden"
            >
              {renderTabBody(t.id)}
            </Tabs.Content>
          ))}
        </div>
      </Tabs.Root>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-surface-1 border-t border-border/60 px-6 py-4
        flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <span className="hidden sm:block mr-auto text-xs text-muted-foreground">
          Changes apply on save
        </span>
        <Button onClick={handleReset} variant="outline" className="font-semibold">
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} className="font-semibold">
          Save Configuration
        </Button>
      </div>
    </div>
  );
}

export function usePRIConfig() {
  const [config, setConfig] = useState<Partial<PRIConfig>>({});

  useEffect(() => {
    setConfig(readLocalConfig());
    const handler = () => setConfig(readLocalConfig());
    window.addEventListener('pri-config-changed', handler);
    return () => window.removeEventListener('pri-config-changed', handler);
  }, []);

  return config;
}

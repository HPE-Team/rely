"use client";

import { useState, useEffect } from "react";
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
import { ChevronDown } from "lucide-react";
import { sileo } from "sileo";

type Section = ErrorPhase | "outliers" | "color";

interface WeightConfigProps {
  onClose?: () => void;
  onWeightsUpdate?: () => void;
}

function deepMerge(defaults: PRIConfig, partial: Partial<PRIConfig>): PRIConfig {
  return {
    ...defaults,
    ...partial,
    errorWeights: { ...defaults.errorWeights, ...partial.errorWeights },
    colorThresholds: {
      ...defaults.colorThresholds,
      ...partial.colorThresholds,
      pri: { ...defaults.colorThresholds.pri, ...partial.colorThresholds?.pri },
      criticalRatio: { ...defaults.colorThresholds.criticalRatio, ...partial.colorThresholds?.criticalRatio },
      esxFailShare: { ...defaults.colorThresholds.esxFailShare, ...partial.colorThresholds?.esxFailShare },
    },
  };
}

export function WeightConfig({ onClose, onWeightsUpdate }: WeightConfigProps) {
  const [config, setConfig] = useState<PRIConfig>(DEFAULT_PRI_CONFIG);
  const [openSection, setOpenSection] = useState<Section | null>("pre-provision");

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
      fill: "#171717",
      description: "PRI weights and thresholds updated.",
    });
  };

  const handleReset = () => {
    clearLocalConfig();
    setConfig(DEFAULT_PRI_CONFIG);
    sileo.info({
      title: "Reset to defaults",
      fill: "#171717",
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

  const toggle = (s: Section) => setOpenSection(cur => cur === s ? null : s);

  const sectionClass = (s: Section) =>
    `rounded-lg border border-border/60 bg-muted/20 shadow-sm`;

  const headerClass = "flex w-full items-center justify-between rounded-t-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors";

  const chevron = (s: Section) => (
    <ChevronDown
      className={`h-4 w-4 text-muted-foreground transition-transform ${openSection === s ? "rotate-180" : ""}`}
    />
  );

  const collapse = (s: Section) => (
    `grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
      openSection === s ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
    }`
  );

  return (
    <div>
      <div className="flex flex-col space-y-1.5 text-left mb-6 sm:mb-8 py-2 sm:py-4">
        <h2 className="text-2xl font-bold leading-none tracking-tight">Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Adjust failure weights, performance baselines, and color thresholds for PRI scoring
        </p>
      </div>

      <div className="space-y-4">
        {/* Error weight sections */}
        {(["pre-provision", "post-provision"] as const).map(phase => {
          const items = categorizedErrors[phase];
          const title = phase === "pre-provision" ? "Pre-Provision Errors" : "Post-Provision Errors";
          return (
            <div key={phase} className={sectionClass(phase)}>
              <button type="button" className={headerClass} onClick={() => toggle(phase)}>
                <div>
                  <p className="font-mono text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{items.length} slider{items.length === 1 ? "" : "s"}</p>
                </div>
                {chevron(phase)}
              </button>
              <div className={collapse(phase)}>
                <div className="overflow-hidden">
                  <div className="space-y-4 border-t border-border/40 bg-muted/30 px-4 py-4">
                    {items.map(([errorType, cfg]) => (
                      <div key={errorType} className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{getErrorTypeLabel(errorType)}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{cfg.description}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono font-semibold text-sm">{config.errorWeights[errorType].toFixed(2)}x</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-[10px]">{cfg.severity}</p>
                          </div>
                        </div>
                        <Slider
                          value={[config.errorWeights[errorType]]}
                          onValueChange={v => setErrorWeight(errorType, v[0])}
                          min={0} max={2} step={0.1}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Outliers */}
        <div className={sectionClass("outliers")}>
          <button type="button" className={headerClass} onClick={() => toggle("outliers")}>
            <div>
              <p className="font-mono text-sm font-semibold">Outliers</p>
              <p className="text-xs text-muted-foreground">Provision time outlier sensitivity (vs median)</p>
            </div>
            {chevron("outliers")}
          </button>
          <div className={collapse("outliers")}>
            <div className="overflow-hidden">
              <div className="space-y-6 border-t border-border/40 bg-muted/30 px-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">IQR Outlier Multiplier</p>
                      <p className="text-xs text-muted-foreground">Fence = Q3 + k × IQR. Lower = stricter outlier detection</p>
                    </div>
                    <p className="font-mono font-semibold text-sm flex-shrink-0">{config.iqrMultiplier.toFixed(1)}x</p>
                  </div>
                  <Slider
                    value={[config.iqrMultiplier]}
                    onValueChange={v => setConfig(c => ({ ...c, iqrMultiplier: v[0] }))}
                    min={0.5} max={4} step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Thresholds */}
        <div className={sectionClass("color")}>
          <button type="button" className={headerClass} onClick={() => toggle("color")}>
            <div>
              <p className="font-mono text-sm font-semibold">Color Thresholds</p>
              <p className="text-xs text-muted-foreground">PRI and severity cutoffs for green / amber / red</p>
            </div>
            {chevron("color")}
          </button>
          <div className={collapse("color")}>
            <div className="overflow-hidden">
              <div className="space-y-6 border-t border-border/40 bg-muted/30 px-4 py-4">
                {/* PRI thresholds */}
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">PRI Score</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                        Green threshold
                      </p>
                      <p className="text-xs text-muted-foreground">PRI ≥ this → green (if severity also low)</p>
                    </div>
                    <p className="font-mono font-semibold text-sm flex-shrink-0">{config.colorThresholds.pri.green}</p>
                  </div>
                  <Slider
                    value={[config.colorThresholds.pri.green]}
                    onValueChange={v => setConfig(c => ({
                      ...c,
                      colorThresholds: { ...c.colorThresholds, pri: { ...c.colorThresholds.pri, green: v[0] } },
                    }))}
                    min={50} max={100} step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                        Red threshold
                      </p>
                      <p className="text-xs text-muted-foreground">PRI &lt; this → red regardless of severity</p>
                    </div>
                    <p className="font-mono font-semibold text-sm flex-shrink-0">{config.colorThresholds.pri.amber}</p>
                  </div>
                  <Slider
                    value={[config.colorThresholds.pri.amber]}
                    onValueChange={v => setConfig(c => ({
                      ...c,
                      colorThresholds: { ...c.colorThresholds, pri: { ...c.colorThresholds.pri, amber: v[0] } },
                    }))}
                    min={0} max={90} step={1}
                    className="w-full"
                  />
                </div>

                {/* Critical ratio */}
                <div className="space-y-1 pt-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Critical Error Ratio</p>
                  <p className="text-xs text-muted-foreground">Share of errors that are critical severity (hardware/power/host)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />
                      Amber at
                    </p>
                    <p className="font-mono font-semibold text-sm">{(config.colorThresholds.criticalRatio.amber * 100).toFixed(0)}%</p>
                  </div>
                  <Slider
                    value={[config.colorThresholds.criticalRatio.amber]}
                    onValueChange={v => setConfig(c => ({
                      ...c,
                      colorThresholds: { ...c.colorThresholds, criticalRatio: { ...c.colorThresholds.criticalRatio, amber: v[0] } },
                    }))}
                    min={0} max={1} step={0.05}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                      Red at
                    </p>
                    <p className="font-mono font-semibold text-sm">{(config.colorThresholds.criticalRatio.red * 100).toFixed(0)}%</p>
                  </div>
                  <Slider
                    value={[config.colorThresholds.criticalRatio.red]}
                    onValueChange={v => setConfig(c => ({
                      ...c,
                      colorThresholds: { ...c.colorThresholds, criticalRatio: { ...c.colorThresholds.criticalRatio, red: v[0] } },
                    }))}
                    min={0} max={1} step={0.05}
                    className="w-full"
                  />
                </div>

                {/* ESX fail share */}
                <div className="space-y-1 pt-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">ESX Failure Share</p>
                  <p className="text-xs text-muted-foreground">Share of root-cause failures on ESX hosts (excludes cascaded VMs)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />
                      Amber at
                    </p>
                    <p className="font-mono font-semibold text-sm">{(config.colorThresholds.esxFailShare.amber * 100).toFixed(0)}%</p>
                  </div>
                  <Slider
                    value={[config.colorThresholds.esxFailShare.amber]}
                    onValueChange={v => setConfig(c => ({
                      ...c,
                      colorThresholds: { ...c.colorThresholds, esxFailShare: { ...c.colorThresholds.esxFailShare, amber: v[0] } },
                    }))}
                    min={0} max={1} step={0.05}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                      Red at
                    </p>
                    <p className="font-mono font-semibold text-sm">{(config.colorThresholds.esxFailShare.red * 100).toFixed(0)}%</p>
                  </div>
                  <Slider
                    value={[config.colorThresholds.esxFailShare.red]}
                    onValueChange={v => setConfig(c => ({
                      ...c,
                      colorThresholds: { ...c.colorThresholds, esxFailShare: { ...c.colorThresholds.esxFailShare, red: v[0] } },
                    }))}
                    min={0} max={1} step={0.05}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8">
        <Button onClick={handleSave} size="lg" className="w-full sm:flex-1 font-semibold">
          Save Configuration
        </Button>
        <Button onClick={handleReset} size="lg" variant="outline" className="w-full sm:flex-1 font-semibold">
          Reset to Defaults
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

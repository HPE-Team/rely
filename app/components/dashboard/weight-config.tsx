"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_ERROR_WEIGHTS,
  ErrorType,
  type ErrorPhase,
  ERROR_CLASSIFICATIONS,
  getErrorTypeLabel,
} from "@/app/lib/constants/error-weights";
import { Slider } from "@/app/components/ui/slider";
import { Button } from "@/app/components/ui/button";
import { ChevronDown } from "lucide-react";
import { sileo } from "sileo";

const STORAGE_KEY = "pri_error_weights";

interface WeightConfigProps {
  onClose?: () => void;
  onWeightsUpdate?: (weights: Record<ErrorType, number>) => void;
}

export function WeightConfig({ onClose, onWeightsUpdate }: WeightConfigProps) {
  const [weights, setWeights] = useState<Record<ErrorType, number>>(
    DEFAULT_ERROR_WEIGHTS,
  );
  const [openCategory, setOpenCategory] = useState<ErrorPhase | null>(
    "pre-provision",
  );

  useEffect(() => {
    // Load saved weights from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved weights:", e);
      }
    }
  }, []);

  const handleWeightChange = (errorType: ErrorType, value: number) => {
    const updated = { ...weights, [errorType]: value };
    setWeights(updated);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
    onWeightsUpdate?.(weights);
    sileo.success({
      title: "Changes saved",
      fill: "#171717",
      description: "Your custom error weights have been saved.",
    });
  };

  const handleReset = () => {
    setWeights(DEFAULT_ERROR_WEIGHTS);
    localStorage.removeItem(STORAGE_KEY);
    sileo.info({
      title: "Weights reset to defaults",
      fill: "#171717",
      description: "Your error weights have been reset to the default values.",
    });
  };

  const categorizedErrors: Record<
    ErrorPhase,
    Array<[ErrorType, (typeof ERROR_CLASSIFICATIONS)[ErrorType]]>
  > = {
    "pre-provision": [],
    "post-provision": [],
  };

  (Object.entries(ERROR_CLASSIFICATIONS) as Array<
    [ErrorType, (typeof ERROR_CLASSIFICATIONS)[ErrorType]]
  >).forEach(([errorType, config]) => {
    categorizedErrors[config.phase].push([errorType, config]);
  });

  return (
    <div>
      <div className="flex flex-col space-y-1.5 text-left mb-6 sm:mb-8 py-2 sm:py-4">
        <h2 className="text-2xl font-bold leading-none tracking-tight">
          Configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          Adjust the impact factor of specific failures on the PRI index score
        </p>
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          {(["pre-provision", "post-provision"] as const).map((phase) => {
            const isOpen = openCategory === phase;
            const items = categorizedErrors[phase];
            const title =
              phase === "pre-provision"
                ? "Pre-Provision Errors"
                : "Post-Provision Errors";

            return (
              <div
                key={phase}
                className="rounded-lg border border-border/60 bg-muted/20 shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-t-lg px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setOpenCategory((current) =>
                      current === phase ? null : phase,
                    )
                  }
                >
                  <div>
                    <p className="font-mono text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {items.length} slider{items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-4 border-t border-border/40 bg-muted/30 px-4 py-4">
                      {items.map(([errorType, config]) => (
                        <div key={errorType} className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {getErrorTypeLabel(errorType)}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {config.description}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-mono font-semibold text-sm">
                                {weights[errorType].toFixed(2)}x
                              </p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-[10px]">
                                {config.severity}
                              </p>
                            </div>
                          </div>
                          <Slider
                            value={[weights[errorType]]}
                            onValueChange={(value) =>
                              handleWeightChange(errorType, value[0])
                            }
                            min={0}
                            max={2}
                            step={0.1}
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
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8">
          <Button
            onClick={handleSave}
            size="lg"
            className="w-full sm:flex-1 font-semibold"
          >
            Save Configuration
          </Button>
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="w-full sm:flex-1 font-semibold"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useErrorWeights() {
  const [weights, setWeights] = useState<Record<ErrorType, number>>(
    DEFAULT_ERROR_WEIGHTS,
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved weights:", e);
      }
    }
  }, []);

  return weights;
}

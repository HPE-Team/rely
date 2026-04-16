'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_ERROR_WEIGHTS, ErrorType, ERROR_CLASSIFICATIONS } from '@/app/lib/constants/error-weights';
import { Slider } from '@/app/components/ui/slider';
import { Button } from '@/app/components/ui/button';
import { sileo } from 'sileo';

const STORAGE_KEY = 'pri_error_weights';

interface WeightConfigProps {
  onClose?: () => void;
  onWeightsUpdate?: (weights: Record<ErrorType, number>) => void;
}

export function WeightConfig({ onClose, onWeightsUpdate }: WeightConfigProps) {
  const [weights, setWeights] = useState<Record<ErrorType, number>>(DEFAULT_ERROR_WEIGHTS);

  useEffect(() => {
    // Load saved weights from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved weights:', e);
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
    sileo.success({ title: "Changes saved" });
  };

  const handleReset = () => {
    setWeights(DEFAULT_ERROR_WEIGHTS);
    localStorage.removeItem(STORAGE_KEY);
    sileo.info({ title: "Weights reset to defaults" });
  };

  return (
    <div>
      <div className="flex flex-col space-y-1.5 text-left mb-8">
        <h2 className="text-2xl font-bold leading-none tracking-tight">Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Adjust the impact factor of specific failures on the PRI index score
        </p>
      </div>
      <div className="space-y-8">
        <div className="space-y-6">
          {Object.entries(ERROR_CLASSIFICATIONS).map(([errorType, config]) => (
            <div key={errorType} className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{errorType.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{config.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-semibold text-sm">
                    {weights[errorType as ErrorType].toFixed(2)}x
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-[10px]">{config.phase.split('-')[0]}</p>
                </div>
              </div>
              <Slider
                value={[weights[errorType as ErrorType]]}
                onValueChange={(value) =>
                  handleWeightChange(errorType as ErrorType, value[0])
                }
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-8">
          <Button onClick={handleSave} size="lg" className="flex-1 font-semibold">
            Save Configuration
          </Button>
          <Button onClick={handleReset} size="lg" variant="outline" className="flex-1 font-semibold">
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useErrorWeights() {
  const [weights, setWeights] = useState<Record<ErrorType, number>>(DEFAULT_ERROR_WEIGHTS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved weights:', e);
      }
    }
  }, []);

  return weights;
}

import { type PRIConfig, DEFAULT_PRI_CONFIG } from '../calculations/pri';

export interface ConfigPreset {
  id: 'balanced' | 'strict' | 'executive';
  label: string;
  /** One-line scenario description shown on the preset card. */
  tagline: string;
  /** 2–3 short editorial chips summarizing the preset's effect, shown on the card. */
  highlights: string[];
  /** Full config so applying a preset never leaves stale fields from a prior config. */
  config: PRIConfig;
}

/**
 * Suggested configurations tuned for real-world reliability-reviewing scenarios.
 * Each is a full `PRIConfig`. "Balanced" references `DEFAULT_PRI_CONFIG` so it stays the
 * single source of truth and doubles as the reset anchor.
 */
export const CONFIG_PRESETS: ReadonlyArray<ConfigPreset> = [
  {
    id: 'balanced',
    label: 'Balanced',
    tagline: 'Default weighting — the standard PRI baseline.',
    highlights: ['Standard baseline'],
    config: DEFAULT_PRI_CONFIG,
  },
  {
    id: 'strict',
    label: 'Strict / SLA-Audit',
    tagline: 'Tight thresholds and heavy critical-error weighting for compliance reviews.',
    highlights: ['PRI green ≥ 92', 'Tight outlier fences', 'Heavy critical weights'],
    config: {
      // Critical failures pushed to full weight; supporting failures raised too.
      errorWeights: {
        HARDWARE_FAILURE: 1.0,
        HOST_FAILURE: 1.0,
        POWER_FAILURE: 1.0,
        STORAGE_FAILURE: 1.0,
        NETWORK_FAILURE: 0.85,
        IP_FAILURE: 0.75,
        RESOURCE_FAILURE: 0.65,
      },
      // Lower impact → less slack for big VMs → tighter outlier fences.
      outlierResourceImpact: { memory: 0.15, cores: 0.15, storage: 0.1 },
      fleetDeviationImpact: 0.1,
      crWeight: 0.22,
      crThreshold: 0.7,
      colorThresholds: {
        pri: { green: 92, amber: 80 },
        criticalRatio: { amber: 0.15, red: 0.35 },
        esxFailShare: { amber: 0.03, red: 0.07 },
      },
    },
  },
  {
    id: 'executive',
    label: 'Executive Overview',
    tagline: 'Relaxed thresholds for a high-level fleet-health read.',
    highlights: ['Lenient thresholds', 'Softened weights'],
    config: {
      // Softened weights so granular failures move the score less.
      errorWeights: {
        HARDWARE_FAILURE: 0.8,
        HOST_FAILURE: 0.8,
        POWER_FAILURE: 0.75,
        STORAGE_FAILURE: 0.7,
        NETWORK_FAILURE: 0.5,
        IP_FAILURE: 0.45,
        RESOURCE_FAILURE: 0.35,
      },
      outlierResourceImpact: { memory: 0.2, cores: 0.2, storage: 0.15 },
      fleetDeviationImpact: 0.03,
      crWeight: 0.08,
      crThreshold: 0.85,
      colorThresholds: {
        pri: { green: 75, amber: 55 },
        criticalRatio: { amber: 0.45, red: 0.75 },
        esxFailShare: { amber: 0.1, red: 0.2 },
      },
    },
  },
];

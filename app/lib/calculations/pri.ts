import { ErrorType, DEFAULT_ERROR_WEIGHTS, CRITICAL_ERRORS } from '../constants/error-weights';

// ── Config ────────────────────────────────────────────────────────────────────

export interface ColorThresholds {
  pri: { green: number; amber: number };
  criticalRatio: { amber: number; red: number };
  esxFailShare: { amber: number; red: number };
}

export interface PRIConfig {
  errorWeights: Record<ErrorType, number>;
  iqrMultiplier: number;
  colorThresholds: ColorThresholds;
}

export const DEFAULT_PRI_CONFIG: PRIConfig = {
  errorWeights: DEFAULT_ERROR_WEIGHTS,
  iqrMultiplier: 1.5,
  colorThresholds: {
    pri: { green: 85, amber: 70 },
    criticalRatio: { amber: 0.3, red: 0.6 },
    esxFailShare: { amber: 0.05, red: 0.1 },
  },
};

export type ZoneColor = 'green' | 'amber' | 'red';

// ── PRI formula weights ───────────────────────────────────────────────────────

export const PRI_WEIGHTS = {
  successRate: 0.8,
  stability: 0.2,
  errorPenalty: 0.1,
  outlierPenalty: 0.05,
} as const;

export type PRIContribution = {
  label: string;
  points: number; // signed: negative = loss from 100
};

export interface PRIBreakdown {
  base: 100;
  successLoss: number;
  stabilityLoss: number;
  errorLoss: number;
  outlierLoss: number;
  total: number; // base + all losses (clamped to [0, 100])
  contributions: PRIContribution[]; // ordered by loss magnitude, descending
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface PRICalculationMetrics {
  totalServers: number;
  successfulServers: number;
  failedServers: number;
  successRate: number;
  failureRate: number;
  avgProvisionTime: number;
  medianProvisionTime: number;
  stabilityScore: number;
  errorPenalty: number;
  outlierPenalty: number;
  outlierRatio: number;
  outlierUpperFence: number;
  cascadedFailures: number;
  criticalRatio: number;
  esxFailShare: number;
  color: ZoneColor;
  priScore: number;
  breakdown: PRIBreakdown;
}

export interface ComputeServerData {
  id: number;
  parent_server_id: number | null;
  node_type: 'HOST' | 'VM';
  status: 'provisioned' | 'failed';
  provision_percent: number;
  provision_time: number;
  error_type: string | null;
}

// ── Math helpers ──────────────────────────────────────────────────────────────

function sortedNums(nums: number[]): number[] {
  return [...nums].sort((a, b) => a - b);
}

export function calculateMedian(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = sortedNums(nums);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function quartiles(nums: number[]): { q1: number; q3: number; iqr: number } {
  if (nums.length < 2) return { q1: nums[0] ?? 0, q3: nums[0] ?? 0, iqr: 0 };
  const s = sortedNums(nums);
  const n = s.length;
  const lowerHalf = s.slice(0, Math.floor(n / 2));
  const upperHalf = s.slice(Math.ceil(n / 2));
  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);
  return { q1, q3, iqr: q3 - q1 };
}

// ── Component score functions ─────────────────────────────────────────────────

/**
 * PRI score loss breakdown from 100. Each loss term is a non-negative number
 * representing points subtracted by that factor.
 */
export function calculatePRIBreakdown(
  successRate: number,
  stabilityScore: number,
  errorPenalty: number,
  outlierPenalty: number,
): PRIBreakdown {
  const w = PRI_WEIGHTS;
  const successLoss = (100 - successRate) * w.successRate;
  const stabilityLoss = (100 - stabilityScore) * w.stability;
  const errorLoss = errorPenalty * w.errorPenalty;
  const outlierLoss = outlierPenalty * w.outlierPenalty;

  const total = Math.max(
    0,
    Math.min(100, 100 - successLoss - stabilityLoss - errorLoss - outlierLoss),
  );

  const contributions: PRIContribution[] = [
    { label: 'Success rate', points: -successLoss },
    { label: 'Stability', points: -stabilityLoss },
    { label: 'Error severity', points: -errorLoss },
    { label: 'Provision time outliers', points: -outlierLoss },
  ].sort((a, b) => a.points - b.points);

  return { base: 100, successLoss, stabilityLoss, errorLoss, outlierLoss, total, contributions };
}

export function calculatePRIScore(
  successRate: number,
  stabilityScore: number,
  errorPenalty: number = 0,
  outlierPenalty: number = 0,
): number {
  return calculatePRIBreakdown(successRate, stabilityScore, errorPenalty, outlierPenalty).total;
}

export function calculateStabilityScore(
  provisionTimes: number[],
  avgProvisionTime: number,
): number {
  if (provisionTimes.length === 0 || avgProvisionTime === 0) return 100;

  const variance =
    provisionTimes.reduce((acc, t) => acc + Math.pow(t - avgProvisionTime, 2), 0) /
    provisionTimes.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avgProvisionTime) * 100;

  return Math.max(0, Math.min(100, 100 - cv));
}

export function calculateErrorPenalty(
  errorCounts: Map<ErrorType, number>,
  totalServers: number,
  customWeights: Record<ErrorType, number> = DEFAULT_ERROR_WEIGHTS,
): number {
  if (totalServers === 0) return 0;

  let weightedCount = 0;
  errorCounts.forEach((count, errorType) => {
    const weight = customWeights[errorType] ?? 1.0;
    weightedCount += count * weight;
  });

  return Math.min(100, (weightedCount / totalServers) * 100);
}

export function calculateOutlierResult(
  provisionTimes: number[],
  iqrMultiplier: number = 1.5,
): { ratio: number; upperFence: number; penalty: number } {
  if (provisionTimes.length < 4) {
    return { ratio: 0, upperFence: Infinity, penalty: 0 };
  }

  const { q3, iqr } = quartiles(provisionTimes);
  const upperFence = q3 + iqrMultiplier * iqr;

  if (iqr === 0) {
    return { ratio: 0, upperFence, penalty: 0 };
  }

  const outlierCount = provisionTimes.filter(t => t > upperFence).length;
  const ratio = outlierCount / provisionTimes.length;
  return { ratio, upperFence, penalty: ratio * 100 };
}

export function calculateDependencyPenalty(
  vmFailuresFromHostFailure: number,
  totalVMs: number,
): number {
  if (totalVMs === 0) return 0;
  return (vmFailuresFromHostFailure / totalVMs) * 100;
}

// ── Color ─────────────────────────────────────────────────────────────────────

export function calculateColor(
  priScore: number,
  criticalRatio: number,
  esxFailShare: number,
  thresholds: ColorThresholds = DEFAULT_PRI_CONFIG.colorThresholds,
): ZoneColor {
  const t = thresholds;

  if (
    priScore < t.pri.amber ||
    criticalRatio >= t.criticalRatio.red ||
    esxFailShare >= t.esxFailShare.red
  ) {
    return 'red';
  }

  if (
    priScore >= t.pri.green &&
    criticalRatio < t.criticalRatio.amber &&
    esxFailShare < t.esxFailShare.amber
  ) {
    return 'green';
  }

  return 'amber';
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

export function aggregatePRIMetrics(
  servers: ComputeServerData[],
  config?: Partial<PRIConfig>,
): PRICalculationMetrics {
  const cfg: PRIConfig = {
    ...DEFAULT_PRI_CONFIG,
    ...config,
    errorWeights: { ...DEFAULT_PRI_CONFIG.errorWeights, ...config?.errorWeights },
    colorThresholds: {
      ...DEFAULT_PRI_CONFIG.colorThresholds,
      ...config?.colorThresholds,
      pri: { ...DEFAULT_PRI_CONFIG.colorThresholds.pri, ...config?.colorThresholds?.pri },
      criticalRatio: { ...DEFAULT_PRI_CONFIG.colorThresholds.criticalRatio, ...config?.colorThresholds?.criticalRatio },
      esxFailShare: { ...DEFAULT_PRI_CONFIG.colorThresholds.esxFailShare, ...config?.colorThresholds?.esxFailShare },
    },
  };

  const empty: PRICalculationMetrics = {
    totalServers: 0,
    successfulServers: 0,
    failedServers: 0,
    successRate: 0,
    failureRate: 0,
    avgProvisionTime: 0,
    medianProvisionTime: 0,
    stabilityScore: 100,
    errorPenalty: 0,
    outlierPenalty: 0,
    outlierRatio: 0,
    outlierUpperFence: 0,
    cascadedFailures: 0,
    criticalRatio: 0,
    esxFailShare: 0,
    color: 'green',
    priScore: 0,
    breakdown: {
      base: 100,
      successLoss: 0,
      stabilityLoss: 0,
      errorLoss: 0,
      outlierLoss: 0,
      total: 0,
      contributions: [],
    },
  };

  if (servers.length === 0) return empty;

  // Cascade dedup: VMs whose parent ESX failed are excluded from base PRI
  const failedHostIds = new Set(
    servers
      .filter(s => s.node_type === 'HOST' && s.status === 'failed')
      .map(s => s.id),
  );

  const isCascaded = (s: ComputeServerData) =>
    s.node_type === 'VM' &&
    s.error_type === 'HOST_FAILURE' &&
    s.parent_server_id !== null &&
    failedHostIds.has(s.parent_server_id);

  const cascaded = servers.filter(isCascaded);
  const effectiveServers = servers.filter(s => !isCascaded(s));
  const cascadedFailures = cascaded.length;

  const totalServers = effectiveServers.length;
  if (totalServers === 0) {
    return { ...empty, cascadedFailures };
  }

  const successfulServers = effectiveServers.filter(s => s.status === 'provisioned').length;
  const failedServers = totalServers - successfulServers;
  const successRate = (successfulServers / totalServers) * 100;
  const failureRate = (failedServers / totalServers) * 100;

  const allTimes = effectiveServers.map(s => s.provision_time);
  const avgProvisionTime = allTimes.reduce((sum, t) => sum + t, 0) / totalServers;
  const medianProvisionTime = calculateMedian(allTimes);

  const stabilityScore = calculateStabilityScore(allTimes, avgProvisionTime);

  const errorCounts = new Map<ErrorType, number>();
  effectiveServers.forEach(s => {
    if (s.error_type) {
      const cur = errorCounts.get(s.error_type as ErrorType) ?? 0;
      errorCounts.set(s.error_type as ErrorType, cur + 1);
    }
  });

  const errorPenalty = calculateErrorPenalty(errorCounts, totalServers, cfg.errorWeights);

  const outlier = calculateOutlierResult(allTimes, cfg.iqrMultiplier);

  const breakdown = calculatePRIBreakdown(
    successRate,
    stabilityScore,
    errorPenalty,
    outlier.penalty,
  );
  const priScore = breakdown.total;

  // Color inputs
  const totalErrors = Array.from(errorCounts.values()).reduce((a, b) => a + b, 0);
  const criticalCount = CRITICAL_ERRORS.reduce(
    (sum, et) => sum + (errorCounts.get(et) ?? 0),
    0,
  );
  const criticalRatio = totalErrors > 0 ? criticalCount / totalErrors : 0;

  const failedHosts = effectiveServers.filter(
    s => s.node_type === 'HOST' && s.status === 'failed',
  ).length;
  const esxFailShare = totalServers > 0 ? failedHosts / totalServers : 0;

  const color = calculateColor(priScore, criticalRatio, esxFailShare, cfg.colorThresholds);

  return {
    totalServers,
    successfulServers,
    failedServers,
    successRate,
    failureRate,
    avgProvisionTime,
    medianProvisionTime,
    stabilityScore,
    errorPenalty,
    outlierPenalty: outlier.penalty,
    outlierRatio: outlier.ratio,
    outlierUpperFence: outlier.upperFence,
    cascadedFailures,
    criticalRatio,
    esxFailShare,
    color,
    priScore,
    breakdown,
  };
}

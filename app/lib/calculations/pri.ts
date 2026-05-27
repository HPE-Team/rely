import { ErrorType, DEFAULT_ERROR_WEIGHTS, CRITICAL_ERRORS } from '../constants/error-weights';

// ── Config ────────────────────────────────────────────────────────────────────

export interface ColorThresholds {
  pri: { green: number; amber: number };
  criticalRatio: { amber: number; red: number };
  esxFailShare: { amber: number; red: number };
}

export interface PRIConfig {
  errorWeights: Record<ErrorType, number>;
  /** Per-resource impact on the Tukey fence multiplier k. Range [0, 1] each.
   *  k_i = clamp(1.5 + α_mem·(mem_i/med_mem − 1) + α_cpu·(cores_i/med_cores − 1) + α_stor·(stor_i/med_stor − 1), 0.5, 4)
   *  Higher alpha → bigger VMs get more slack; smaller VMs get tighter fences. */
  outlierResourceImpact: { memory: number; cores: number; storage: number };
  /** Weight applied to the fleet-deviation penalty: points = max(0, fleetPRI − zonePRI) × impact.
   *  Range [0, 0.2]. Post-hoc deduction after all other breakdown components. */
  fleetDeviationImpact: number;
  /** Weight applied to Capacity Reliability loss: crLoss = (1 − CR) × crWeight × 100.
   *  CR = weighted resource saturation across hosts via 1/(1+u²) decay. Range [0, 0.25]. */
  crWeight: number;
  colorThresholds: ColorThresholds;
}

export const DEFAULT_PRI_CONFIG: PRIConfig = {
  errorWeights: DEFAULT_ERROR_WEIGHTS,
  outlierResourceImpact: { memory: 0.3, cores: 0.3, storage: 0.2 },
  fleetDeviationImpact: 0.05,
  crWeight: 0.15,
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
  /** Points deducted due to host capacity saturation (CR formula). 0 when no hosts in scope. */
  crLoss: number;
  /** Points deducted because this zone's PRI is below the fleet baseline. 0 when no fleet context. */
  fleetDeviationLoss: number;
  total: number; // base + all losses (clamped to [0, 100])
  contributions: PRIContribution[]; // ordered by loss magnitude, descending
}

// ── Result types ──────────────────────────────────────────────────────────────

/** Per-server Tukey fence metadata — returned alongside outlier results. */
export interface OutlierServerFence {
  id: number;
  k: number;
  fence: number;
  max_memory: number;
  max_cores: number;
  max_storage: number;
}

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
  /** Reference fence using the fixed k=1.5 baseline — used for display labels. */
  outlierDefaultFence: number;
  /** Per-server dynamic fence data (k_i, fence_i, resources). */
  outlierPerServerFences: OutlierServerFence[];
  cascadedFailures: number;
  criticalRatio: number;
  esxFailShare: number;
  /** Points deducted due to fleet-deviation penalty. 0 when no fleet context provided. */
  fleetDeviationLoss: number;
  /** Capacity Reliability score in (0, 1]. 1.0 = no saturation, lower = overcommitted hosts. */
  crScore: number;
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
  max_memory?: number | null;
  max_cores?: number | null;
  max_storage?: number | null;
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

/** Linear-interpolation percentile. p ∈ [0, 100]. Returns 0 for empty arrays. */
export function calculatePercentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const s = sortedNums(nums);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (idx - lo) * (s[hi] - s[lo]);
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

/** Computes the median of an array of positive numbers, ignoring zeros and nulls. */
function positiveMedian(values: Array<number | null | undefined>): number {
  const valid = values.filter((v): v is number => typeof v === 'number' && v > 0);
  return calculateMedian(valid);
}

// ── Capacity Reliability ──────────────────────────────────────────────────────

export interface HostCapacityData {
  hostId: number;
  u_cpu: number;
  u_mem: number;
  u_stor: number;
  cr: number;
  vmCount: number;
}

/**
 * Computes Capacity Reliability (CR) for a pool of servers.
 *
 * CR = 0.4·score_cpu + 0.4·score_mem + 0.2·score_stor
 * score = 1 / (1 + u²)   where u = Σ(vm.resource) / host.resource
 *
 * Aggregated as a VM-count-weighted mean across hosts.
 * Returns CR=1.0 (no penalty) when no hosts are present or no VMs are allocated.
 */
export function calculateCapacityReliability(
  servers: ComputeServerData[],
): { cr: number; perHostData: HostCapacityData[] } {
  const hosts = servers.filter(s => s.node_type === 'HOST');
  const vms = servers.filter(s => s.node_type === 'VM');

  if (hosts.length === 0) return { cr: 1, perHostData: [] };

  const vmsByHost = new Map<number, ComputeServerData[]>();
  vms.forEach(vm => {
    if (vm.parent_server_id !== null) {
      const list = vmsByHost.get(vm.parent_server_id) ?? [];
      list.push(vm);
      vmsByHost.set(vm.parent_server_id, list);
    }
  });

  const score = (u: number) => 1 / (1 + u * u);

  const perHostData: HostCapacityData[] = hosts.map(host => {
    const childVMs = vmsByHost.get(host.id) ?? [];

    const allocCpu = childVMs.reduce((s, vm) => s + (vm.max_cores ?? 0), 0);
    const allocMem = childVMs.reduce((s, vm) => s + (vm.max_memory ?? 0), 0);
    const allocStor = childVMs.reduce((s, vm) => s + (vm.max_storage ?? 0), 0);

    const hostCpu = host.max_cores ?? 0;
    const hostMem = host.max_memory ?? 0;
    const hostStor = host.max_storage ?? 0;

    const u_cpu = hostCpu > 0 ? allocCpu / hostCpu : 0;
    const u_mem = hostMem > 0 ? allocMem / hostMem : 0;
    const u_stor = hostStor > 0 ? allocStor / hostStor : 0;

    const cr = 0.4 * score(u_cpu) + 0.4 * score(u_mem) + 0.2 * score(u_stor);

    return { hostId: host.id, u_cpu, u_mem, u_stor, cr, vmCount: childVMs.length };
  });

  const totalVMs = perHostData.reduce((s, h) => s + h.vmCount, 0);
  if (totalVMs === 0) return { cr: 1, perHostData };

  const weightedCR = perHostData.reduce((s, h) => s + h.cr * h.vmCount, 0) / totalVMs;
  return { cr: weightedCR, perHostData };
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
  fleetDeviationLoss: number = 0,
  crLoss: number = 0,
): PRIBreakdown {
  const w = PRI_WEIGHTS;
  const successLoss = (100 - successRate) * w.successRate;
  const stabilityLoss = (100 - stabilityScore) * w.stability;
  const errorLoss = errorPenalty * w.errorPenalty;
  const outlierLoss = outlierPenalty * w.outlierPenalty;

  const total = Math.max(
    0,
    Math.min(100, 100 - successLoss - stabilityLoss - errorLoss - outlierLoss - crLoss - fleetDeviationLoss),
  );

  const contributions: PRIContribution[] = [
    { label: 'Success rate', points: -successLoss },
    { label: 'Stability', points: -stabilityLoss },
    { label: 'Error severity', points: -errorLoss },
    { label: 'Provision time outliers', points: -outlierLoss },
    { label: 'Capacity reliability', points: -crLoss },
    { label: 'Fleet deviation', points: -fleetDeviationLoss },
  ].sort((a, b) => a.points - b.points);

  return { base: 100, successLoss, stabilityLoss, errorLoss, outlierLoss, crLoss, fleetDeviationLoss, total, contributions };
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

/**
 * Computes dynamic per-server Tukey fences where each server's fence multiplier k_i
 * scales with its resource requirements relative to the fleet median.
 *
 * k_i = clamp(1.5 + α_mem·(mem_i/med_mem − 1) + α_cpu·(cores_i/med_cores − 1) + α_stor·(stor_i/med_stor − 1), 0.5, 4)
 *
 * Servers with missing/zero resources get zero contribution from that dimension (k_i → 1.5 base).
 * Returns per-server fence data alongside aggregate outlier stats.
 */
export function calculateOutlierResult(
  servers: Array<Pick<ComputeServerData, 'id' | 'provision_time' | 'max_memory' | 'max_cores' | 'max_storage'>>,
  outlierResourceImpact: { memory: number; cores: number; storage: number } = DEFAULT_PRI_CONFIG.outlierResourceImpact,
): { ratio: number; defaultFence: number; penalty: number; perServerFences: OutlierServerFence[] } {
  if (servers.length < 4) {
    return { ratio: 0, defaultFence: Infinity, penalty: 0, perServerFences: [] };
  }

  const times = servers.map(s => s.provision_time);
  const { q3, iqr } = quartiles(times);

  const defaultFence = q3 + 1.5 * iqr;

  if (iqr === 0) {
    const perServerFences = servers.map(s => ({
      id: s.id,
      k: 1.5,
      fence: defaultFence,
      max_memory: s.max_memory ?? 0,
      max_cores: s.max_cores ?? 0,
      max_storage: s.max_storage ?? 0,
    }));
    return { ratio: 0, defaultFence, penalty: 0, perServerFences };
  }

  const medMemory = positiveMedian(servers.map(s => s.max_memory));
  const medCores = positiveMedian(servers.map(s => s.max_cores));
  const medStorage = positiveMedian(servers.map(s => s.max_storage));

  const BASE_K = 1.5;

  const perServerFences: OutlierServerFence[] = servers.map(s => {
    const mem = s.max_memory ?? 0;
    const cores = s.max_cores ?? 0;
    const storage = s.max_storage ?? 0;

    // ratio = (resource / median) - 1; 0 contribution when median is 0 (all missing data)
    const rMem = medMemory > 0 ? (mem / medMemory) - 1 : 0;
    const rCores = medCores > 0 ? (cores / medCores) - 1 : 0;
    const rStorage = medStorage > 0 ? (storage / medStorage) - 1 : 0;

    const k = Math.max(0.5, Math.min(4,
      BASE_K
      + outlierResourceImpact.memory * rMem
      + outlierResourceImpact.cores * rCores
      + outlierResourceImpact.storage * rStorage
    ));

    return {
      id: s.id,
      k,
      fence: q3 + k * iqr,
      max_memory: mem,
      max_cores: cores,
      max_storage: storage,
    };
  });

  const outlierCount = perServerFences.filter(
    (sf, i) => servers[i].provision_time > sf.fence
  ).length;
  const ratio = outlierCount / servers.length;

  return { ratio, defaultFence, penalty: ratio * 100, perServerFences };
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
  criticalCount: number = 0,
): ZoneColor {
  const t = thresholds;

  if (
    priScore < t.pri.amber ||
    (criticalCount >= 2 && criticalRatio >= t.criticalRatio.red) ||
    esxFailShare >= t.esxFailShare.red
  ) {
    return 'red';
  }

  if (
    priScore >= t.pri.green &&
    (criticalCount < 2 || criticalRatio < t.criticalRatio.amber) &&
    esxFailShare < t.esxFailShare.amber
  ) {
    return 'green';
  }

  return 'amber';
}

// ── Aggregate ─────────────────────────────────────────────────────────────────

/**
 * @param servers         Servers to score.
 * @param config          PRI configuration overrides.
 * @param fleetPRIScore   Fleet-wide PRI (no deviation penalty applied). When provided,
 *                        zones below the fleet baseline incur a fleet-deviation deduction.
 */
export function aggregatePRIMetrics(
  servers: ComputeServerData[],
  config?: Partial<PRIConfig>,
  fleetPRIScore?: number,
): PRICalculationMetrics {
  const cfg: PRIConfig = {
    ...DEFAULT_PRI_CONFIG,
    ...config,
    errorWeights: { ...DEFAULT_PRI_CONFIG.errorWeights, ...config?.errorWeights },
    outlierResourceImpact: { ...DEFAULT_PRI_CONFIG.outlierResourceImpact, ...config?.outlierResourceImpact },
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
    outlierDefaultFence: 0,
    outlierPerServerFences: [],
    cascadedFailures: 0,
    criticalRatio: 0,
    esxFailShare: 0,
    fleetDeviationLoss: 0,
    crScore: 1,
    color: 'green',
    priScore: 0,
    breakdown: {
      base: 100,
      successLoss: 0,
      stabilityLoss: 0,
      errorLoss: 0,
      outlierLoss: 0,
      crLoss: 0,
      fleetDeviationLoss: 0,
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

  const outlier = calculateOutlierResult(effectiveServers, cfg.outlierResourceImpact);

  // Capacity Reliability: host utilization pressure via 1/(1+u²) decay
  const { cr: crScore } = calculateCapacityReliability(servers);
  const crLoss = (1 - crScore) * cfg.crWeight * 100;

  // Fleet-deviation penalty: only applied when zone PRI is below fleet baseline
  const rawPRIBreakdown = calculatePRIBreakdown(successRate, stabilityScore, errorPenalty, outlier.penalty, 0, crLoss);
  const rawPRI = rawPRIBreakdown.total;

  const fleetDeviationLoss = fleetPRIScore !== undefined
    ? Math.max(0, fleetPRIScore - rawPRI) * cfg.fleetDeviationImpact
    : 0;

  const breakdown = calculatePRIBreakdown(successRate, stabilityScore, errorPenalty, outlier.penalty, fleetDeviationLoss, crLoss);

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

  const color = calculateColor(priScore, criticalRatio, esxFailShare, cfg.colorThresholds, criticalCount);

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
    outlierDefaultFence: outlier.defaultFence,
    outlierPerServerFences: outlier.perServerFences,
    cascadedFailures,
    criticalRatio,
    esxFailShare,
    fleetDeviationLoss,
    crScore,
    color,
    priScore,
    breakdown,
  };
}

import { ErrorType, DEFAULT_ERROR_WEIGHTS } from '../constants/error-weights';

export interface PRICalculationMetrics {
  totalServers: number;
  successfulServers: number;
  failedServers: number;
  successRate: number;
  failureRate: number;
  avgProvisionTime: number;
  stabilityScore: number;
  errorPenalty: number;
  priScore: number;
}

/**
 * Calculate PRI Score using weighted metrics
 * Formula: (Success Rate × 0.4) + (Performance × 0.3) + (Stability × 0.2) - (Error Penalty × 0.1)
 * 
 * Score range: 0-100 (higher is better)
 */
export function calculatePRIScore(
  successRate: number,
  performanceScore: number,
  stabilityScore: number,
  errorPenalty: number = 0
): number {
  const pri = (successRate * 0.4) + (performanceScore * 0.3) + (stabilityScore * 0.2) - (errorPenalty * 0.1);
  return Math.max(0, Math.min(100, pri));
}

/**
 * Calculate performance score based on provision time
 * Assumes ideal provisioning time is 60 seconds
 * Score = 100 - (avgProvisionTime / idealTime) * 100, capped at 0-100
 */
export function calculatePerformanceScore(avgProvisionTime: number, idealTime: number = 60): number {
  const rawScore = 100 - (avgProvisionTime / idealTime) * 100;
  return Math.max(0, Math.min(100, rawScore));
}

/**
 * Calculate stability score from provision time variance
 * Lower variance = higher stability
 * Uses coefficient of variation: (stdDev / mean) * 100
 */
export function calculateStabilityScore(
  provisionTimes: number[],
  avgProvisionTime: number
): number {
  if (provisionTimes.length === 0 || avgProvisionTime === 0) {
    return 100;
  }

  const variance = provisionTimes.reduce(
    (acc, time) => acc + Math.pow(time - avgProvisionTime, 2),
    0
  ) / provisionTimes.length;

  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / avgProvisionTime) * 100;

  // Score: 100 - CV, capped at 0-100
  return Math.max(0, Math.min(100, 100 - coefficientOfVariation));
}

/**
 * Calculate error penalty based on failure types and weights
 * Returns penalty as percentage (0-100)
 */
export function calculateErrorPenalty(
  errorCounts: Map<ErrorType, number>,
  totalServers: number,
  customWeights: Record<ErrorType, number> = DEFAULT_ERROR_WEIGHTS
): number {
  if (totalServers === 0) {
    return 0;
  }

  let weightedErrorCount = 0;

  errorCounts.forEach((count, errorType) => {
    const weight = customWeights[errorType] || 1.0;
    weightedErrorCount += count * weight;
  });

  // Normalize to 0-100 scale
  const penalty = (weightedErrorCount / totalServers) * 100;
  return Math.min(100, penalty);
}

/**
 * Calculate dependency penalty for VM failures caused by host failure
 */
export function calculateDependencyPenalty(
  vmFailuresFromHostFailure: number,
  totalVMs: number
): number {
  if (totalVMs === 0) {
    return 0;
  }
  return (vmFailuresFromHostFailure / totalVMs) * 100;
}

/**
 * Calculate latency penalty for slow provisioning
 * Applies penalty to successful provisions that took too long
 */
export function calculateLatencyPenalty(
  successfulProvisionTimes: number[],
  slowThreshold: number = 120 // seconds
): number {
  if (successfulProvisionTimes.length === 0) {
    return 0;
  }

  const slowCount = successfulProvisionTimes.filter(time => time > slowThreshold).length;
  return (slowCount / successfulProvisionTimes.length) * 100;
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

/**
 * Aggregate PRI metrics from compute server data
 */
export function aggregatePRIMetrics(
  servers: ComputeServerData[],
  customWeights?: Record<ErrorType, number>
): PRICalculationMetrics {
  const totalServers = servers.length;

  if (totalServers === 0) {
    return {
      totalServers: 0,
      successfulServers: 0,
      failedServers: 0,
      successRate: 0,
      failureRate: 0,
      avgProvisionTime: 0,
      stabilityScore: 100,
      errorPenalty: 0,
      priScore: 0,
    };
  }

  // Count successes and failures
  const successfulServers = servers.filter(s => s.status === 'provisioned').length;
  const failedServers = totalServers - successfulServers;

  // Calculate rates
  const successRate = (successfulServers / totalServers) * 100;
  const failureRate = (failedServers / totalServers) * 100;

  // Calculate average provision time
  const avgProvisionTime = servers.reduce((sum, s) => sum + s.provision_time, 0) / totalServers;

  // Calculate stability score
  const stabilityScore = calculateStabilityScore(
    servers.map(s => s.provision_time),
    avgProvisionTime
  );

  // Calculate performance score
  const performanceScore = calculatePerformanceScore(avgProvisionTime);

  // Count errors by type
  const errorCounts = new Map<ErrorType, number>();
  servers.forEach(server => {
    if (server.error_type) {
      const current = errorCounts.get(server.error_type as ErrorType) || 0;
      errorCounts.set(server.error_type as ErrorType, current + 1);
    }
  });

  // Calculate error penalty
  const errorPenalty = calculateErrorPenalty(errorCounts, totalServers, customWeights);

  // Calculate final PRI score
  const priScore = calculatePRIScore(successRate, performanceScore, stabilityScore, errorPenalty);

  return {
    totalServers,
    successfulServers,
    failedServers,
    successRate,
    failureRate,
    avgProvisionTime,
    stabilityScore,
    errorPenalty,
    priScore,
  };
}

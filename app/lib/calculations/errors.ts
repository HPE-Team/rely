import {
  ErrorType,
  ERROR_CLASSIFICATIONS,
  getErrorPhaseFromProvisionPercent,
  ErrorPhase,
} from '../constants/error-weights';

export interface ErrorBreakdown {
  type: ErrorType;
  count: number;
  percentage: number;
  phase: ErrorPhase;
  severity: string;
}

export interface ErrorDistribution {
  byType: Map<ErrorType, number>;
  byPhase: Map<ErrorPhase, number>;
  byNodeType: Map<'HOST' | 'VM', number>;
  total: number;
}

export interface ComputeServerForErrors {
  id: number;
  parent_server_id: number | null;
  node_type: 'HOST' | 'VM';
  status: 'provisioned' | 'failed';
  provision_percent: number;
  error_type: string | null;
  error_message: string | null;
}

/**
 * Analyze error distribution across servers
 */
export function analyzeErrorDistribution(
  servers: ComputeServerForErrors[]
): ErrorDistribution {
  const byType = new Map<ErrorType, number>();
  const byPhase = new Map<ErrorPhase, number>();
  const byNodeType = new Map<'HOST' | 'VM', number>();

  servers.forEach(server => {
    if (server.error_type) {
      const errorType = server.error_type as ErrorType;
      
      // Count by type
      byType.set(errorType, (byType.get(errorType) || 0) + 1);

      // Count by phase
      const phase = getErrorPhaseFromProvisionPercent(
        Number(server.provision_percent),
        server.status
      );
      byPhase.set(phase, (byPhase.get(phase) || 0) + 1);

      // Count by node type
      byNodeType.set(server.node_type, (byNodeType.get(server.node_type) || 0) + 1);
    }
  });

  return {
    byType,
    byPhase,
    byNodeType,
    total: servers.filter(s => s.error_type).length,
  };
}

/**
 * Get formatted error breakdown for charts
 */
export function getErrorBreakdown(distribution: ErrorDistribution): ErrorBreakdown[] {
  const total = distribution.total;

  return Array.from(distribution.byType.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
    phase: ERROR_CLASSIFICATIONS[type].phase,
    severity: ERROR_CLASSIFICATIONS[type].severity,
  }));
}

/**
 * Separate errors by pre-provision and post-provision
 */
export function separateErrorsByPhase(servers: ComputeServerForErrors[]) {
  const preProvisionErrors: ComputeServerForErrors[] = [];
  const postProvisionErrors: ComputeServerForErrors[] = [];

  servers.forEach(server => {
    if (server.error_type) {
      const phase = getErrorPhaseFromProvisionPercent(
        Number(server.provision_percent),
        server.status
      );

      if (phase === 'pre-provision') {
        preProvisionErrors.push(server);
      } else {
        postProvisionErrors.push(server);
      }
    }
  });

  return { preProvisionErrors, postProvisionErrors };
}

/**
 * Categorize errors by type and return formatted data for charts
 */
export function getCategorizedErrors(
  errors: ComputeServerForErrors[]
): Record<ErrorType, ComputeServerForErrors[]> {
  const categorized = {} as Record<ErrorType, ComputeServerForErrors[]>;

  const errorTypes: ErrorType[] = [
    'HARDWARE_FAILURE',
    'RESOURCE_FAILURE',
    'STORAGE_FAILURE',
    'NETWORK_FAILURE',
    'IP_FAILURE',
    'POWER_FAILURE',
    'HOST_FAILURE',
  ];

  errorTypes.forEach(type => {
    categorized[type] = errors.filter(e => e.error_type === type);
  });

  return categorized;
}

/**
 * Analyze host failure impact on VMs
 */
export function analyzeHostFailureImpact(
  hosts: ComputeServerForErrors[],
  vms: ComputeServerForErrors[]
): {
  failedHosts: number;
  affectedVMs: number;
  impactPercentage: number;
} {
  const failedHostIds = new Set(
    hosts
      .filter(h => h.error_type === 'HOST_FAILURE')
      .map(h => h.id)
  );

  const affectedVMs = vms.filter(vm => failedHostIds.has(vm.parent_server_id || -1)).length;

  return {
    failedHosts: failedHostIds.size,
    affectedVMs,
    impactPercentage: vms.length > 0 ? (affectedVMs / vms.length) * 100 : 0,
  };
}

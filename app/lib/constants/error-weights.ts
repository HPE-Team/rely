export type ErrorType = 
  | 'HARDWARE_FAILURE'
  | 'RESOURCE_FAILURE'
  | 'STORAGE_FAILURE'
  | 'NETWORK_FAILURE'
  | 'IP_FAILURE'
  | 'POWER_FAILURE'
  | 'HOST_FAILURE';

export type ErrorPhase = 'pre-provision' | 'post-provision';

export interface ErrorClassification {
  type: ErrorType;
  phase: ErrorPhase;
  severity: 'critical' | 'high' | 'medium' | 'low';
  defaultWeight: number;
  description: string;
}

export const ERROR_CLASSIFICATIONS: Record<ErrorType, ErrorClassification> = {
  HARDWARE_FAILURE: {
    type: 'HARDWARE_FAILURE',
    phase: 'post-provision',
    severity: 'critical',
    defaultWeight: 1.0,
    description: 'Hardware failure detected during/after provisioning',
  },
  STORAGE_FAILURE: {
    type: 'STORAGE_FAILURE',
    phase: 'post-provision',
    severity: 'critical',
    defaultWeight: 0.9,
    description: 'Storage allocation or access failure',
  },
  POWER_FAILURE: {
    type: 'POWER_FAILURE',
    phase: 'post-provision',
    severity: 'critical',
    defaultWeight: 0.95,
    description: 'Power state failure during provisioning',
  },
  NETWORK_FAILURE: {
    type: 'NETWORK_FAILURE',
    phase: 'post-provision',
    severity: 'high',
    defaultWeight: 0.7,
    description: 'Network configuration or connectivity failure',
  },
  HOST_FAILURE: {
    type: 'HOST_FAILURE',
    phase: 'post-provision',
    severity: 'critical',
    defaultWeight: 1.0,
    description: 'Host/ESX unavailability affecting VMs',
  },
  RESOURCE_FAILURE: {
    type: 'RESOURCE_FAILURE',
    phase: 'pre-provision',
    severity: 'medium',
    defaultWeight: 0.5,
    description: 'Insufficient resources during planning phase',
  },
  IP_FAILURE: {
    type: 'IP_FAILURE',
    phase: 'pre-provision',
    severity: 'high',
    defaultWeight: 0.6,
    description: 'IP allocation or reservation failure',
  },
};

export const DEFAULT_ERROR_WEIGHTS: Record<ErrorType, number> = Object.entries(ERROR_CLASSIFICATIONS).reduce(
  (acc, [key, value]) => {
    acc[key as ErrorType] = value.defaultWeight;
    return acc;
  },
  {} as Record<ErrorType, number>
);

export const PRE_PROVISION_ERRORS: ErrorType[] = [
  'RESOURCE_FAILURE',
  'IP_FAILURE',
];

export const POST_PROVISION_ERRORS: ErrorType[] = [
  'HARDWARE_FAILURE',
  'STORAGE_FAILURE',
  'POWER_FAILURE',
  'NETWORK_FAILURE',
  'HOST_FAILURE',
];

export function getErrorPhase(errorType: ErrorType): ErrorPhase {
  return ERROR_CLASSIFICATIONS[errorType].phase;
}

export function getErrorPhaseFromProvisionPercent(
  provision_percent: number,
  status: string
): ErrorPhase {
  // Pre-provision errors: detected when provision_percent is low/zero even if status is provisioned
  // Post-provision errors: detected after provisioning was attempted (status = failed)
  if (status === 'provisioned' && provision_percent < 100) {
    return 'pre-provision';
  }
  return 'post-provision';
}

export interface ComputeServerRow {
  id: number;
  parent_server_id: number | null;
  node_type: 'HOST' | 'VM';
  status: 'provisioned' | 'failed';
  status_percent: string | null;
  provision_percent: string;
  status_message: string | null;
  error_type: string | null;
  error_message: string | null;
  provision_time: number;
  status_date: string;
  max_memory: number;
  max_cores: number;
  max_storage: number;
  power_state: 'on' | 'off';
  zone_id: string;
}

export interface HostSummary {
  id: number;
  status: 'provisioned' | 'failed';
  provision_time: number;
  power_state: string;
  max_memory: number;
  max_cores: number;
  max_storage: number;
  error_type: string | null;
  vm_count: number;
  failed_vm_count: number;
  success_rate: number;
  vm_memory_total: number;
  vm_cores_total: number;
  vm_storage_total: number;
  memory_ratio: number;
  cores_ratio: number;
  storage_ratio: number;
}

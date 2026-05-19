import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MOCK_HOSTS = [
  {
    id: 1,
    status: 'provisioned' as const,
    provision_time: 42.5,
    power_state: 'on',
    max_memory: 524288,
    max_cores: 64,
    max_storage: 4096,
    error_type: null,
    vm_count: 8,
    failed_vm_count: 1,
    success_rate: 87.5,
  },
  {
    id: 2,
    status: 'provisioned' as const,
    provision_time: 38.1,
    power_state: 'on',
    max_memory: 262144,
    max_cores: 32,
    max_storage: 2048,
    error_type: null,
    vm_count: 12,
    failed_vm_count: 0,
    success_rate: 100,
  },
  {
    id: 3,
    status: 'failed' as const,
    provision_time: 61.2,
    power_state: 'off',
    max_memory: 524288,
    max_cores: 64,
    max_storage: 4096,
    error_type: 'HARDWARE_FAILURE',
    vm_count: 6,
    failed_vm_count: 6,
    success_rate: 0,
  },
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: zoneId } = await params;

  if (!db) {
    return NextResponse.json({
      success: true,
      data: { zone_id: zoneId, hosts: MOCK_HOSTS },
      _note: 'Mock data (no DB)',
    });
  }

  try {
    // Fetch hosts and all zone VMs in parallel — avoids N+1
    const [hosts, vms] = await Promise.all([
      db
        .select()
        .from(compute_server2)
        .where(and(eq(compute_server2.zone_id, zoneId), eq(compute_server2.node_type, 'HOST'))),
      db
        .select({
          parent_server_id: compute_server2.parent_server_id,
          status: compute_server2.status,
        })
        .from(compute_server2)
        .where(and(eq(compute_server2.zone_id, zoneId), eq(compute_server2.node_type, 'VM'))),
    ]);

    if (hosts.length === 0) {
      return NextResponse.json({
        success: true,
        data: { zone_id: zoneId, hosts: [] },
        timestamp: new Date().toISOString(),
      });
    }

    // Aggregate VM counts per host
    const vmsByHost = new Map<number, { total: number; failed: number }>();
    for (const vm of vms) {
      if (vm.parent_server_id == null) continue;
      const entry = vmsByHost.get(vm.parent_server_id) ?? { total: 0, failed: 0 };
      entry.total++;
      if (vm.status === 'failed') entry.failed++;
      vmsByHost.set(vm.parent_server_id, entry);
    }

    const r2 = (n: number) => Math.round(n * 100) / 100;

    const enriched = hosts.map(h => {
      const agg = vmsByHost.get(h.id) ?? { total: 0, failed: 0 };
      const successRate =
        agg.total > 0 ? ((agg.total - agg.failed) / agg.total) * 100 : 100;
      return {
        id: h.id,
        status: h.status,
        provision_time: r2(h.provision_time),
        power_state: h.power_state,
        max_memory: h.max_memory,
        max_cores: h.max_cores,
        max_storage: h.max_storage,
        error_type: h.error_type,
        vm_count: agg.total,
        failed_vm_count: agg.failed,
        success_rate: r2(successRate),
      };
    });

    return NextResponse.json({
      success: true,
      data: { zone_id: zoneId, hosts: enriched },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching zone hosts:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

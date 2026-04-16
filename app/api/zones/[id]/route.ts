import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { aggregatePRIMetrics } from '@/app/lib/calculations/pri';
import { analyzeErrorDistribution, separateErrorsByPhase, analyzeHostFailureImpact } from '@/app/lib/calculations/errors';
import { eq } from 'drizzle-orm';

// Mock data for development
const getMockDetail = (zoneId: string) => ({
  zone_id: zoneId,
  overall: {
    pri_score: 92.5,
    success_rate: 94.2,
    failure_rate: 5.8,
    avg_provision_time: 45.3,
    stability_score: 88.5,
    total_servers: 50,
    successful_servers: 47,
    failed_servers: 3,
  },
  hosts: {
    pri_score: 96.2,
    success_rate: 100,
    total: 10,
    failed: 0,
  },
  vms: {
    pri_score: 91.3,
    success_rate: 92.5,
    total: 40,
    failed: 3,
  },
  errors: {
    error_type_breakdown: [
      { type: 'NETWORK_FAILURE', count: 2, percentage: 66.7 },
      { type: 'IP_FAILURE', count: 1, percentage: 33.3 },
    ],
    pre_provision_errors: 1,
    post_provision_errors: 2,
    by_node_type: {
      hosts: 0,
      vms: 3,
    },
    host_failure_impact: {
      failedHosts: 0,
      affectedVMs: 0,
      impactPercentage: 0,
    },
  },
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: zoneId } = await params;

    if (!db) {
      return NextResponse.json({
        success: true,
        data: getMockDetail(zoneId),
        _note: 'Mock data (no DB)',
      });
    }

    try {
      const servers = await db
        .select()
        .from(compute_server2)
        .where(eq(compute_server2.zone_id, zoneId));

      if (servers.length === 0) {
        return NextResponse.json(
          { success: true, data: getMockDetail(zoneId), _note: 'Mock data' },
          { status: 200 }
        );
      }

      const hosts = servers.filter((s: any) => s.node_type === 'HOST');
      const vms = servers.filter((s: any) => s.node_type === 'VM');

      const zonePRIMetrics = aggregatePRIMetrics(
        servers.map((s: any) => ({
          id: s.id,
          parent_server_id: s.parent_server_id,
          node_type: s.node_type,
          status: s.status,
          provision_percent: Number(s.provision_percent),
          provision_time: s.provision_time,
          error_type: s.error_type,
        }))
      );

      const hostPRIMetrics = aggregatePRIMetrics(
        hosts.map((s: any) => ({
          id: s.id,
          parent_server_id: s.parent_server_id,
          node_type: s.node_type,
          status: s.status,
          provision_percent: Number(s.provision_percent),
          provision_time: s.provision_time,
          error_type: s.error_type,
        }))
      );

      const vmPRIMetrics = aggregatePRIMetrics(
        vms.map((s: any) => ({
          id: s.id,
          parent_server_id: s.parent_server_id,
          node_type: s.node_type,
          status: s.status,
          provision_percent: Number(s.provision_percent),
          provision_time: s.provision_time,
          error_type: s.error_type,
        }))
      );

      const errorDistribution = analyzeErrorDistribution(
        servers.map((s: any) => ({
          id: s.id,
          parent_server_id: s.parent_server_id,
          node_type: s.node_type,
          status: s.status,
          provision_percent: Number(s.provision_percent),
          error_type: s.error_type,
          error_message: s.error_message,
        }))
      );

      const serverForErrors = servers.map((s: any) => ({
        id: s.id,
        parent_server_id: s.parent_server_id,
        node_type: s.node_type,
        status: s.status,
        provision_percent: Number(s.provision_percent),
        error_type: s.error_type,
        error_message: s.error_message,
      }));

      const { preProvisionErrors, postProvisionErrors } = separateErrorsByPhase(serverForErrors);

      const hostFailureImpact = analyzeHostFailureImpact(
        hosts.map((s: any) => ({
          id: s.id,
          parent_server_id: s.parent_server_id,
          node_type: s.node_type,
          status: s.status,
          provision_percent: Number(s.provision_percent),
          error_type: s.error_type,
          error_message: s.error_message,
        })),
        vms.map((s: any) => ({
          id: s.id,
          parent_server_id: s.parent_server_id,
          node_type: s.node_type,
          status: s.status,
          provision_percent: Number(s.provision_percent),
          error_type: s.error_type,
          error_message: s.error_message,
        }))
      );

      const errorTypeBreakdown = Array.from(errorDistribution.byType.entries()).map(
        ([type, count]) => ({
          type,
          count,
          percentage: errorDistribution.total > 0 ? (count / errorDistribution.total) * 100 : 0,
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          zone_id: zoneId,
          overall: {
            pri_score: Math.round(zonePRIMetrics.priScore * 100) / 100,
            success_rate: Math.round(zonePRIMetrics.successRate * 100) / 100,
            failure_rate: Math.round(zonePRIMetrics.failureRate * 100) / 100,
            avg_provision_time: Math.round(zonePRIMetrics.avgProvisionTime * 100) / 100,
            stability_score: Math.round(zonePRIMetrics.stabilityScore * 100) / 100,
            total_servers: zonePRIMetrics.totalServers,
            successful_servers: zonePRIMetrics.successfulServers,
            failed_servers: zonePRIMetrics.failedServers,
          },
          hosts: {
            pri_score: Math.round(hostPRIMetrics.priScore * 100) / 100,
            success_rate: Math.round(hostPRIMetrics.successRate * 100) / 100,
            total: hosts.length,
            failed: hostPRIMetrics.failedServers,
          },
          vms: {
            pri_score: Math.round(vmPRIMetrics.priScore * 100) / 100,
            success_rate: Math.round(vmPRIMetrics.successRate * 100) / 100,
            total: vms.length,
            failed: vmPRIMetrics.failedServers,
          },
          errors: {
            error_type_breakdown: errorTypeBreakdown,
            pre_provision_errors: preProvisionErrors.length,
            post_provision_errors: postProvisionErrors.length,
            by_node_type: {
              hosts: errorDistribution.byNodeType.get('HOST') || 0,
              vms: errorDistribution.byNodeType.get('VM') || 0,
            },
            host_failure_impact: hostFailureImpact,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr) {
      return NextResponse.json({
        success: true,
        data: getMockDetail(zoneId),
        _note: 'Mock data - database connection failed',
      });
    }
  } catch (error) {
    console.error('Error fetching zone details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

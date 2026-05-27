import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { aggregatePRIMetrics, calculatePercentile, type PRIBreakdown } from '@/app/lib/calculations/pri';
import { parsePRIConfig } from '@/app/lib/config/pri-config';
import { analyzeErrorDistribution, separateErrorsByPhase, analyzeHostFailureImpact } from '@/app/lib/calculations/errors';
import { eq } from 'drizzle-orm';

const mockBreakdown = (score: number): PRIBreakdown => ({
  base: 100,
  successLoss: (100 - score) * 0.4,
  stabilityLoss: (100 - score) * 0.4,
  errorLoss: (100 - score) * 0.15,
  outlierLoss: (100 - score) * 0.05,
  crLoss: 0,
  fleetDeviationLoss: 0,
  total: score,
  contributions: [
    { label: 'Success rate', points: -(100 - score) * 0.4 },
    { label: 'Stability', points: -(100 - score) * 0.4 },
    { label: 'Error severity', points: -(100 - score) * 0.15 },
    { label: 'Provision time outliers', points: -(100 - score) * 0.05 },
    { label: 'Capacity reliability', points: 0 },
    { label: 'Fleet deviation', points: 0 },
  ],
});

const getMockDetail = (zoneId: string) => ({
  zone_id: zoneId,
  overall: {
    pri_breakdown: mockBreakdown(92.5),
    pri_score: 92.5,
    success_rate: 94.2,
    failure_rate: 5.8,
    avg_provision_time: 45.3,
    median_provision_time: 42.1,
    provision_percentiles: { p50: 42.1, p75: 58.4, p95: 98.7, p99: 142.3 },
    stability_score: 88.5,
    total_servers: 50,
    successful_servers: 47,
    failed_servers: 3,
    cascaded_failures: 0,
    outlier_ratio: 0.04,
    outlier_default_fence: 120,
    fleet_pri_score: null,
    fleet_deviation_penalty: 0,
    outlier_servers: [
      { id: 42, node_type: 'VM', provision_time: 145.2, status: 'provisioned', error_type: null, k: 1.5, fence: 120, max_memory: 8192, max_cores: 4, max_storage: 100 },
      { id: 51, node_type: 'VM', provision_time: 132.8, status: 'provisioned', error_type: null, k: 1.5, fence: 120, max_memory: 4096, max_cores: 2, max_storage: 50 },
    ],
    color: 'green',
  },
  hosts: {
    pri_breakdown: mockBreakdown(96.2),
    pri_score: 96.2,
    success_rate: 100,
    total: 10,
    failed: 0,
    color: 'green',
  },
  vms: {
    pri_breakdown: mockBreakdown(91.3),
    pri_score: 91.3,
    success_rate: 92.5,
    total: 40,
    failed: 3,
    color: 'amber',
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
    const config = parsePRIConfig(new URL(req.url).searchParams.get('config'));

    if (!db) {
      return NextResponse.json({
        success: true,
        data: getMockDetail(zoneId),
        _note: 'Mock data (no DB)',
      });
    }

    try {
      // Fetch zone servers and all servers in parallel for fleet PRI
      const [servers, allServers] = await Promise.all([
        db.select().from(compute_server2).where(eq(compute_server2.zone_id, zoneId)),
        db.select().from(compute_server2),
      ]);

      if (servers.length === 0) {
        return NextResponse.json(
          { success: true, data: getMockDetail(zoneId), _note: 'Mock data' },
          { status: 200 }
        );
      }

      const hosts = servers.filter((s: any) => s.node_type === 'HOST');
      const vms = servers.filter((s: any) => s.node_type === 'VM');

      const toInput = (s: any) => ({
        id: s.id,
        parent_server_id: s.parent_server_id,
        node_type: s.node_type,
        status: s.status,
        provision_percent: Number(s.provision_percent),
        provision_time: s.provision_time,
        error_type: s.error_type,
        max_memory: s.max_memory,
        max_cores: s.max_cores,
        max_storage: s.max_storage,
      });

      // Compute fleet PRI without deviation penalty (it is the baseline reference)
      const fleetPRIMetrics = aggregatePRIMetrics(allServers.map(toInput), config);
      const fleetPRIScore = fleetPRIMetrics.priScore;

      const zonePRIMetrics = aggregatePRIMetrics(servers.map(toInput), config, fleetPRIScore);
      const hostPRIMetrics = aggregatePRIMetrics(hosts.map(toInput), config);
      const vmPRIMetrics = aggregatePRIMetrics(vms.map(toInput), config);

      const toErrorInput = (s: any) => ({
        id: s.id,
        parent_server_id: s.parent_server_id,
        node_type: s.node_type,
        status: s.status,
        provision_percent: Number(s.provision_percent),
        error_type: s.error_type,
        error_message: s.error_message,
      });

      const errorDistribution = analyzeErrorDistribution(servers.map(toErrorInput));
      const { preProvisionErrors, postProvisionErrors } = separateErrorsByPhase(
        servers.map(toErrorInput)
      );
      const hostFailureImpact = analyzeHostFailureImpact(
        hosts.map(toErrorInput),
        vms.map(toErrorInput)
      );

      const errorTypeBreakdown = Array.from(errorDistribution.byType.entries()).map(
        ([type, count]) => ({
          type,
          count,
          percentage: errorDistribution.total > 0 ? (count / errorDistribution.total) * 100 : 0,
        })
      );

      const r2 = (n: number) => Math.round(n * 100) / 100;

      const provTimes = servers.map((s: any) => Number(s.provision_time)).filter((t: number) => t > 0);
      const provPercentiles = {
        p50: r2(calculatePercentile(provTimes, 50)),
        p75: r2(calculatePercentile(provTimes, 75)),
        p95: r2(calculatePercentile(provTimes, 95)),
        p99: r2(calculatePercentile(provTimes, 99)),
      };

      // Build outlier server list using per-server dynamic fences
      const perServerFences = zonePRIMetrics.outlierPerServerFences;
      const fenceById = new Map(perServerFences.map(f => [f.id, f]));

      const outlierServers =
        perServerFences.length > 0
          ? servers
              .filter((s: any) => {
                const sf = fenceById.get(s.id);
                return sf !== undefined && s.provision_time > sf.fence;
              })
              .map((s: any) => {
                const sf = fenceById.get(s.id)!;
                return {
                  id: s.id,
                  node_type: s.node_type,
                  provision_time: r2(s.provision_time),
                  status: s.status,
                  error_type: s.error_type,
                  k: r2(sf.k),
                  fence: r2(sf.fence),
                  max_memory: sf.max_memory,
                  max_cores: sf.max_cores,
                  max_storage: sf.max_storage,
                };
              })
              .sort((a: any, b: any) => b.provision_time - a.provision_time)
          : [];

      return NextResponse.json({
        success: true,
        data: {
          zone_id: zoneId,
          overall: {
            pri_breakdown: zonePRIMetrics.breakdown,
            pri_score: r2(zonePRIMetrics.priScore),
            success_rate: r2(zonePRIMetrics.successRate),
            failure_rate: r2(zonePRIMetrics.failureRate),
            avg_provision_time: r2(zonePRIMetrics.avgProvisionTime),
            median_provision_time: r2(zonePRIMetrics.medianProvisionTime),
            provision_percentiles: provPercentiles,
            stability_score: r2(zonePRIMetrics.stabilityScore),
            total_servers: zonePRIMetrics.totalServers,
            successful_servers: zonePRIMetrics.successfulServers,
            failed_servers: zonePRIMetrics.failedServers,
            cascaded_failures: zonePRIMetrics.cascadedFailures,
            outlier_ratio: r2(zonePRIMetrics.outlierRatio * 100),
            outlier_default_fence: r2(zonePRIMetrics.outlierDefaultFence),
            fleet_pri_score: r2(fleetPRIScore),
            fleet_deviation_penalty: r2(zonePRIMetrics.fleetDeviationLoss),
            outlier_servers: outlierServers,
            color: zonePRIMetrics.color,
          },
          hosts: {
            pri_breakdown: hostPRIMetrics.breakdown,
            pri_score: r2(hostPRIMetrics.priScore),
            success_rate: r2(hostPRIMetrics.successRate),
            total: hosts.length,
            failed: hostPRIMetrics.failedServers,
            color: hostPRIMetrics.color,
          },
          vms: {
            pri_breakdown: vmPRIMetrics.breakdown,
            pri_score: r2(vmPRIMetrics.priScore),
            success_rate: r2(vmPRIMetrics.successRate),
            total: vms.length,
            failed: vmPRIMetrics.failedServers,
            color: vmPRIMetrics.color,
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

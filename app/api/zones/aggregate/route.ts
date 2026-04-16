import { NextResponse } from "next/server";
import { db } from "@/app/lib/db/connection";
import { compute_server2, zones } from "@/app/lib/db/schema";
import {
  aggregatePRIMetrics,
  type ComputeServerData,
} from "@/app/lib/calculations/pri";
import {
  analyzeErrorDistribution,
  separateErrorsByPhase,
  type ComputeServerForErrors,
} from "@/app/lib/calculations/errors";
import type { ErrorType } from "@/app/lib/constants/error-weights";

type ZoneComparison = {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  failed_count: number;
  error_rate: number;
};

const MOCK_ZONES = [
  {
    zone_id: "zone-a",
    pri_score: 92.5,
    success_rate: 94.2,
    total_servers: 50,
    hosts_count: 10,
    vms_count: 40,
    failed_count: 3,
  },
  {
    zone_id: "zone-b",
    pri_score: 87.3,
    success_rate: 89.5,
    total_servers: 45,
    hosts_count: 9,
    vms_count: 36,
    failed_count: 5,
  },
  {
    zone_id: "zone-c",
    pri_score: 88.9,
    success_rate: 91.2,
    total_servers: 55,
    hosts_count: 11,
    vms_count: 44,
    failed_count: 5,
  },
  {
    zone_id: "zone-d",
    pri_score: 95.1,
    success_rate: 96.8,
    total_servers: 48,
    hosts_count: 8,
    vms_count: 40,
    failed_count: 1,
  },
] as const;

const MOCK_ERROR_BREAKDOWN: Array<{ type: ErrorType; count: number }> = [
  { type: "NETWORK_FAILURE", count: 6 },
  { type: "HARDWARE_FAILURE", count: 3 },
  { type: "IP_FAILURE", count: 2 },
  { type: "RESOURCE_FAILURE", count: 1 },
  { type: "STORAGE_FAILURE", count: 1 },
  { type: "POWER_FAILURE", count: 1 },
];

function toPRIInput(
  server: typeof compute_server2.$inferSelect,
): ComputeServerData {
  return {
    id: server.id,
    parent_server_id: server.parent_server_id,
    node_type: server.node_type,
    status: server.status,
    provision_percent: Number(server.provision_percent),
    provision_time: Number(server.provision_time),
    error_type: server.error_type,
  };
}

function toErrorInput(
  server: typeof compute_server2.$inferSelect,
): ComputeServerForErrors {
  return {
    id: server.id,
    parent_server_id: server.parent_server_id,
    node_type: server.node_type,
    status: server.status,
    provision_percent: Number(server.provision_percent),
    error_type: server.error_type,
    error_message: server.error_message,
  };
}

function buildMockAggregateData() {
  const totalZones = MOCK_ZONES.length;
  const totalServers = MOCK_ZONES.reduce((sum, zone) => sum + zone.total_servers, 0);
  const totalErrors = MOCK_ZONES.reduce((sum, zone) => sum + zone.failed_count, 0);
  const totalHosts = MOCK_ZONES.reduce((sum, zone) => sum + zone.hosts_count, 0);
  const totalVMs = MOCK_ZONES.reduce((sum, zone) => sum + zone.vms_count, 0);
  const avgPriScore =
    MOCK_ZONES.reduce((sum, zone) => sum + zone.pri_score, 0) / totalZones;
  const avgSuccessRate =
    MOCK_ZONES.reduce((sum, zone) => sum + zone.success_rate, 0) / totalZones;
  const preProvisionTotal = MOCK_ERROR_BREAKDOWN
    .filter((entry) => ["RESOURCE_FAILURE", "IP_FAILURE"].includes(entry.type))
    .reduce((sum, entry) => sum + entry.count, 0);
  const postProvisionTotal = totalErrors - preProvisionTotal;
  const sortedZones = [...MOCK_ZONES].sort((a, b) => a.pri_score - b.pri_score);

  return {
    overview: {
      total_zones: totalZones,
      total_servers: totalServers,
      total_errors: totalErrors,
      total_hosts: totalHosts,
      total_vms: totalVMs,
      avg_pri_score: Number(avgPriScore.toFixed(2)),
      avg_success_rate: Number(avgSuccessRate.toFixed(2)),
      most_reliable_zone: sortedZones.at(-1)?.zone_id ?? null,
      highest_risk_zone: sortedZones[0]?.zone_id ?? null,
    },
    errors: {
      total: totalErrors,
      pre_provision_total: preProvisionTotal,
      post_provision_total: postProvisionTotal,
      by_type: MOCK_ERROR_BREAKDOWN.map((entry) => ({
        type: entry.type,
        count: entry.count,
        percentage: totalErrors > 0 ? (entry.count / totalErrors) * 100 : 0,
      })),
      by_node_type: {
        hosts: 3,
        vms: totalErrors - 3,
      },
    },
    zones_comparison: MOCK_ZONES.map((zone) => ({
      zone_id: zone.zone_id,
      pri_score: zone.pri_score,
      success_rate: zone.success_rate,
      total_servers: zone.total_servers,
      failed_count: zone.failed_count,
      error_rate:
        zone.total_servers > 0 ? (zone.failed_count / zone.total_servers) * 100 : 0,
    })),
  };
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({
        success: true,
        data: buildMockAggregateData(),
        timestamp: new Date().toISOString(),
        _note: "Mock data - configure database connection in .env.local",
      });
    }

    const [zoneRows, serverRows] = await Promise.all([
      db.select().from(zones),
      db.select().from(compute_server2),
    ]);

    if (serverRows.length === 0) {
      return NextResponse.json({
        success: true,
        data: buildMockAggregateData(),
        timestamp: new Date().toISOString(),
        _note: "Mock data - no server data available",
      });
    }

    const zoneIds = new Set([
      ...zoneRows.map((zone) => zone.zone_id),
      ...serverRows.map((server) => server.zone_id),
    ]);

    const serversByZone = new Map<string, typeof compute_server2.$inferSelect[]>();
    for (const server of serverRows) {
      const list = serversByZone.get(server.zone_id) ?? [];
      list.push(server);
      serversByZone.set(server.zone_id, list);
    }

    const zoneComparison: ZoneComparison[] = Array.from(zoneIds).map((zoneId) => {
      const zoneServers = serversByZone.get(zoneId) ?? [];
      const zoneMetrics = aggregatePRIMetrics(zoneServers.map(toPRIInput));
      const failedCount = zoneMetrics.failedServers;

      return {
        zone_id: zoneId,
        pri_score: Number(zoneMetrics.priScore.toFixed(2)),
        success_rate: Number(zoneMetrics.successRate.toFixed(2)),
        total_servers: zoneMetrics.totalServers,
        failed_count: failedCount,
        error_rate:
          zoneMetrics.totalServers > 0
            ? Number(((failedCount / zoneMetrics.totalServers) * 100).toFixed(2))
            : 0,
      };
    });

    const sortedByPri = [...zoneComparison].sort((a, b) => a.pri_score - b.pri_score);
    const allPRIMetrics = aggregatePRIMetrics(serverRows.map(toPRIInput));
    const allErrorData = serverRows.map(toErrorInput);
    const errorDistribution = analyzeErrorDistribution(allErrorData);
    const { preProvisionErrors, postProvisionErrors } =
      separateErrorsByPhase(allErrorData);
    const totalErrors = errorDistribution.total;
    const totalHosts = serverRows.filter((server) => server.node_type === "HOST").length;
    const totalVMs = serverRows.filter((server) => server.node_type === "VM").length;
    const avgPRI =
      zoneComparison.length > 0
        ? zoneComparison.reduce((sum, zone) => sum + zone.pri_score, 0) /
          zoneComparison.length
        : allPRIMetrics.priScore;
    const avgSuccessRate =
      zoneComparison.length > 0
        ? zoneComparison.reduce((sum, zone) => sum + zone.success_rate, 0) /
          zoneComparison.length
        : allPRIMetrics.successRate;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_zones: zoneComparison.length,
          total_servers: allPRIMetrics.totalServers,
          total_errors: totalErrors,
          total_hosts: totalHosts,
          total_vms: totalVMs,
          avg_pri_score: Number(avgPRI.toFixed(2)),
          avg_success_rate: Number(avgSuccessRate.toFixed(2)),
          most_reliable_zone: sortedByPri.at(-1)?.zone_id ?? null,
          highest_risk_zone: sortedByPri[0]?.zone_id ?? null,
        },
        errors: {
          total: totalErrors,
          pre_provision_total: preProvisionErrors.length,
          post_provision_total: postProvisionErrors.length,
          by_type: Array.from(errorDistribution.byType.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
              type,
              count,
              percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0,
            })),
          by_node_type: {
            hosts: errorDistribution.byNodeType.get("HOST") ?? 0,
            vms: errorDistribution.byNodeType.get("VM") ?? 0,
          },
        },
        zones_comparison: [...zoneComparison].sort(
          (a, b) => b.pri_score - a.pri_score,
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching aggregate zone metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db/connection";
import { compute_server2, zones } from "@/app/lib/db/schema";
import {
  aggregatePRIMetrics,
  calculateColor,
  DEFAULT_PRI_CONFIG,
  type ComputeServerData,
  type ZoneColor,
} from "@/app/lib/calculations/pri";
import {
  analyzeErrorDistribution,
  separateErrorsByPhase,
  type ComputeServerForErrors,
} from "@/app/lib/calculations/errors";
import { parsePRIConfig } from "@/app/lib/config/pri-config";
import type { ErrorType } from "@/app/lib/constants/error-weights";

type ZoneComparison = {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  failed_count: number;
  error_rate: number;
  color: ZoneColor;
};

const MOCK_ZONES = [
  { zone_id: "zone-a", pri_score: 92.5, success_rate: 94.2, total_servers: 50, hosts_count: 10, vms_count: 40, failed_count: 3, color: "green" as ZoneColor },
  { zone_id: "zone-b", pri_score: 87.3, success_rate: 89.5, total_servers: 45, hosts_count: 9,  vms_count: 36, failed_count: 5, color: "amber" as ZoneColor },
  { zone_id: "zone-c", pri_score: 88.9, success_rate: 91.2, total_servers: 55, hosts_count: 11, vms_count: 44, failed_count: 5, color: "amber" as ZoneColor },
  { zone_id: "zone-d", pri_score: 95.1, success_rate: 96.8, total_servers: 48, hosts_count: 8,  vms_count: 40, failed_count: 1, color: "green" as ZoneColor },
] as const;

const MOCK_ERROR_BREAKDOWN: Array<{ type: ErrorType; count: number }> = [
  { type: "NETWORK_FAILURE", count: 6 },
  { type: "HARDWARE_FAILURE", count: 3 },
  { type: "IP_FAILURE", count: 2 },
  { type: "RESOURCE_FAILURE", count: 1 },
  { type: "STORAGE_FAILURE", count: 1 },
  { type: "POWER_FAILURE", count: 1 },
];

function toPRIInput(server: typeof compute_server2.$inferSelect): ComputeServerData {
  return {
    id: server.id,
    parent_server_id: server.parent_server_id,
    node_type: server.node_type,
    status: server.status,
    provision_percent: Number(server.provision_percent),
    provision_time: Number(server.provision_time),
    error_type: server.error_type,
    max_memory: server.max_memory,
    max_cores: server.max_cores,
    max_storage: server.max_storage,
  };
}

function toErrorInput(server: typeof compute_server2.$inferSelect): ComputeServerForErrors {
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
  const totalServers = MOCK_ZONES.reduce((sum, z) => sum + z.total_servers, 0);
  const totalErrors = MOCK_ZONES.reduce((sum, z) => sum + z.failed_count, 0);
  const totalHosts = MOCK_ZONES.reduce((sum, z) => sum + z.hosts_count, 0);
  const totalVMs = MOCK_ZONES.reduce((sum, z) => sum + z.vms_count, 0);
  const avgPriScore = MOCK_ZONES.reduce((sum, z) => sum + z.pri_score, 0) / totalZones;
  const avgSuccessRate = MOCK_ZONES.reduce((sum, z) => sum + z.success_rate, 0) / totalZones;
  const preProvisionTotal = MOCK_ERROR_BREAKDOWN
    .filter(e => ["RESOURCE_FAILURE", "IP_FAILURE"].includes(e.type))
    .reduce((sum, e) => sum + e.count, 0);
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
      fleet_color: "green" as ZoneColor,
    },
    errors: {
      total: totalErrors,
      pre_provision_total: preProvisionTotal,
      post_provision_total: totalErrors - preProvisionTotal,
      by_type: MOCK_ERROR_BREAKDOWN.map(e => ({
        type: e.type,
        count: e.count,
        percentage: totalErrors > 0 ? (e.count / totalErrors) * 100 : 0,
      })),
      by_node_type: { hosts: 3, vms: totalErrors - 3 },
    },
    zones_comparison: MOCK_ZONES.map(z => ({
      zone_id: z.zone_id,
      pri_score: z.pri_score,
      success_rate: z.success_rate,
      total_servers: z.total_servers,
      failed_count: z.failed_count,
      error_rate: z.total_servers > 0 ? (z.failed_count / z.total_servers) * 100 : 0,
      color: z.color,
    })),
  };
}

export async function GET(request: Request) {
  try {
    const config = parsePRIConfig(new URL(request.url).searchParams.get('config'));
    const colorThresholds = {
      ...DEFAULT_PRI_CONFIG.colorThresholds,
      ...config?.colorThresholds,
    };

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
      ...zoneRows.map(z => z.zone_id),
      ...serverRows.map(s => s.zone_id),
    ]);

    const serversByZone = new Map<string, typeof compute_server2.$inferSelect[]>();
    for (const server of serverRows) {
      const list = serversByZone.get(server.zone_id) ?? [];
      list.push(server);
      serversByZone.set(server.zone_id, list);
    }

    // Compute fleet PRI first (no deviation penalty — it is the reference baseline)
    const allPRIMetrics = aggregatePRIMetrics(serverRows.map(toPRIInput), config);
    const fleetPRIScore = allPRIMetrics.priScore;

    const zoneComparison: ZoneComparison[] = Array.from(zoneIds).map(zoneId => {
      const zoneServers = serversByZone.get(zoneId) ?? [];
      const m = aggregatePRIMetrics(zoneServers.map(toPRIInput), config, fleetPRIScore);
      return {
        zone_id: zoneId,
        pri_score: Number(m.priScore.toFixed(2)),
        success_rate: Number(m.successRate.toFixed(2)),
        total_servers: m.totalServers,
        failed_count: m.failedServers,
        error_rate: m.totalServers > 0
          ? Number(((m.failedServers / m.totalServers) * 100).toFixed(2))
          : 0,
        color: m.color,
      };
    });

    const sortedByPri = [...zoneComparison].sort((a, b) => a.pri_score - b.pri_score);
    const allErrorData = serverRows.map(toErrorInput);
    const errorDistribution = analyzeErrorDistribution(allErrorData);
    const { preProvisionErrors, postProvisionErrors } = separateErrorsByPhase(allErrorData);
    const totalErrors = errorDistribution.total;
    const totalHosts = serverRows.filter(s => s.node_type === "HOST").length;
    const totalVMs = serverRows.filter(s => s.node_type === "VM").length;

    const avgPRI = zoneComparison.length > 0
      ? zoneComparison.reduce((sum, z) => sum + z.pri_score, 0) / zoneComparison.length
      : allPRIMetrics.priScore;
    const avgSuccessRate = zoneComparison.length > 0
      ? zoneComparison.reduce((sum, z) => sum + z.success_rate, 0) / zoneComparison.length
      : allPRIMetrics.successRate;

    const fleetColor = calculateColor(
      allPRIMetrics.priScore,
      allPRIMetrics.criticalRatio,
      allPRIMetrics.esxFailShare,
      colorThresholds,
    );

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
          fleet_color: fleetColor,
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
        zones_comparison: [...zoneComparison].sort((a, b) => b.pri_score - a.pri_score),
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

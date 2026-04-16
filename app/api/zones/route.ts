import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { zones, compute_server2 } from '@/app/lib/db/schema';
import { aggregatePRIMetrics } from '@/app/lib/calculations/pri';
import { eq } from 'drizzle-orm';

// Mock data for development
const MOCK_ZONES = [
  {
    zone_id: 'zone-a',
    pri_score: 92.5,
    success_rate: 94.2,
    total_servers: 50,
    hosts_count: 10,
    vms_count: 40,
    failed_count: 3,
  },
  {
    zone_id: 'zone-b',
    pri_score: 87.3,
    success_rate: 89.5,
    total_servers: 45,
    hosts_count: 9,
    vms_count: 36,
    failed_count: 5,
  },
  {
    zone_id: 'zone-c',
    pri_score: 88.9,
    success_rate: 91.2,
    total_servers: 55,
    hosts_count: 11,
    vms_count: 44,
    failed_count: 5,
  },
  {
    zone_id: 'zone-d',
    pri_score: 95.1,
    success_rate: 96.8,
    total_servers: 48,
    hosts_count: 8,
    vms_count: 40,
    failed_count: 1,
  },
];

export async function GET() {
  try {
    // Try to fetch from database
    if (db) {
      try {
        const allZones = await db.select().from(zones);

        if (allZones.length > 0) {
          // Fetch real data
          const zonesWithPRI = await Promise.all(
            allZones.map(async (zone: any) => {
              const servers = await db!
                .select()
                .from(compute_server2)
                .where(eq(compute_server2.zone_id, zone.zone_id));

              const metrics = aggregatePRIMetrics(
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

              const hosts = servers.filter((s: any) => s.node_type === 'HOST').length;
              const vms = servers.filter((s: any) => s.node_type === 'VM').length;

              return {
                zone_id: zone.zone_id,
                pri_score: Math.round(metrics.priScore * 100) / 100,
                success_rate: Math.round(metrics.successRate * 100) / 100,
                total_servers: metrics.totalServers,
                hosts_count: hosts,
                vms_count: vms,
                failed_count: metrics.failedServers,
              };
            })
          );

          return NextResponse.json({
            success: true,
            data: zonesWithPRI,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (dbError) {
        console.warn('Database query failed, using mock data:', dbError);
      }
    }

    // Return mock data for development
    return NextResponse.json({
      success: true,
      data: MOCK_ZONES,
      timestamp: new Date().toISOString(),
      _note: 'Mock data - configure database connection in .env.local',
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        _hint: 'Check .env.local database configuration',
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { isNotNull } from 'drizzle-orm';
import type { ErrorType } from '@/app/lib/constants/error-weights';

export const dynamic = 'force-dynamic';

export type HeatmapZone = {
  zone_id: string;
  errors: Partial<Record<ErrorType, number>>;
};

const MOCK_DATA: HeatmapZone[] = [
  {
    zone_id: 'zone-a',
    errors: { NETWORK_FAILURE: 2, IP_FAILURE: 1, RESOURCE_FAILURE: 1 },
  },
  {
    zone_id: 'zone-b',
    errors: { HARDWARE_FAILURE: 3, NETWORK_FAILURE: 1, STORAGE_FAILURE: 1 },
  },
  {
    zone_id: 'zone-c',
    errors: { NETWORK_FAILURE: 4, HOST_FAILURE: 2, POWER_FAILURE: 1 },
  },
  {
    zone_id: 'zone-d',
    errors: { IP_FAILURE: 1 },
  },
];

export async function GET() {
  if (!db) {
    return NextResponse.json({ success: true, data: MOCK_DATA, _note: 'Mock data (no DB)' });
  }

  try {
    const rows = await db
      .select({
        zone_id: compute_server2.zone_id,
        error_type: compute_server2.error_type,
      })
      .from(compute_server2)
      .where(isNotNull(compute_server2.error_type));

    const byZone = new Map<string, Partial<Record<ErrorType, number>>>();
    for (const row of rows) {
      if (!row.error_type) continue;
      const zone = byZone.get(row.zone_id) ?? {};
      const et = row.error_type as ErrorType;
      zone[et] = (zone[et] ?? 0) + 1;
      byZone.set(row.zone_id, zone);
    }

    const data: HeatmapZone[] = Array.from(byZone.entries()).map(([zone_id, errors]) => ({
      zone_id,
      errors,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { zone_metrics } from '@/app/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: zoneId } = await params;
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') || '30', 10);

    if (!db) {
      return NextResponse.json({
        success: true,
        data: {
          zone_id: zoneId,
          metrics: [],
          count: 0,
        },
      });
    }

    // Fetch recent zone metrics
    const metrics = await db
      .select()
      .from(zone_metrics)
      .where(eq(zone_metrics.zone_id, zoneId))
      .orderBy(desc(zone_metrics.calculated_at));
    
    const limitedMetrics = metrics.slice(0, limitParam);

    // Reverse to get chronological order
    const chronologicalMetrics = limitedMetrics.reverse();

    const formattedMetrics = chronologicalMetrics.map((m: any) => ({
      timestamp: m.calculated_at?.toISOString(),
      pri_score: Number(m.pri_score),
      success_rate: Number(m.success_rate),
      failure_rate: Number(m.failure_rate),
      avg_provision_time: Number(m.avg_provision_time),
      stability_score: Number(m.stability_score),
      dependency_penalty: Number(m.dependency_penalty),
      latency_penalty: Number(m.latency_penalty),
    }));

    return NextResponse.json({
      success: true,
      data: {
        zone_id: zoneId,
        metrics: formattedMetrics,
        count: formattedMetrics.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching zone timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/app/lib/db/connection";
import { zone_metrics } from "@/app/lib/db/schema";
import { desc } from "drizzle-orm";

type FleetTrendPoint = {
  timestamp: string;
  pri_score: number;
  success_rate: number;
  stability_score: number;
};

function clampLimit(rawLimit: number): number {
  if (!Number.isFinite(rawLimit) || rawLimit <= 0) return 30;
  return Math.min(rawLimit, 90);
}

function buildMockTimeline(limit: number): FleetTrendPoint[] {
  const points = Math.max(7, Math.min(limit, 30));
  const now = new Date();

  return Array.from({ length: points }).map((_, index) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (points - index - 1));
    const drift = index % 5;

    return {
      timestamp: d.toISOString(),
      pri_score: Number((87 + drift * 1.4).toFixed(2)),
      success_rate: Number((89 + drift * 1.1).toFixed(2)),
      stability_score: Number((84 + drift * 1.3).toFixed(2)),
    };
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = clampLimit(
      Number.parseInt(searchParams.get("limit") ?? "30", 10),
    );

    if (!db) {
      const mockMetrics = buildMockTimeline(limit);
      return NextResponse.json({
        success: true,
        data: {
          metrics: mockMetrics,
          count: mockMetrics.length,
        },
        timestamp: new Date().toISOString(),
        _note: "Mock data - configure database connection in .env.local",
      });
    }

    const metricRows = await db
      .select()
      .from(zone_metrics)
      .orderBy(desc(zone_metrics.calculated_at));

    if (metricRows.length === 0) {
      const mockMetrics = buildMockTimeline(limit);
      return NextResponse.json({
        success: true,
        data: {
          metrics: mockMetrics,
          count: mockMetrics.length,
        },
        timestamp: new Date().toISOString(),
        _note: "Mock data - no historical metrics available",
      });
    }

    const groupedByDate = new Map<
      string,
      { pri: number; success: number; stability: number; count: number }
    >();

    for (const row of metricRows) {
      const dateKey = row.calculated_at.toISOString().slice(0, 10);
      const existing = groupedByDate.get(dateKey) ?? {
        pri: 0,
        success: 0,
        stability: 0,
        count: 0,
      };

      existing.pri += Number(row.pri_score);
      existing.success += Number(row.success_rate);
      existing.stability += Number(row.stability_score);
      existing.count += 1;
      groupedByDate.set(dateKey, existing);
    }

    const metrics = Array.from(groupedByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-limit)
      .map(([dateKey, values]) => ({
        timestamp: `${dateKey}T00:00:00.000Z`,
        pri_score: Number((values.pri / values.count).toFixed(2)),
        success_rate: Number((values.success / values.count).toFixed(2)),
        stability_score: Number((values.stability / values.count).toFixed(2)),
      }));

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        count: metrics.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching aggregate timeline:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

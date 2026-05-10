import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { and, asc, count, eq } from 'drizzle-orm';
import type { ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

function clampInt(raw: string | null, fallback: number, min: number, max: number) {
  const n = raw == null ? fallback : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function toNumberId(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'bigint') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function getInsertId(result: unknown): number | null {
  if (Array.isArray(result)) return getInsertId(result[0]);
  if (result && typeof result === 'object' && 'insertId' in result) {
    return toNumberId((result as ResultSetHeader).insertId);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured',
          _hint: 'Check .env.local database configuration',
        },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    // GET /api/compute-servers
    // Query params:
    // - limit: page size (default 50)
    // - offset: row offset (default 0)
    // - zone_id: optional filter
    // - node_type: optional filter (HOST|VM)
    const limit = clampInt(searchParams.get('limit'), 50, 1, 250);
    const offset = clampInt(searchParams.get('offset'), 0, 0, 1_000_000);
    const zoneId = searchParams.get('zone_id');
    const rawNodeType = searchParams.get('node_type');
    const nodeType = rawNodeType === 'HOST' || rawNodeType === 'VM' ? rawNodeType : null;

    const conditions = [
      ...(zoneId ? [eq(compute_server2.zone_id, zoneId)] : []),
      ...(nodeType ? [eq(compute_server2.node_type, nodeType)] : []),
    ];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // DB call: list rows (paged).
    const rowsPromise = (async () => {
      const q = db.select().from(compute_server2);
      const q2 = where ? q.where(where) : q;
      return q2.orderBy(asc(compute_server2.id)).limit(limit).offset(offset);
    })();

    // DB call: total count for pagination.
    const totalPromise = (async () => {
      const q = db.select({ total: count() }).from(compute_server2);
      const q2 = where ? q.where(where) : q;
      const r = await q2;
      return Number(r[0]?.total ?? 0);
    })();

    const [rows, total] = await Promise.all([rowsPromise, totalPromise]);

    return NextResponse.json({
      success: true,
      data: {
        items: rows,
        pagination: {
          limit,
          offset,
          total,
        },
        filters: {
          zone_id: zoneId,
          node_type: nodeType,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error listing compute servers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured',
          _hint: 'Check .env.local database configuration',
        },
        { status: 500 },
      );
    }

    // POST /api/compute-servers
    // Body: compute_server2 insert shape (id is auto-generated).
    let body: Partial<typeof compute_server2.$inferInsert>;
    try {
      const parsed: unknown = await req.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON body (expected object)' },
          { status: 400 },
        );
      }
      body = parsed as Partial<typeof compute_server2.$inferInsert>;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    // Minimal validation: required non-null columns from schema.
    const required = [
      'node_type',
      'status',
      'provision_percent',
      'provision_time',
      'status_date',
      'max_memory',
      'max_cores',
      'max_storage',
      'power_state',
      'zone_id',
    ] as const;

    for (const k of required) {
      if ((body as Record<string, unknown>)[k] == null) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${k}` },
          { status: 400 },
        );
      }
    }

    const rawNodeType = (body as Record<string, unknown>).node_type;
    if (rawNodeType !== 'HOST' && rawNodeType !== 'VM') {
      return NextResponse.json(
        { success: false, error: 'Invalid node_type (expected HOST or VM)' },
        { status: 400 },
      );
    }

    const rawStatus = (body as Record<string, unknown>).status;
    if (rawStatus !== 'provisioned' && rawStatus !== 'failed') {
      return NextResponse.json(
        { success: false, error: 'Invalid status (expected provisioned or failed)' },
        { status: 400 },
      );
    }

    if (typeof (body as Record<string, unknown>).status_date === 'string') {
      const d = new Date((body as Record<string, unknown>).status_date as string);
      if (!Number.isFinite(d.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid status_date (expected ISO date string)' },
          { status: 400 },
        );
      }
      (body as Record<string, unknown>).status_date = d;
    }

    // Perform insert and read back inserted row (MySQL doesn't support RETURNING).
    const values = body as typeof compute_server2.$inferInsert;
    // DB call: insert.
    const result = await db.insert(compute_server2).values(values);
    const insertId = getInsertId(result);
    if (!insertId) {
      return NextResponse.json(
        { success: false, error: 'Insert succeeded but insertId missing' },
        { status: 500 },
      );
    }

    // DB call: fetch inserted row by id.
    const rows = await db
      .select()
      .from(compute_server2)
      .where(eq(compute_server2.id, insertId));

    return NextResponse.json(
      {
        success: true,
        data: rows[0] ?? null,
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating compute server:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

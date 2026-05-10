import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

function parseId(raw: string) {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getAffectedRows(result: unknown): number {
  if (Array.isArray(result)) return getAffectedRows(result[0]);
  if (result && typeof result === 'object' && 'affectedRows' in result) {
    const v = (result as ResultSetHeader).affectedRows;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  }
  return 0;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    // GET /api/compute-servers/:id
    // DB call: fetch by primary key.
    const rows = await db.select().from(compute_server2).where(eq(compute_server2.id, id));
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching compute server:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    // PATCH /api/compute-servers/:id
    // Body: partial update; id cannot be changed.
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

    // Don't allow changing primary key.
    delete (body as Record<string, unknown>).id;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ success: false, error: 'Empty patch' }, { status: 400 });
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

    if ('node_type' in body) {
      const rawNodeType = (body as Record<string, unknown>).node_type;
      if (rawNodeType !== 'HOST' && rawNodeType !== 'VM') {
        return NextResponse.json(
          { success: false, error: 'Invalid node_type (expected HOST or VM)' },
          { status: 400 },
        );
      }
    }

    if ('status' in body) {
      const rawStatus = (body as Record<string, unknown>).status;
      if (rawStatus !== 'provisioned' && rawStatus !== 'failed') {
        return NextResponse.json(
          { success: false, error: 'Invalid status (expected provisioned or failed)' },
          { status: 400 },
        );
      }
    }

    // DB call: update.
    const result = await db
      .update(compute_server2)
      .set(body as Partial<typeof compute_server2.$inferInsert>)
      .where(eq(compute_server2.id, id));

    const affected = getAffectedRows(result);
    if (affected <= 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // DB call: fetch updated row.
    const rows = await db.select().from(compute_server2).where(eq(compute_server2.id, id));
    return NextResponse.json({
      success: true,
      data: rows[0] ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error patching compute server:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Full update: require all non-nullable columns.
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

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    // PUT /api/compute-servers/:id
    // Body: full replacement; requires all non-nullable fields; id cannot be changed.
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
    delete (body as Record<string, unknown>).id;

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

    // DB call: update.
    const result = await db
      .update(compute_server2)
      .set(body as typeof compute_server2.$inferInsert)
      .where(eq(compute_server2.id, id));

    const affected = getAffectedRows(result);
    if (affected <= 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // DB call: fetch updated row.
    const rows = await db.select().from(compute_server2).where(eq(compute_server2.id, id));
    return NextResponse.json({
      success: true,
      data: rows[0] ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating compute server:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    // DELETE /api/compute-servers/:id
    // DB call: delete by primary key.
    const result = await db.delete(compute_server2).where(eq(compute_server2.id, id));
    const affected = getAffectedRows(result);
    if (affected <= 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { id },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting compute server:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

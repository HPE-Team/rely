import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const hostId = Number.parseInt(idParam, 10);

  if (!Number.isFinite(hostId) || hostId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 },
    );
  }

  try {
    const [hostRows, vmRows] = await Promise.all([
      db.select().from(compute_server2).where(eq(compute_server2.id, hostId)),
      db.select().from(compute_server2).where(eq(compute_server2.parent_server_id, hostId)),
    ]);

    const host = hostRows[0];
    if (!host) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (host.node_type !== 'HOST') {
      return NextResponse.json({ success: false, error: 'Not a host' }, { status: 400 });
    }

    const vms = vmRows.filter(v => v.node_type === 'VM');

    return NextResponse.json({
      success: true,
      data: { host, vms },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching host VMs:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

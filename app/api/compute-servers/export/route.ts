import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { and, asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Column order and headers for the CSV output.
const CSV_COLUMNS: { key: keyof typeof compute_server2.$inferSelect; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'parent_server_id', label: 'Parent Server ID' },
  { key: 'node_type', label: 'Node Type' },
  { key: 'status', label: 'Status' },
  { key: 'status_percent', label: 'Health %' },
  { key: 'provision_percent', label: 'Provision %' },
  { key: 'status_message', label: 'Status Message' },
  { key: 'error_type', label: 'Error Type' },
  { key: 'error_message', label: 'Error Message' },
  { key: 'provision_time', label: 'Provision Time (s)' },
  { key: 'status_date', label: 'Status Date' },
  { key: 'max_memory', label: 'Max Memory (MB)' },
  { key: 'max_cores', label: 'Max Cores' },
  { key: 'max_storage', label: 'Max Storage (GB)' },
  { key: 'power_state', label: 'Power State' },
  { key: 'zone_id', label: 'Zone ID' },
];

/** Escape a single CSV field value. */
function csvField(value: unknown): string {
  if (value == null) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  // Wrap in double-quotes if the value contains commas, quotes, or newlines.
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  try {
    if (!db) {
      return new Response('Database not configured', { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const zoneId = searchParams.get('zone_id');
    const rawNodeType = searchParams.get('node_type');
    const nodeType = rawNodeType === 'HOST' || rawNodeType === 'VM' ? rawNodeType : null;

    const conditions = [
      ...(zoneId ? [eq(compute_server2.zone_id, zoneId)] : []),
      ...(nodeType ? [eq(compute_server2.node_type, nodeType)] : []),
    ];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch ALL matching rows – no limit/offset applied.
    const q = db.select().from(compute_server2);
    const q2 = where ? q.where(where) : q;
    const rows = await q2.orderBy(asc(compute_server2.id));

    // Build CSV string.
    const header = CSV_COLUMNS.map((c) => csvField(c.label)).join(',');
    const body = rows
      .map((row) =>
        CSV_COLUMNS.map((c) => csvField(row[c.key])).join(','),
      )
      .join('\n');

    const csv = `${header}\n${body}`;

    // Build a descriptive filename that encodes any active filters.
    const parts = ['compute-servers'];
    if (zoneId) parts.push(zoneId);
    if (nodeType) parts.push(nodeType.toLowerCase());
    parts.push(new Date().toISOString().slice(0, 10));
    const filename = `${parts.join('_')}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting compute servers:', error);
    return new Response(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 500 },
    );
  }
}

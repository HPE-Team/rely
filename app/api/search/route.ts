import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export type SearchServer = {
  id: number;
  node_type: string;
  status: string;
  error_type: string | null;
  zone_id: string;
  parent_server_id: number | null;
  provision_time: number;
};

// ── Query parsing ──────────────────────────────────────────────────────────────

const ZONE_ALIASES: Record<string, string> = {
  azure: 'zone-a', 'zone-a': 'zone-a',
  aws: 'zone-b', 'zone-b': 'zone-b',
  gcp: 'zone-c', 'zone-c': 'zone-c',
  digitalocean: 'zone-d', do: 'zone-d', 'zone-d': 'zone-d',
  cloudflare: 'zone-e', cf: 'zone-e', 'zone-e': 'zone-e',
  oracle: 'zone-f', 'zone-f': 'zone-f',
};

const ERROR_ALIASES: Record<string, string> = {
  hardware: 'HARDWARE_FAILURE',
  resource: 'RESOURCE_FAILURE',
  storage: 'STORAGE_FAILURE',
  network: 'NETWORK_FAILURE',
  ip: 'IP_FAILURE',
  power: 'POWER_FAILURE',
};

const BIGRAM_ERRORS: Record<string, string> = {
  'hardware failure': 'HARDWARE_FAILURE',
  'resource failure': 'RESOURCE_FAILURE',
  'storage failure': 'STORAGE_FAILURE',
  'network failure': 'NETWORK_FAILURE',
  'ip failure': 'IP_FAILURE',
  'power failure': 'POWER_FAILURE',
  'host failure': 'HOST_FAILURE',
};

interface ParsedQuery {
  exactId?: number;
  zoneId?: string;
  status?: 'provisioned' | 'failed';
  nodeType?: 'HOST' | 'VM';
  errorType?: string;
  empty?: boolean;
}

function parseQuery(q: string): ParsedQuery {
  const lower = q.toLowerCase().trim();
  if (!lower) return { empty: true };

  // Exact ID: "123" or "#123"
  const idMatch = lower.match(/^#?(\d+)$/);
  if (idMatch) return { exactId: parseInt(idMatch[1]) };

  const result: ParsedQuery = {};
  let remaining = lower;

  // Bigram error types first (before single-token pass)
  for (const [bigram, errorType] of Object.entries(BIGRAM_ERRORS)) {
    if (remaining.includes(bigram)) {
      result.errorType = errorType;
      remaining = remaining.replace(bigram, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  for (const token of remaining.split(/\s+/).filter(Boolean)) {
    if (ZONE_ALIASES[token]) {
      result.zoneId = ZONE_ALIASES[token];
    } else if (ERROR_ALIASES[token]) {
      result.errorType ??= ERROR_ALIASES[token];
    } else if (token === 'failed' || token === 'failure') {
      result.status = 'failed';
    } else if (token === 'provisioned' || token === 'ok' || token === 'healthy') {
      result.status = 'provisioned';
    } else if (token === 'host' || token === 'hosts') {
      result.nodeType = 'HOST';
    } else if (token === 'vm' || token === 'vms') {
      result.nodeType = 'VM';
    }
    // Unrecognized tokens: ignored — query still runs with other conditions
  }

  return result;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_SERVERS: SearchServer[] = [
  { id: 42,  node_type: 'HOST', status: 'failed',      error_type: 'HARDWARE_FAILURE', zone_id: 'zone-a', parent_server_id: null, provision_time: 45.3 },
  { id: 87,  node_type: 'VM',   status: 'failed',      error_type: 'NETWORK_FAILURE',  zone_id: 'zone-b', parent_server_id: 12,   provision_time: 12.1 },
  { id: 123, node_type: 'HOST', status: 'provisioned', error_type: null,               zone_id: 'zone-c', parent_server_id: null, provision_time: 38.7 },
  { id: 156, node_type: 'VM',   status: 'failed',      error_type: 'STORAGE_FAILURE',  zone_id: 'zone-a', parent_server_id: 42,   provision_time: 67.2 },
  { id: 201, node_type: 'VM',   status: 'failed',      error_type: 'IP_FAILURE',       zone_id: 'zone-d', parent_server_id: 89,   provision_time: 23.4 },
  { id: 234, node_type: 'HOST', status: 'failed',      error_type: 'POWER_FAILURE',    zone_id: 'zone-b', parent_server_id: null, provision_time: 8.9  },
  { id: 289, node_type: 'VM',   status: 'provisioned', error_type: null,               zone_id: 'zone-c', parent_server_id: 123,  provision_time: 31.2 },
  { id: 310, node_type: 'HOST', status: 'failed',      error_type: 'HOST_FAILURE',     zone_id: 'zone-e', parent_server_id: null, provision_time: 5.1  },
];

function filterMock(parsed: ParsedQuery): SearchServer[] {
  if (parsed.empty) return [];
  let results = MOCK_SERVERS;
  if (parsed.exactId !== undefined) return results.filter(s => s.id === parsed.exactId);
  if (parsed.zoneId)    results = results.filter(s => s.zone_id === parsed.zoneId);
  if (parsed.status)    results = results.filter(s => s.status === parsed.status);
  if (parsed.nodeType)  results = results.filter(s => s.node_type === parsed.nodeType);
  if (parsed.errorType) results = results.filter(s => s.error_type === parsed.errorType);
  // If nothing was recognized, return a subset of failed servers as a sensible default
  const hasFilter = parsed.zoneId || parsed.status || parsed.nodeType || parsed.errorType;
  return hasFilter ? results : results.filter(s => s.status === 'failed');
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '8'), 20);

  if (!q) return NextResponse.json({ success: true, servers: [] });

  const parsed = parseQuery(q);

  if (!db) {
    return NextResponse.json({ success: true, servers: filterMock(parsed).slice(0, limit), _note: 'Mock data (no DB)' });
  }

  try {
    const conditions = [];

    if (parsed.exactId !== undefined) {
      conditions.push(eq(compute_server2.id, parsed.exactId));
    } else {
      if (parsed.zoneId)    conditions.push(eq(compute_server2.zone_id, parsed.zoneId));
      if (parsed.status)    conditions.push(eq(compute_server2.status, parsed.status as any));
      if (parsed.nodeType)  conditions.push(eq(compute_server2.node_type, parsed.nodeType as any));
      if (parsed.errorType) conditions.push(eq(compute_server2.error_type, parsed.errorType as any));
    }

    // No recognizable conditions → return nothing (don't dump entire table)
    if (conditions.length === 0) {
      return NextResponse.json({ success: true, servers: [] });
    }

    const rows = await db
      .select({
        id: compute_server2.id,
        node_type: compute_server2.node_type,
        status: compute_server2.status,
        error_type: compute_server2.error_type,
        zone_id: compute_server2.zone_id,
        parent_server_id: compute_server2.parent_server_id,
        provision_time: compute_server2.provision_time,
      })
      .from(compute_server2)
      .where(and(...conditions))
      .limit(limit);

    return NextResponse.json({ success: true, servers: rows });
  } catch {
    return NextResponse.json({ success: true, servers: filterMock(parsed).slice(0, limit), _note: 'Mock data - DB error' });
  }
}

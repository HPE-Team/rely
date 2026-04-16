import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/connection';
import { compute_server2 } from '@/app/lib/db/schema';
import { separateErrorsByPhase, getCategorizedErrors } from '@/app/lib/calculations/errors';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: zoneId } = await params;
    const { searchParams } = new URL(req.url);
    const phase = searchParams.get('phase') as 'pre-provision' | 'post-provision' | null;

    if (!db) {
      return NextResponse.json({
        success: true,
        data: {
          zone_id: zoneId,
          phase: phase || 'all',
          total_errors: 0,
          pre_provision_total: 0,
          post_provision_total: 0,
          error_details: [],
          errors_by_node_type: { hosts: 0, vms: 0 },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch all servers with errors in the zone
    const servers = await db
      .select()
      .from(compute_server2)
      .where(eq(compute_server2.zone_id, zoneId));

    const serverForErrors = servers.map((s: any) => ({
      id: s.id,
      parent_server_id: s.parent_server_id,
      node_type: s.node_type,
      status: s.status,
      provision_percent: Number(s.provision_percent),
      error_type: s.error_type,
      error_message: s.error_message,
    }));

    // Separate errors by phase
    const { preProvisionErrors, postProvisionErrors } = separateErrorsByPhase(serverForErrors);

    let filteredErrors: typeof serverForErrors = serverForErrors.filter((s: any) => s.error_type);

    if (phase === 'pre-provision') {
      filteredErrors = preProvisionErrors as typeof serverForErrors;
    } else if (phase === 'post-provision') {
      filteredErrors = postProvisionErrors as typeof serverForErrors;
    }

    // Categorize errors
    const categorizedErrors = getCategorizedErrors(filteredErrors);

    // Build response with error details
    const errorDetails = Object.entries(categorizedErrors)
      .filter(([_, errors]) => errors.length > 0)
      .map(([errorType, errors]) => ({
        type: errorType,
        count: errors.length,
        instances: errors.map(e => ({
          id: e.id,
          node_type: e.node_type,
          status: e.status,
          error_message: e.error_message,
          parent_server_id: e.parent_server_id,
        })),
      }));

    return NextResponse.json({
      success: true,
      data: {
        zone_id: zoneId,
        phase: phase || 'all',
        total_errors: filteredErrors.length,
        pre_provision_total: preProvisionErrors.length,
        post_provision_total: postProvisionErrors.length,
        error_details: errorDetails,
        errors_by_node_type: {
          hosts: filteredErrors.filter((e: any) => e.node_type === 'HOST').length,
          vms: filteredErrors.filter((e: any) => e.node_type === 'VM').length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching zone errors:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

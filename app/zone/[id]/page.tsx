'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

import { ErrorDistributionChart } from '@/app/components/dashboard/error-distribution';
import { ErrorTimeline } from '@/app/components/dashboard/error-timeline';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

interface ZoneDetail {
  zone_id: string;
  overall: {
    pri_score: number;
    success_rate: number;
    failure_rate: number;
    avg_provision_time: number;
    stability_score: number;
    total_servers: number;
    successful_servers: number;
    failed_servers: number;
  };
  hosts: {
    pri_score: number;
    success_rate: number;
    total: number;
    failed: number;
  };
  vms: {
    pri_score: number;
    success_rate: number;
    total: number;
    failed: number;
  };
  errors: {
    error_type_breakdown: Array<{ type: string; count: number; percentage: number }>;
    pre_provision_errors: number;
    post_provision_errors: number;
    by_node_type: {
      hosts: number;
      vms: number;
    };
    host_failure_impact: {
      failedHosts: number;
      affectedVMs: number;
      impactPercentage: number;
    };
  };
}



export default function ZonePage() {
  const params = useParams();
  const zoneId = params?.id as string;

  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zoneId) return;

    fetch(`/api/zones/${zoneId}`)
      .then((res) => res.json())
      .then((detailData) => {
        if (!detailData.success) {
          setError(detailData.error || 'Failed to fetch zone details');
          setIsLoading(false);
          return;
        }
        setZoneDetail(detailData.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [zoneId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-48 mb-4" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !zoneDetail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="outline" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">{error || 'Zone not found'}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const preProvisionErrorData = zoneDetail.errors.error_type_breakdown
    .filter(e => ['RESOURCE_FAILURE', 'IP_FAILURE'].includes(e.type))
    .map(e => ({ ...e, name: e.type, value: e.count }));

  const postProvisionErrorData = zoneDetail.errors.error_type_breakdown
    .filter(
      e =>
        ![
          'RESOURCE_FAILURE',
          'IP_FAILURE',
        ].includes(e.type)
    )
    .map(e => ({ ...e, name: e.type, value: e.count }));

  const getPRIColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Link href="/">
          <Button variant="outline" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {zoneDetail.zone_id}
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive provisioning reliability metrics for this zone
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PRI Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getPRIColor(zoneDetail.overall.pri_score)}`}>
                {zoneDetail.overall.pri_score.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall provisioning health
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {zoneDetail.overall.success_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {zoneDetail.overall.successful_servers}/{zoneDetail.overall.total_servers} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Provision Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {zoneDetail.overall.avg_provision_time.toFixed(1)}s
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average provisioning duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {zoneDetail.overall.stability_score.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time variance score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hosts vs VMs Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>ESX (Hosts) Metrics</CardTitle>
              <CardDescription>Physical infrastructure reliability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">PRI Score</p>
                  <p className={`text-2xl font-bold ${getPRIColor(zoneDetail.hosts.pri_score)}`}>
                    {zoneDetail.hosts.pri_score.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hosts</p>
                  <p className="text-2xl font-bold">{zoneDetail.hosts.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {zoneDetail.hosts.success_rate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {zoneDetail.hosts.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>VMs Metrics</CardTitle>
              <CardDescription>Virtual machine provisioning reliability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">PRI Score</p>
                  <p className={`text-2xl font-bold ${getPRIColor(zoneDetail.vms.pri_score)}`}>
                    {zoneDetail.vms.pri_score.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total VMs</p>
                  <p className="text-2xl font-bold">{zoneDetail.vms.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {zoneDetail.vms.success_rate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {zoneDetail.vms.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Analysis */}
        {zoneDetail.errors.host_failure_impact.failedHosts > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                Host Failure Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">Failed Hosts</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {zoneDetail.errors.host_failure_impact.failedHosts}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">Affected VMs</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {zoneDetail.errors.host_failure_impact.affectedVMs}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">Impact Rate</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {zoneDetail.errors.host_failure_impact.impactPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="mb-8">
          <ErrorDistributionChart
            data={zoneDetail.errors.error_type_breakdown.map(e => ({
              name: e.type,
              value: e.count,
              type: e.type,
            }))}
            isLoading={false}
          />
        </div>

        {/* Error Phase Breakdown */}
        <div className="mb-8">
          <ErrorTimeline
            preProvisionData={preProvisionErrorData as any}
            postProvisionData={postProvisionErrorData as any}
            isLoading={false}
          />
        </div>

        {/* Error Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/30">
            <CardTitle className="text-xl">Error Summary</CardTitle>
            <CardDescription className="text-muted-foreground">Detailed breakdown of provisioning failures</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col justify-center p-6 bg-secondary/30 rounded-xl">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Errors</p>
                <p className="text-4xl font-bold text-foreground">
                  {zoneDetail.errors.pre_provision_errors + zoneDetail.errors.post_provision_errors}
                </p>
              </div>

              <div className="flex flex-col justify-center p-6 bg-secondary/30 rounded-xl">
                <p className="text-sm font-medium text-muted-foreground mb-1">Pre-Provision Errors</p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold text-foreground">{zoneDetail.errors.pre_provision_errors}</p>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1 bg-background rounded-md">Planning</span>
                </div>
              </div>

              <div className="flex flex-col justify-center p-6 bg-secondary/30 rounded-xl">
                <p className="text-sm font-medium text-muted-foreground mb-1">Post-Provision Errors</p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold text-foreground">{zoneDetail.errors.post_provision_errors}</p>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1 bg-background rounded-md">Execution</span>
                </div>
              </div>
            </div>

            {/* Distribution Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground tracking-wide uppercase">By Node Type</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/40">
                    <span className="text-sm text-muted-foreground font-medium">ESX Hosts</span>
                    <span className="font-bold text-foreground">{zoneDetail.errors.by_node_type.hosts}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/40">
                    <span className="text-sm text-muted-foreground font-medium">Virtual Machines</span>
                    <span className="font-bold text-foreground">{zoneDetail.errors.by_node_type.vms}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground tracking-wide uppercase">Top Error Types</p>
                <div className="flex flex-col gap-3">
                  {zoneDetail.errors.error_type_breakdown.slice(0, 3).map(e => (
                    <div key={e.type} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/40">
                      <span className="text-sm text-muted-foreground font-medium">{e.type.replace('_', ' ')}</span>
                      <span className="font-bold text-foreground">{e.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

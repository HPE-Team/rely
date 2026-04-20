"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { getErrorTypeLabel } from "@/app/lib/constants/error-weights";
import { formatZoneLabel } from "@/app/lib/utils";

import { ErrorDistributionChart } from "@/app/components/dashboard/error-distribution";
import { ErrorTimeline } from "@/app/components/dashboard/error-timeline";
import { Skeleton } from "@/app/components/ui/skeleton";
import { ArrowLeft, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { usePRIConfig } from "@/app/components/dashboard/weight-config";
import { withConfig } from "@/app/lib/config/pri-config";
import type { PRIBreakdown, ZoneColor } from "@/app/lib/calculations/pri";
import { PRIBreakdownModal } from "@/app/components/dashboard/pri-breakdown-modal";

interface ZoneDetail {
  zone_id: string;
  overall: {
    pri_breakdown: PRIBreakdown;
    pri_score: number;
    success_rate: number;
    failure_rate: number;
    avg_provision_time: number;
    median_provision_time: number;
    stability_score: number;
    total_servers: number;
    successful_servers: number;
    failed_servers: number;
    cascaded_failures: number;
    outlier_ratio: number;
    outlier_upper_fence: number;
    outlier_servers?: Array<{
      id: number;
      node_type: "HOST" | "VM";
      provision_time: number;
      status: string;
      error_type: string | null;
    }>;
    color: ZoneColor;
  };
  hosts: {
    pri_breakdown: PRIBreakdown;
    pri_score: number;
    success_rate: number;
    total: number;
    failed: number;
    color?: ZoneColor;
  };
  vms: {
    pri_breakdown: PRIBreakdown;
    pri_score: number;
    success_rate: number;
    total: number;
    failed: number;
    color?: ZoneColor;
  };
  errors: {
    error_type_breakdown: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
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
  const priConfig = usePRIConfig();

  const [zoneDetail, setZoneDetail] = useState<ZoneDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [provisionInfoOpen, setProvisionInfoOpen] = useState(false);
  const [priBreakdownTarget, setPriBreakdownTarget] = useState<
    null | "overall" | "hosts" | "vms"
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zoneId) return;

    fetch(withConfig(`/api/zones/${zoneId}`, priConfig))
      .then((res) => res.json())
      .then((detailData) => {
        if (!detailData.success) {
          setError(detailData.error || "Failed to fetch zone details");
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
  }, [zoneId, priConfig]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="space-y-8">
            <div>
              <Skeleton className="h-12 w-full max-w-64 mb-3" />
              <Skeleton className="h-5 w-full max-w-[28rem]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={`metric-${i}`} className="h-36" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={`node-metric-${i}`} className="h-72" />
              ))}
            </div>

            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-[32rem] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !zoneDetail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
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
              <p className="text-red-800">{error || "Zone not found"}</p>
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
    .filter((e) => ["RESOURCE_FAILURE", "IP_FAILURE"].includes(e.type))
    .map((e) => ({
      ...e,
      name: getErrorTypeLabel(e.type as any),
      value: e.count,
    }));

  const postProvisionErrorData = zoneDetail.errors.error_type_breakdown
    .filter((e) => !["RESOURCE_FAILURE", "IP_FAILURE"].includes(e.type))
    .map((e) => ({
      ...e,
      name: getErrorTypeLabel(e.type as any),
      value: e.count,
    }));

  const COLOR_TEXT: Record<ZoneColor, string> = {
    green: "text-green-400",
    amber: "text-yellow-400",
    red: "text-red-400",
  };

  const zoneColorText =
    COLOR_TEXT[zoneDetail.overall.color] ?? "text-foreground";
  const hostColorText = zoneDetail.hosts.color
    ? COLOR_TEXT[zoneDetail.hosts.color]
    : zoneColorText;
  const vmColorText = zoneDetail.vms.color
    ? COLOR_TEXT[zoneDetail.vms.color]
    : zoneColorText;

  const zoneLabel = formatZoneLabel(zoneDetail.zone_id);
  const priBreakdownCards = {
    overall: {
      title: `${zoneLabel} — PRI Breakdown`,
      score: zoneDetail.overall.pri_score,
      breakdown: zoneDetail.overall.pri_breakdown,
      color: zoneDetail.overall.color,
    },
    hosts: {
      title: `${zoneLabel} ESX — PRI Breakdown`,
      score: zoneDetail.hosts.pri_score,
      breakdown: zoneDetail.hosts.pri_breakdown,
      color: zoneDetail.hosts.color,
    },
    vms: {
      title: `${zoneLabel} VMs — PRI Breakdown`,
      score: zoneDetail.vms.pri_score,
      breakdown: zoneDetail.vms.pri_breakdown,
      color: zoneDetail.vms.color,
    },
  };
  const activeBreakdown = priBreakdownTarget
    ? priBreakdownCards[priBreakdownTarget]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        {/* <Link href="/">
          <Button variant="outline" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link> */}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className={`font-sans text-4xl font-bold mb-2 ${zoneColorText}`}
            >
              {formatZoneLabel(zoneDetail.zone_id)}
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive provisioning reliability metrics for this zone
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card
            className="cursor-pointer transition-colors hover:border-neutral-600"
            onClick={() => setPriBreakdownTarget("overall")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                PRI Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${zoneColorText}`}>
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
                {zoneDetail.overall.successful_servers}/
                {zoneDetail.overall.total_servers} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Provision Time
                </CardTitle>
                <button
                  onClick={() => setProvisionInfoOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
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

          <Dialog open={provisionInfoOpen} onOpenChange={setProvisionInfoOpen}>
            <DialogContent className="max-w-sm">
              <DialogTitle className="pr-8 pt-2 mb-2">
                Provision Time Details
              </DialogTitle>
              <div className="space-y-4 pb-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 border border-border/40 p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Average
                    </p>
                    <p className="text-xl font-bold">
                      {zoneDetail.overall.avg_provision_time.toFixed(1)}s
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 border border-border/40 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Median</p>
                    <p className="text-xl font-bold">
                      {zoneDetail.overall.median_provision_time?.toFixed(1) ??
                        "—"}
                      s
                    </p>
                  </div>
                </div>

                {zoneDetail.overall.outlier_ratio > 0 && (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-yellow-400">
                      Outliers
                    </p>
                    <p className="text-sm text-foreground">
                      {zoneDetail.overall.outlier_ratio.toFixed(1)}% of
                      provisions exceeded{" "}
                      <span className="font-mono font-semibold">
                        {zoneDetail.overall.outlier_upper_fence?.toFixed(0)}s
                      </span>{" "}
                      (IQR upper fence)
                    </p>
                    {zoneDetail.overall.outlier_servers &&
                      zoneDetail.overall.outlier_servers.length > 0 && (
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {zoneDetail.overall.outlier_servers.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between rounded-md bg-[#1d1d1d] border border-border/40 px-2.5 py-1.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                                  {s.node_type}
                                </span>
                                <span className="font-mono text-xs truncate">
                                  #{s.id}
                                </span>
                                {s.status === "failed" && (
                                  <span className="text-[10px] text-red-400 font-semibold">
                                    FAILED
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-xs font-semibold text-yellow-300 flex-shrink-0">
                                {s.provision_time.toFixed(1)}s
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {(zoneDetail.overall.cascaded_failures ?? 0) > 0 && (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                    <p className="text-xs font-medium text-orange-400 mb-1">
                      Cascade Deduplication
                    </p>
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">
                        {zoneDetail.overall.cascaded_failures}
                      </span>{" "}
                      VM failures excluded from PRI — caused by host failure,
                      not independent issues. Blast radius reflected in zone
                      color instead.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-xl">ESX (Hosts) Metrics</CardTitle>
              <CardDescription className="text-muted-foreground">
                Physical infrastructure reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPriBreakdownTarget("hosts")}
                  className="text-left rounded-md -m-1 p-1 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <p className="text-sm text-muted-foreground">PRI Score</p>
                  <p className={`text-2xl font-bold ${hostColorText}`}>
                    {zoneDetail.hosts.pri_score.toFixed(1)}
                  </p>
                </button>
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

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/30">
              <CardTitle className="text-xl">VMs Metrics</CardTitle>
              <CardDescription className="text-muted-foreground">
                Virtual machine provisioning reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPriBreakdownTarget("vms")}
                  className="text-left rounded-md -m-1 p-1 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <p className="text-sm text-muted-foreground">PRI Score</p>
                  <p className={`text-2xl font-bold ${vmColorText}`}>
                    {zoneDetail.vms.pri_score.toFixed(1)}
                  </p>
                </button>
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
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Failed Hosts
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {zoneDetail.errors.host_failure_impact.failedHosts}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Affected VMs
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {zoneDetail.errors.host_failure_impact.affectedVMs}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Impact Rate
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {zoneDetail.errors.host_failure_impact.impactPercentage.toFixed(
                      1,
                    )}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="mb-8 w-full">
          <ErrorDistributionChart
            data={zoneDetail.errors.error_type_breakdown.map((e) => ({
              name: getErrorTypeLabel(e.type as any),
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
            <CardDescription className="text-muted-foreground">
              Detailed breakdown of provisioning failures
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col justify-center p-6 bg-secondary/30 rounded-xl border border-border/40">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Errors
                </p>
                <p className="text-4xl font-bold text-foreground">
                  {zoneDetail.errors.pre_provision_errors +
                    zoneDetail.errors.post_provision_errors}
                </p>
              </div>

              <div className="flex flex-col justify-center p-6 bg-secondary/30 rounded-xl border border-border/40">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Pre-Provision Errors
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold text-foreground">
                    {zoneDetail.errors.pre_provision_errors}
                  </p>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1 bg-background rounded-md">
                    Planning
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center p-6 bg-secondary/30 rounded-xl border border-border/40">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Post-Provision Errors
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-bold text-foreground">
                    {zoneDetail.errors.post_provision_errors}
                  </p>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1 bg-background rounded-md">
                    Execution
                  </span>
                </div>
              </div>
            </div>

            {/* Distribution Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground tracking-wide uppercase">
                  By Node Type
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[#1d1d1d] border border-border/40">
                    <span className="text-sm text-muted-foreground font-medium">
                      ESX Hosts
                    </span>
                    <span className="font-bold text-foreground">
                      {zoneDetail.errors.by_node_type.hosts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[#1d1d1d] border border-border/40">
                    <span className="text-sm text-muted-foreground font-medium">
                      Virtual Machines
                    </span>
                    <span className="font-bold text-foreground">
                      {zoneDetail.errors.by_node_type.vms}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground tracking-wide uppercase">
                  Top Error Types
                </p>
                <div className="flex flex-col gap-3">
                  {zoneDetail.errors.error_type_breakdown
                    .slice(0, 3)
                    .map((e) => (
                      <div
                        key={e.type}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#1d1d1d] border border-border/40"
                      >
                        <span className="text-sm text-muted-foreground font-medium">
                          {getErrorTypeLabel(e.type as any)}
                        </span>
                        <span className="font-bold text-foreground">
                          {e.count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeBreakdown && (
        <PRIBreakdownModal
          open={priBreakdownTarget !== null}
          onOpenChange={(o) => !o && setPriBreakdownTarget(null)}
          title={activeBreakdown.title}
          score={activeBreakdown.score}
          breakdown={activeBreakdown.breakdown}
          color={activeBreakdown.color}
        />
      )}
    </div>
  );
}

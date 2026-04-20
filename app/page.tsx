"use client";

import { useEffect, useMemo, useState } from "react";
import { ZoneOverviewCard } from "@/app/components/dashboard/zone-overview";
import { ErrorDistributionChart } from "@/app/components/dashboard/error-distribution";
import { ErrorTimeline } from "@/app/components/dashboard/error-timeline";
import {
  ERROR_CLASSIFICATIONS,
  getErrorTypeLabel,
  type ErrorType,
} from "@/app/lib/constants/error-weights";
import { formatZoneLabel } from "@/app/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { usePRIConfig } from "@/app/components/dashboard/weight-config";
import { withConfig } from "@/app/lib/config/pri-config";
import type { ZoneColor } from "@/app/lib/calculations/pri";

interface ZoneData {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  hosts_count: number;
  vms_count: number;
  failed_count: number;
  color?: ZoneColor;
}

interface AggregateData {
  overview: {
    total_zones: number;
    total_servers: number;
    total_errors: number;
    total_hosts: number;
    total_vms: number;
    avg_pri_score: number;
    avg_success_rate: number;
    most_reliable_zone: string | null;
    highest_risk_zone: string | null;
    fleet_color?: ZoneColor;
  };
  errors: {
    total: number;
    pre_provision_total: number;
    post_provision_total: number;
    by_type: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    by_node_type: {
      hosts: number;
      vms: number;
    };
  };
}

function isErrorType(value: string): value is ErrorType {
  return value in ERROR_CLASSIFICATIONS;
}

function getErrorLabel(value: string): string {
  return isErrorType(value) ? getErrorTypeLabel(value) : value;
}

export default function Dashboard() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const priConfig = usePRIConfig();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(withConfig("/api/zones", priConfig), { cache: "no-store" }).then(r => r.json()),
      fetch(withConfig("/api/zones/aggregate", priConfig), { cache: "no-store" }).then(r => r.json()),
    ])
      .then(([zonesResponse, aggregateResponse]) => {
        const fetchErrors: string[] = [];

        if (!zonesResponse.success) {
          fetchErrors.push(zonesResponse.error || "Failed to fetch zones");
        } else {
          setZones(Array.isArray(zonesResponse.data) ? zonesResponse.data : []);
        }

        if (!aggregateResponse.success) {
          fetchErrors.push(aggregateResponse.error || "Failed to fetch aggregate metrics");
        } else {
          setAggregate(aggregateResponse.data);
        }

        setError(fetchErrors.length > 0 ? fetchErrors.join(" | ") : null);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [priConfig]);

  const preProvisionErrorData = useMemo(
    () =>
      (aggregate?.errors.by_type ?? [])
        .filter(e => ["RESOURCE_FAILURE", "IP_FAILURE"].includes(e.type))
        .map(e => ({ type: e.type, name: getErrorLabel(e.type), count: e.count, percentage: e.percentage })),
    [aggregate],
  );

  const postProvisionErrorData = useMemo(
    () =>
      (aggregate?.errors.by_type ?? [])
        .filter(e => !["RESOURCE_FAILURE", "IP_FAILURE"].includes(e.type))
        .map(e => ({ type: e.type, name: getErrorLabel(e.type), count: e.count, percentage: e.percentage })),
    [aggregate],
  );

  const totalHosts = useMemo(() => zones.reduce((sum, z) => sum + z.hosts_count, 0), [zones]);
  const totalVMs = useMemo(() => zones.reduce((sum, z) => sum + z.vms_count, 0), [zones]);
  const totalNodes = totalHosts + totalVMs;
  const nodeTypeSplit = useMemo(
    () => [
      { name: "ESX Hosts", value: totalHosts, color: "#2b7fff" },
      { name: "VMs", value: totalVMs, color: "#8ec5ff" },
    ],
    [totalHosts, totalVMs],
  );

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-0 py-8 pt-4">
        {/* Fleet Summary */}
        {!isLoading && aggregate && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fleet PRI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {aggregate.overview.avg_pri_score.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg success {aggregate.overview.avg_success_rate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Servers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{aggregate.overview.total_servers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aggregate.overview.total_hosts} hosts / {aggregate.overview.total_vms} VMs
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {aggregate.errors.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pre: {aggregate.errors.pre_provision_total} • Post: {aggregate.errors.post_provision_total}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fleet Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{aggregate.overview.total_zones}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Most reliable: {aggregate.overview.most_reliable_zone ?? "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Zones Grid */}
        {!isLoading && zones.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              {zones.length} zone{zones.length !== 1 ? "s" : ""} monitored
            </p>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map(zone => (
                  <ZoneOverviewCard key={zone.zone_id} {...zone} />
                ))}
              </div>

              <Card className="border-border/50 shadow-sm h-fit">
                <CardHeader className="pb-4 border-b border-border/30">
                  <CardTitle className="text-xl">Node Type Split</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    ESX hosts vs virtual machines across monitored zones
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Pie
                          data={nodeTypeSplit}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={85}
                          stroke="none"
                        >
                          {nodeTypeSplit.map(entry => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 space-y-2">
                    {nodeTypeSplit.map(entry => {
                      const percent = totalNodes > 0
                        ? ((entry.value / totalNodes) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between rounded-lg border border-border/40 bg-[#1d1d1d] px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                            <span className="text-sm text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="font-semibold">{entry.value} ({percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="text-red-900 dark:text-red-100">Error Loading Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                Make sure your database connection is configured correctly in .env.local
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && zones.length === 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={`fleet-kpi-${i}`} className="h-32" />
              ))}
            </div>
            <div>
              <Skeleton className="h-4 w-36 mb-4" />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={`zone-card-${i}`} className="h-64" />
                  ))}
                </div>
                <Skeleton className="h-[30rem]" />
              </div>
            </div>
            <Skeleton className="h-72 w-full" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        )}

        {/* Fleet Summary & Insights */}
        {!isLoading && aggregate && (
          <>
            <Card className="mb-8 border-border/50 shadow-sm">
              <CardHeader className="pb-4 border-b border-border/30">
                <CardTitle className="text-xl">Fleet Insights</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Quick cross-zone indicators for operations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/40 bg-[#1d1d1d] p-4">
                  <p className="text-sm text-muted-foreground">Highest Risk Zone</p>
                  <p className="text-2xl font-semibold mt-1">
                    {aggregate.overview.highest_risk_zone
                      ? formatZoneLabel(aggregate.overview.highest_risk_zone)
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-[#1d1d1d] p-4">
                  <p className="text-sm text-muted-foreground">Host-Originated Errors</p>
                  <p className="text-2xl font-semibold mt-1">{aggregate.errors.by_node_type.hosts}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-[#1d1d1d] p-4">
                  <p className="text-sm text-muted-foreground">VM-Originated Errors</p>
                  <p className="text-2xl font-semibold mt-1">{aggregate.errors.by_node_type.vms}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
              <ErrorDistributionChart
                title="Fleet Error Distribution"
                data={aggregate.errors.by_type.map(e => ({
                  name: getErrorLabel(e.type),
                  value: e.count,
                  type: e.type,
                }))}
              />
              <ErrorTimeline
                preProvisionData={preProvisionErrorData}
                postProvisionData={postProvisionErrorData}
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && zones.length === 0 && !error && (
          <Card>
            <CardHeader>
              <CardTitle>No Zones Found</CardTitle>
              <CardDescription>
                No provisioning zones are currently available. Please check your
                database connection and ensure zones have been created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to set up provisioning zones.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

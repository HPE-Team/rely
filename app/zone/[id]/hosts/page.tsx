"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Server } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { AppBreadcrumb } from "@/app/components/ui/app-breadcrumb";
import { HostCard } from "@/app/components/dashboard/host-card";
import { formatZoneLabel } from "@/app/lib/utils";
import type { HostSummary } from "@/app/lib/types/server";

interface HostsData {
  zone_id: string;
  hosts: HostSummary[];
}

export default function ZoneHostsPage() {
  const params = useParams();
  const zoneId = params?.id as string;

  const [data, setData] = useState<HostsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zoneId) return;
    setIsLoading(true);
    fetch(`/api/zones/${zoneId}/hosts`)
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          setError(json.error || "Failed to fetch hosts");
        } else {
          setData(json.data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [zoneId]);

  const zoneLabel = formatZoneLabel(zoneId ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          <div>
            <Skeleton className="h-10 w-56 mb-3" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Link href={`/zone/${zoneId}`}>
            <Button variant="outline" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to {zoneLabel}
            </Button>
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
            <p className="text-red-400 font-medium">{error || "Zone not found"}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const failedCount = data.hosts.filter(h => h.status === "failed").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <AppBreadcrumb items={[
          { label: "Dashboard", href: "/" },
          { label: zoneLabel, href: `/zone/${zoneId}` },
          { label: "Hosts" },
        ]} />

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
              <Server className="w-7 h-7 text-muted-foreground" />
              ESX Hosts
            </h1>
            <p className="text-muted-foreground">
              {data.hosts.length} host{data.hosts.length !== 1 ? "s" : ""} in {zoneLabel}
              {failedCount > 0 && (
                <span className="text-red-400 ml-2">· {failedCount} failed</span>
              )}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {data.hosts.length === 0 && (
          <div className="rounded-xl border border-border/40 bg-muted/10 p-16 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-border/40 flex items-center justify-center">
              <Server className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">No hosts in this zone</p>
              <p className="text-sm text-muted-foreground">
                No ESX hosts have been provisioned in {zoneLabel} yet.
              </p>
            </div>
          </div>
        )}

        {/* Hosts grid */}
        {data.hosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.hosts.map(host => (
              <HostCard key={host.id} host={host} zoneId={zoneId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

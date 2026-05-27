"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { VmMesh } from "@/app/components/dashboard/vm-mesh";
import { VmDetailModal } from "@/app/components/dashboard/vm-detail-modal";
import { formatZoneLabel, formatMemory } from "@/app/lib/utils";
import { classifyRatio, overallLabel, labelMeta } from "@/app/lib/provisioning";
import { AppBreadcrumb } from "@/app/components/ui/app-breadcrumb";
import type { ComputeServerRow } from "@/app/lib/types/server";

interface HostVmsData {
  host: ComputeServerRow;
  vms: ComputeServerRow[];
}

interface ResourceBarProps {
  label: string;
  vmTotal: number;
  hostTotal: number;
  vmLabel: string;
  hostLabel: string;
}

function ResourceBar({ label, vmTotal, hostTotal, vmLabel, hostLabel }: ResourceBarProps) {
  const ratio = hostTotal > 0 ? vmTotal / hostTotal : 0;
  const pct = Math.min(ratio * 100, 100);
  const over = ratio > 1;
  const overPct = over ? Math.min((ratio - 1) * 100, 50) : 0;
  const provLabel = classifyRatio(ratio);
  const meta = labelMeta(provLabel);

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={`text-xs font-mono font-bold ${over ? "text-red-500 dark:text-red-400" : "text-foreground"}`}>
          {Math.round(ratio * 100)}%
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-l-full transition-all ${meta.barClass}`}
          style={{ width: `${pct}%` }}
        />
        {over && (
          <div
            className="absolute top-0 h-full bg-red-500/40 rounded-r-full"
            style={{ left: `${pct}%`, width: `${overPct}%` }}
          />
        )}
      </div>

      {/* Numbers */}
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className={over ? "text-red-500 dark:text-red-400 font-semibold" : ""}>{vmLabel}</span>
        <span>{hostLabel}</span>
      </div>
    </div>
  );
}

export default function HostMeshPage() {
  const params = useParams();
  const zoneId = params?.id as string;
  const hostId = params?.hostId as string;

  const [data, setData] = useState<HostVmsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVm, setSelectedVm] = useState<ComputeServerRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!hostId) return;
    setIsLoading(true);
    fetch(`/api/hosts/${hostId}/vms`)
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          setError(json.error || "Failed to fetch host data");
        } else {
          setData(json.data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [hostId]);

  const handleVmClick = (vm: ComputeServerRow) => {
    setSelectedVm(vm);
    setModalOpen(true);
  };

  const zoneLabel = formatZoneLabel(zoneId ?? "");

  const provisioningStats = useMemo(() => {
    if (!data) return null;
    const { host, vms } = data;
    const vmMemTotal     = vms.reduce((s, v) => s + v.max_memory, 0);
    const vmCoresTotal   = vms.reduce((s, v) => s + v.max_cores, 0);
    const vmStorageTotal = vms.reduce((s, v) => s + v.max_storage, 0);
    const memRatio     = host.max_memory  > 0 ? vmMemTotal     / host.max_memory  : 0;
    const coresRatio   = host.max_cores   > 0 ? vmCoresTotal   / host.max_cores   : 0;
    const storageRatio = host.max_storage > 0 ? vmStorageTotal / host.max_storage : 0;
    return { vmMemTotal, vmCoresTotal, vmStorageTotal, memRatio, coresRatio, storageRatio };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="w-full h-[680px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Link href={`/zone/${zoneId}/hosts`}>
            <Button variant="outline" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Hosts
            </Button>
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-8 text-center">
            <p className="text-red-400 font-medium">{error || "Host not found"}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { host, vms } = data;
  const isHostHealthy = host.status === "provisioned";
  const failedVmCount = vms.filter(v => v.status === "failed").length;

  const overall = provisioningStats
    ? overallLabel(provisioningStats.memRatio, provisioningStats.coresRatio, provisioningStats.storageRatio)
    : "thin";
  const overallMeta = labelMeta(overall);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <AppBreadcrumb items={[
          { label: "Dashboard", href: "/" },
          { label: zoneLabel, href: `/zone/${zoneId}` },
          { label: "Hosts", href: `/zone/${zoneId}/hosts` },
          { label: `Host #${host.id}` },
        ]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Cpu className="w-7 h-7 text-muted-foreground" />
              Host #{host.id}
              <Badge
                variant="outline"
                className={`text-xs font-semibold uppercase ${
                  isHostHealthy
                    ? "border-green-500/40 text-green-400"
                    : "border-red-500/40 text-red-400"
                }`}
              >
                {host.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {vms.length} VM{vms.length !== 1 ? "s" : ""} attached
              {failedVmCount > 0 && (
                <span className="text-red-400 ml-2">· {failedVmCount} failed</span>
              )}
              <span className="mx-2 text-border">·</span>
              <span className="font-mono text-xs">{zoneLabel}</span>
            </p>
          </div>

          {/* Host spec strip */}
          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5 text-sm shrink-0">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Memory</p>
              <p className="font-mono font-semibold">{formatMemory(host.max_memory)}</p>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CPU</p>
              <p className="font-mono font-semibold">{host.max_cores} cores</p>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Storage</p>
              <p className="font-mono font-semibold">{host.max_storage}GB</p>
            </div>
          </div>
        </div>

        {/* Provisioning panel */}
        {provisioningStats && vms.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">VM Resource Commitment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{overallMeta.description}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${overallMeta.badgeClass}`}>
                {overallMeta.text}
              </span>
            </div>

            <div className="flex gap-6">
              <ResourceBar
                label="Memory"
                vmTotal={provisioningStats.vmMemTotal}
                hostTotal={host.max_memory}
                vmLabel={formatMemory(provisioningStats.vmMemTotal)}
                hostLabel={formatMemory(host.max_memory)}
              />
              <div className="w-px bg-border/30 shrink-0" />
              <ResourceBar
                label="CPU Cores"
                vmTotal={provisioningStats.vmCoresTotal}
                hostTotal={host.max_cores}
                vmLabel={`${provisioningStats.vmCoresTotal} vCPU`}
                hostLabel={`${host.max_cores} cores`}
              />
              <div className="w-px bg-border/30 shrink-0" />
              <ResourceBar
                label="Storage"
                vmTotal={provisioningStats.vmStorageTotal}
                hostTotal={host.max_storage}
                vmLabel={`${provisioningStats.vmStorageTotal}GB`}
                hostLabel={`${host.max_storage}GB`}
              />
            </div>
          </div>
        )}

        {/* Mesh */}
        <VmMesh
          host={host}
          vms={vms}
          vmCount={vms.length}
          failedVmCount={failedVmCount}
          onVmClick={handleVmClick}
        />

        <p className="text-xs text-muted-foreground text-center mt-3">
          Click any VM node to view full details
        </p>
      </div>

      <VmDetailModal
        vm={selectedVm}
        open={modalOpen}
        onOpenChange={open => {
          setModalOpen(open);
          if (!open) setSelectedVm(null);
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { VmMesh } from "@/app/components/dashboard/vm-mesh";
import { VmDetailModal } from "@/app/components/dashboard/vm-detail-modal";
import { formatZoneLabel, formatMemory } from "@/app/lib/utils";
import type { ComputeServerRow } from "@/app/lib/types/server";

interface HostVmsData {
  host: ComputeServerRow;
  vms: ComputeServerRow[];
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          <div>
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-5 w-96" />
          </div>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb / back nav */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Link href={`/zone/${zoneId}`} className="hover:text-foreground transition-colors">
            {zoneLabel}
          </Link>
          <span>/</span>
          <Link href={`/zone/${zoneId}/hosts`} className="hover:text-foreground transition-colors">
            Hosts
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Host #{host.id}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
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

          {/* Host spec summary */}
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

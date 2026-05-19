"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import type { ComputeServerRow } from "@/app/lib/types/server";
import { formatMemory, formatZoneLabel } from "@/app/lib/utils";
import { getErrorTypeLabel } from "@/app/lib/constants/error-weights";

interface VmDetailModalProps {
  vm: ComputeServerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-36">{label}</span>
      <span className="text-xs font-mono text-right break-all">{value}</span>
    </div>
  );
}

export function VmDetailModal({ vm, open, onOpenChange }: VmDetailModalProps) {
  if (!vm) return null;

  const statusColor = vm.status === "provisioned" ? "text-green-400" : "text-red-400";
  const powerIcon = vm.power_state === "on" ? "●" : "○";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="pr-8 pt-2 mb-4 flex items-center gap-3">
          <span>VM #{vm.id}</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase ${
              vm.status === "provisioned"
                ? "border-green-500/40 text-green-400"
                : "border-red-500/40 text-red-400"
            }`}
          >
            {vm.status}
          </Badge>
        </DialogTitle>

        <div className="space-y-4 pb-2">
          {/* Resources */}
          <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
              Resources
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Memory</p>
                <p className="font-mono text-sm font-semibold">{formatMemory(vm.max_memory)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">vCPU</p>
                <p className="font-mono text-sm font-semibold">{vm.max_cores}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Storage</p>
                <p className="font-mono text-sm font-semibold">{vm.max_storage}GB</p>
              </div>
            </div>
          </div>

          {/* Provisioning */}
          <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
              Provisioning
            </p>
            <div className="divide-y divide-border/20">
              <Row label="Status" value={<span className={statusColor}>{vm.status}</span>} />
              <Row label="Provision time" value={`${vm.provision_time.toFixed(2)}s`} />
              <Row
                label="Provision %"
                value={`${Number(vm.provision_percent).toFixed(1)}%`}
              />
              <Row
                label="Status date"
                value={
                  vm.status_date
                    ? new Date(vm.status_date).toLocaleString()
                    : "—"
                }
              />
            </div>
          </div>

          {/* System */}
          <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
              System
            </p>
            <div className="divide-y divide-border/20">
              <Row
                label="Power state"
                value={
                  <span className={vm.power_state === "on" ? "text-green-400" : "text-muted-foreground"}>
                    {powerIcon} {vm.power_state}
                  </span>
                }
              />
              <Row
                label="Parent host"
                value={vm.parent_server_id != null ? `#${vm.parent_server_id}` : "—"}
              />
              <Row label="Zone" value={formatZoneLabel(vm.zone_id)} />
              <Row label="Node type" value={vm.node_type} />
            </div>
          </div>

          {/* Error (only when failed) */}
          {vm.status === "failed" && (
            <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-red-400 mb-2">
                Failure Details
              </p>
              <div className="divide-y divide-red-500/10">
                <Row
                  label="Error type"
                  value={
                    vm.error_type ? (
                      <span className="text-red-400">
                        {getErrorTypeLabel(vm.error_type as any)}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                {vm.error_message && (
                  <Row label="Error message" value={vm.error_message} />
                )}
                {vm.status_message && (
                  <Row label="Status message" value={vm.status_message} />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { formatMemory } from "@/app/lib/utils";
import { overallLabel, labelMeta } from "@/app/lib/provisioning";
import type { HostSummary } from "@/app/lib/types/server";

interface HostCardProps {
  host: HostSummary;
  zoneId: string;
}

interface MiniBarProps {
  label: string;
  ratio: number;
  vmValue: string;
  hostValue: string;
}

function MiniBar({ label, ratio, vmValue, hostValue }: MiniBarProps) {
  const pct = Math.min(ratio * 100, 100);
  const over = ratio > 1;
  const barColor =
    ratio < 0.70 ? "bg-blue-500"
    : ratio < 0.95 ? "bg-green-500"
    : ratio < 1.05 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <span className={`font-mono font-semibold ${over ? "text-red-500 dark:text-red-400" : "text-foreground"}`}>
          {Math.round(ratio * 100)}%
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
        <span>{vmValue} VMs</span>
        <span>{hostValue} host</span>
      </div>
    </div>
  );
}

export function HostCard({ host, zoneId }: HostCardProps) {
  const isHealthy = host.status === "provisioned";
  const label = overallLabel(host.memory_ratio, host.cores_ratio, host.storage_ratio);
  const meta = labelMeta(label);

  return (
    <Link href={`/zone/${zoneId}/hosts/${host.id}`}>
      <Card
        className={`border border-border/50 shadow-sm hover:border-border/80 hover:shadow-md transition-all cursor-pointer h-full ${
          !isHealthy ? "border-red-500/30 hover:border-red-500/50" : ""
        }`}
      >
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-mono font-bold">
              Host #{host.id}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
              >
                {meta.text}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold uppercase ${
                  isHealthy
                    ? "border-green-500/40 text-green-400"
                    : "border-red-500/40 text-red-400"
                }`}
              >
                {host.status}
              </Badge>
              <span
                className={`text-xs font-semibold ${
                  host.power_state === "on" ? "text-green-400" : "text-muted-foreground"
                }`}
                title={`Power ${host.power_state}`}
              >
                {host.power_state === "on" ? "●" : "○"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* VM counts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">VMs</p>
              <p className="text-2xl font-bold">{host.vm_count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Failed</p>
              <p
                className={`text-2xl font-bold ${
                  host.failed_vm_count > 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {host.failed_vm_count}
              </p>
            </div>
          </div>

          {/* Success rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">VM Success Rate</p>
              <p
                className={`text-xs font-mono font-semibold ${
                  host.success_rate >= 90
                    ? "text-green-400"
                    : host.success_rate >= 70
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {host.success_rate.toFixed(1)}%
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  host.success_rate >= 90
                    ? "bg-green-500"
                    : host.success_rate >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${host.success_rate}%` }}
              />
            </div>
          </div>

          {/* Provisioning bars */}
          <div className="rounded-md bg-muted/20 border border-border/30 px-3 py-2.5 space-y-2.5">
            <MiniBar
              label="MEM"
              ratio={host.memory_ratio}
              vmValue={formatMemory(host.vm_memory_total)}
              hostValue={formatMemory(host.max_memory)}
            />
            <MiniBar
              label="CPU"
              ratio={host.cores_ratio}
              vmValue={`${host.vm_cores_total}c`}
              hostValue={`${host.max_cores}c`}
            />
            <MiniBar
              label="DISK"
              ratio={host.storage_ratio}
              vmValue={`${host.vm_storage_total}GB`}
              hostValue={`${host.max_storage}GB`}
            />
          </div>

          {/* Provision time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Provision time</span>
            <span className="font-mono text-muted-foreground">
              {host.provision_time.toFixed(1)}s
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

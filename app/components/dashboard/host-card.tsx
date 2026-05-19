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
import type { HostSummary } from "@/app/lib/types/server";

interface HostCardProps {
  host: HostSummary;
  zoneId: string;
}

export function HostCard({ host, zoneId }: HostCardProps) {
  const isHealthy = host.status === "provisioned";
  const allVmsFailed = host.vm_count > 0 && host.failed_vm_count === host.vm_count;

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

          {/* Resource config */}
          <div className="rounded-md bg-muted/20 border border-border/30 px-3 py-2">
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">MEM</p>
                <p className="font-mono text-xs font-semibold">{formatMemory(host.max_memory)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">CPU</p>
                <p className="font-mono text-xs font-semibold">{host.max_cores}c</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">DISK</p>
                <p className="font-mono text-xs font-semibold">{host.max_storage}GB</p>
              </div>
            </div>
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

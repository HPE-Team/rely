"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Badge } from "@/app/components/ui/badge";
import { formatMemory } from "@/app/lib/utils";

export type HostNodeData = {
  id: number;
  status: "provisioned" | "failed";
  power_state: string;
  max_memory: number;
  max_cores: number;
  max_storage: number;
  vm_count: number;
  failed_vm_count: number;
};

export type HostNodeType = Node<HostNodeData, "host">;

export function HostNode({ data }: NodeProps<HostNodeType>) {
  const isHealthy = data.status === "provisioned";

  return (
    <div
      className={`rounded-xl border-2 bg-surface-2 shadow-2xl w-[220px] select-none ${
        isHealthy
          ? "border-green-500/50 shadow-green-500/5"
          : "border-red-500/50 shadow-red-500/5"
      }`}
    >
      {/* Source handle at center — edges radiate outward from here */}
      <Handle
        type="source"
        id="center"
        position={Position.Top}
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          background: "transparent",
          border: "none",
        }}
      />

      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            ESX Host
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase px-1.5 py-0 ${
              isHealthy
                ? "border-green-500/40 text-green-400"
                : "border-red-500/40 text-red-400"
            }`}
          >
            {data.status}
          </Badge>
        </div>
        <p className="font-mono text-xl font-bold">#{data.id}</p>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-[9px] text-muted-foreground">MEM</p>
            <p className="font-mono text-xs font-semibold">{formatMemory(data.max_memory)}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground">CPU</p>
            <p className="font-mono text-xs font-semibold">{data.max_cores}c</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground">DISK</p>
            <p className="font-mono text-xs font-semibold">{data.max_storage}G</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">VMs</span>
            <span className="font-mono text-xs font-bold">{data.vm_count}</span>
          </div>
          {data.failed_vm_count > 0 && (
            <span className="text-xs font-semibold text-red-400">
              {data.failed_vm_count} failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

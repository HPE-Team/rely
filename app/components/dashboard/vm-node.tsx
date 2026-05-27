"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Badge } from "@/app/components/ui/badge";
import { formatMemory } from "@/app/lib/utils";

export type VmNodeData = {
  id: number;
  status: "provisioned" | "failed";
  max_memory: number;
  max_cores: number;
  max_storage: number;
  error_type: string | null;
};

export type VmNodeType = Node<VmNodeData, "vm">;

export function VmNode({ data, selected }: NodeProps<VmNodeType>) {
  const isFailed = data.status === "failed";

  return (
    <div
      className={`rounded-lg border bg-surface-3 shadow-md w-[172px] select-none cursor-pointer transition-colors ${
        isFailed
          ? "border-red-500/40 hover:border-red-500/70"
          : "border-border/40 hover:border-green-500/50"
      } ${selected ? "ring-1 ring-offset-1 ring-offset-background ring-white/20" : ""}`}
    >
      {/* Target handle at center — edges arrive here */}
      <Handle
        type="target"
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

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-sm font-semibold">#{data.id}</span>
          <Badge
            variant="outline"
            className={`text-[9px] font-bold uppercase px-1 py-0 leading-4 ${
              isFailed
                ? "border-red-500/40 text-red-400"
                : "border-green-500/30 text-green-400"
            }`}
          >
            {data.status}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
          <span>{formatMemory(data.max_memory)}</span>
          <span className="text-border">·</span>
          <span>{data.max_cores} vCPU</span>
          <span className="text-border">·</span>
          <span>{data.max_storage}G</span>
        </div>

        {isFailed && data.error_type && (
          <p className="text-[9px] text-red-400/80 font-mono truncate">{data.error_type}</p>
        )}
      </div>
    </div>
  );
}

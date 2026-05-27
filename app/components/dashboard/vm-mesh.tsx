"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { HostNode, type HostNodeData } from "./host-node";
import { VmNode, type VmNodeData } from "./vm-node";
import type { ComputeServerRow } from "@/app/lib/types/server";

// Approximate node half-dimensions for centering (top-left origin → center)
const HOST_HW = 110; // half-width
const HOST_HH = 55;  // half-height
const VM_HW = 86;
const VM_HH = 33;

const RING_SIZE = 12;
const BASE_RADIUS = 355;
const RING_STEP = 245;

const nodeTypes = {
  host: HostNode,
  vm: VmNode,
};

interface VmMeshProps {
  host: ComputeServerRow;
  vms: ComputeServerRow[];
  vmCount: number;
  failedVmCount: number;
  onVmClick: (vm: ComputeServerRow) => void;
}

export function VmMesh({ host, vms, vmCount, failedVmCount, onVmClick }: VmMeshProps) {
  const { defaultNodes, defaultEdges } = useMemo(() => {
    const hostNodeData: HostNodeData = {
      id: host.id,
      status: host.status,
      power_state: host.power_state,
      max_memory: host.max_memory,
      max_cores: host.max_cores,
      max_storage: host.max_storage,
      vm_count: vmCount,
      failed_vm_count: failedVmCount,
    };

    const hostNode = {
      id: "host",
      type: "host" as const,
      position: { x: -HOST_HW, y: -HOST_HH },
      data: hostNodeData,
      selectable: false,
      draggable: false,
    };

    const vmNodes = vms.map((vm, i) => {
      const ring = Math.floor(i / RING_SIZE);
      const idxInRing = i % RING_SIZE;
      const countInRing = Math.min(RING_SIZE, vms.length - ring * RING_SIZE);
      const radius = BASE_RADIUS + ring * RING_STEP;
      // Start from top (-π/2) so first VM is above the host
      const angle = (2 * Math.PI / countInRing) * idxInRing - Math.PI / 2;
      const cx = radius * Math.cos(angle);
      const cy = radius * Math.sin(angle);

      const vmData: VmNodeData = {
        id: vm.id,
        status: vm.status,
        max_memory: vm.max_memory,
        max_cores: vm.max_cores,
        max_storage: vm.max_storage,
        error_type: vm.error_type,
      };

      return {
        id: `vm-${vm.id}`,
        type: "vm" as const,
        position: { x: cx - VM_HW, y: cy - VM_HH },
        data: vmData,
        selectable: false,
        draggable: false,
      };
    });

    const edges = vms.map(vm => ({
      id: `e-host-${vm.id}`,
      source: "host",
      target: `vm-${vm.id}`,
      sourceHandle: "center",
      targetHandle: "center",
      type: "straight" as const,
      style: {
        stroke: "color-mix(in oklch, var(--foreground) 15%, transparent)",
        strokeWidth: 1.5,
      },
      selectable: false,
    }));

    return { defaultNodes: [hostNode, ...vmNodes], defaultEdges: edges };
  }, [host, vms, vmCount, failedVmCount]);

  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    if (node.type === "vm") {
      const vmId = parseInt(node.id.replace("vm-", ""), 10);
      const vm = vms.find(v => v.id === vmId);
      if (vm) onVmClick(vm);
    }
  };

  if (vms.length === 0) {
    return (
      <div className="w-full h-[500px] rounded-xl border border-border/50 bg-surface-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-border/40 flex items-center justify-center">
          <span className="text-muted-foreground text-lg">○</span>
        </div>
        <p className="text-sm text-muted-foreground">No VMs attached to this host</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[680px] rounded-xl border border-border/50 overflow-hidden bg-surface-2">
      <ReactFlow
        defaultNodes={defaultNodes}
        defaultEdges={defaultEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        colorMode={isDark ? "dark" : "light"}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}
        />
        <Controls
          showInteractive={false}
          className="!bg-surface-3 !border-border/40 !rounded-lg overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}

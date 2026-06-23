"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ZoneLogo } from "@/app/components/zone-logo";
import { formatZoneLabel } from "@/app/lib/utils";
import type { ZoneColor } from "@/app/lib/calculations/pri";

export interface ZoneComparisonRow {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  hosts_count: number;
  vms_count: number;
  failed_count: number;
  error_rate: number;
  avg_provision_time: number;
  color: ZoneColor;
}

type SortKey = keyof Omit<ZoneComparisonRow, "zone_id" | "color">;

const COLUMNS: { key: SortKey | "zone"; label: string; right?: boolean }[] = [
  { key: "zone", label: "Zone" },
  { key: "pri_score", label: "PRI", right: true },
  { key: "success_rate", label: "Success %", right: true },
  { key: "avg_provision_time", label: "Avg Time", right: true },
  { key: "hosts_count", label: "Hosts", right: true },
  { key: "vms_count", label: "VMs", right: true },
  { key: "failed_count", label: "Failed", right: true },
  { key: "error_rate", label: "Err %", right: true },
];

const PRI_COLOR: Record<ZoneColor, string> = {
  green:
    "text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20",
  amber:
    "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  red: "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

export function ZoneComparisonTable({ zones }: { zones: ZoneComparisonRow[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("pri_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey | "zone") {
    if (key === "zone") return;
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...zones].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            {COLUMNS.map((col) => {
              const active = col.key !== "zone" && col.key === sortKey;
              return (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 font-medium text-muted-foreground whitespace-nowrap select-none
                    ${col.key !== "zone" ? "cursor-pointer hover:text-foreground transition-colors" : ""}
                    ${col.right ? "text-right" : "text-left"}
                    ${active ? "text-foreground" : ""}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {active &&
                      (sortDir === "desc" ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      ))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((zone, i) => (
            <tr
              key={zone.zone_id}
              onClick={() => router.push(`/zone/${zone.zone_id}`)}
              className={`border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer ${
                i % 2 === 0 ? "" : "bg-muted/5"
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/zone/${zone.zone_id}`}
                  className="flex items-center gap-2.5 font-medium hover:text-brand transition-colors"
                >
                  <ZoneLogo
                    zoneId={zone.zone_id}
                    width={20}
                    height={20}
                    className="object-contain shrink-0"
                  />
                  {formatZoneLabel(zone.zone_id)}
                </Link>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${PRI_COLOR[zone.color]}`}
                >
                  {zone.pri_score.toFixed(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {zone.success_rate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {zone.avg_provision_time.toFixed(1)}s
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                {zone.hosts_count}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                {zone.vms_count}
              </td>
              <td
                className={`px-4 py-3 text-right font-mono text-xs font-semibold ${zone.failed_count > 0 ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
              >
                {zone.failed_count}
              </td>
              <td
                className={`px-4 py-3 text-right font-mono text-xs ${zone.error_rate > 10 ? "text-red-500 dark:text-red-400" : zone.error_rate > 5 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
              >
                {zone.error_rate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

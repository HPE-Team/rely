"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ZoneLogo } from "@/app/components/zone-logo";
import { formatZoneLabel } from "@/app/lib/utils";
import {
  ERROR_CLASSIFICATIONS,
  type ErrorType,
} from "@/app/lib/constants/error-weights";
import type { HeatmapZone } from "@/app/api/zones/error-heatmap/route";

const ALL_ERROR_TYPES = Object.keys(ERROR_CLASSIFICATIONS) as ErrorType[];

const SHORT_LABELS: Record<ErrorType, string> = {
  HARDWARE_FAILURE: "Hardware",
  RESOURCE_FAILURE: "Resource",
  STORAGE_FAILURE: "Storage",
  NETWORK_FAILURE: "Network",
  IP_FAILURE: "IP",
  POWER_FAILURE: "Power",
  HOST_FAILURE: "Host",
};

// Per-error-type base hue for the intensity fill
const ERROR_HUE: Record<ErrorType, string> = {
  HARDWARE_FAILURE: "var(--color-red)",
  RESOURCE_FAILURE: "oklch(0.65 0.16 35)",
  STORAGE_FAILURE: "oklch(0.65 0.18 50)",
  NETWORK_FAILURE: "oklch(0.65 0.15 200)",
  IP_FAILURE: "oklch(0.6 0.14 240)",
  POWER_FAILURE: "oklch(0.6 0.17 290)",
  HOST_FAILURE: "oklch(0.55 0.18 15)",
};

// Fallback solid color classes for cells (Tailwind-safe)
const ERROR_BG: Record<ErrorType, string> = {
  HARDWARE_FAILURE: "bg-red-500",
  RESOURCE_FAILURE: "bg-orange-500",
  STORAGE_FAILURE: "bg-amber-500",
  NETWORK_FAILURE: "bg-sky-500",
  IP_FAILURE: "bg-blue-500",
  POWER_FAILURE: "bg-purple-500",
  HOST_FAILURE: "bg-rose-600",
};

export function ErrorHeatmap() {
  const [data, setData] = useState<HeatmapZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/zones/error-heatmap")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-xl">Error Type Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-32 animate-pulse bg-muted/30 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) return null;

  // Only show columns where at least one zone has that error type
  const activeTypes = ALL_ERROR_TYPES.filter((et) =>
    data.some((z) => (z.errors[et] ?? 0) > 0),
  );

  // Max count per error type (for intensity scaling)
  const maxByType: Partial<Record<ErrorType, number>> = {};
  for (const et of activeTypes) {
    maxByType[et] = Math.max(...data.map((z) => z.errors[et] ?? 0));
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-xl">Error Type Heatmap</CardTitle>
        <CardDescription className="text-muted-foreground">
          Failure mode distribution across zones — cell intensity = relative
          frequency
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left font-medium text-muted-foreground pb-3 pr-4 w-32 min-w-[7rem]">
                Zone
              </th>
              {activeTypes.map((et) => (
                <th
                  key={et}
                  className="text-center font-medium text-muted-foreground pb-3 px-1.5 whitespace-nowrap"
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-sm mr-1 align-middle ${ERROR_BG[et]}`}
                  />
                  {SHORT_LABELS[et]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((zone) => (
              <tr key={zone.zone_id} className="border-t border-border/20">
                <td className="py-2 pr-4">
                  <Link
                    href={`/zone/${zone.zone_id}`}
                    className="flex items-center gap-2 hover:text-brand transition-colors"
                  >
                    <ZoneLogo
                      zoneId={zone.zone_id}
                      width={16}
                      height={16}
                      className="object-contain shrink-0"
                    />
                    <span className="font-medium">
                      {formatZoneLabel(zone.zone_id)}
                    </span>
                  </Link>
                </td>
                {activeTypes.map((et) => {
                  const count = zone.errors[et] ?? 0;
                  const max = maxByType[et] ?? 1;
                  const intensity = count > 0 ? 0.15 + (count / max) * 0.65 : 0;
                  return (
                    <td key={et} className="py-2 px-1.5 text-center">
                      {count > 0 ? (
                        <span
                          title={`${formatZoneLabel(zone.zone_id)} · ${et} · ${count} occurrence${count !== 1 ? "s" : ""}`}
                          className={`inline-flex items-center justify-center w-10 h-7 rounded font-mono font-semibold cursor-default text-white ${ERROR_BG[et]}`}
                          style={{ opacity: intensity }}
                        >
                          {count}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-10 h-7 text-border select-none">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

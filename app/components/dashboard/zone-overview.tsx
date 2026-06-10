"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { formatZoneLabel } from "@/app/lib/utils";
import { ZoneLogo } from "@/app/components/zone-logo";
import Link from "next/link";
import type { ZoneColor } from "@/app/lib/calculations/pri";

interface ZoneOverviewProps {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  hosts_count: number;
  vms_count: number;
  failed_count: number;
  color?: ZoneColor;
}

const COLOR_PILL: Record<ZoneColor, string> = {
  green: "bg-green-500/20 text-green-700 dark:text-green-300",
  amber: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
  red: "bg-red-500/20 text-red-700 dark:text-red-300",
};

// Fallback for when color is not yet available
const SCORE_PILL = (score: number) => {
  if (score >= 90) return "bg-green-500/20 text-green-700 dark:text-green-300";
  if (score >= 75)
    return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
  if (score >= 50)
    return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  return "bg-red-500/20 text-red-700 dark:text-red-300";
};

export function ZoneOverviewCard({
  zone_id,
  pri_score,
  success_rate,
  total_servers,
  hosts_count,
  vms_count,
  failed_count,
  color,
}: ZoneOverviewProps) {
  const pillClass = color ? COLOR_PILL[color] : SCORE_PILL(pri_score);
  const label = formatZoneLabel(zone_id);

  return (
    <Link href={`/zone/${zone_id}`}>
      <Card className="cursor-pointer transition-all border-border/50 shadow-sm hover:shadow-md hover:border-border/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <div className="flex items-center gap-2.5">
                <ZoneLogo
                  zoneId={zone_id}
                  width={22}
                  height={22}
                  className="object-contain shrink-0"
                />
                <span className="font-sans">{label}</span>
              </div>
            </CardTitle>
            <div
              className={`px-2 py-[0.5] rounded-lg font-bold text-lg ${pillClass}`}
            >
              {pri_score.toFixed(1)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                Success Rate
              </p>
              <p className="text-2xl font-semibold">
                {success_rate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                Total Servers
              </p>
              <p className="text-2xl font-semibold">{total_servers}</p>
            </div>
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                Hosts / VMs
              </p>
              <p className="text-lg font-semibold">
                {hosts_count} / {vms_count}
              </p>
            </div>
            <div>
              <p className="font-mono text-sm text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {failed_count}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap pt-2">
            <Badge variant="secondary">ESX: {hosts_count}</Badge>
            <Badge variant="secondary">VMs: {vms_count}</Badge>
            {failed_count > 0 && (
              <Badge variant="destructive">{failed_count} Failed</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

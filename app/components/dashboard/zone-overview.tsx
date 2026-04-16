"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { formatZoneLabel } from "@/app/lib/utils";
import Link from "next/link";

interface ZoneOverviewProps {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  hosts_count: number;
  vms_count: number;
  failed_count: number;
}

export function ZoneOverviewCard({
  zone_id,
  pri_score,
  success_rate,
  total_servers,
  hosts_count,
  vms_count,
  failed_count,
}: ZoneOverviewProps) {
  const getPRIColor = (score: number) => {
    if (score >= 90)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 75)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (score >= 50)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <Link href={`/zone/${zone_id}`}>
      <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-neutral-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{formatZoneLabel(zone_id)}</CardTitle>
            </div>
            <div
              className={`px-2 py-[0.5] rounded-lg font-bold text-lg ${getPRIColor(pri_score)}`}
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

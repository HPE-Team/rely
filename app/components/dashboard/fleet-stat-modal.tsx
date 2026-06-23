"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ZoneLogo } from "@/app/components/zone-logo";
import { formatZoneLabel } from "@/app/lib/utils";
import {
  chartTooltipStyle,
  chartLabelStyle,
  chartItemStyle,
} from "@/app/lib/chart-tooltip";
import type { ZoneColor } from "@/app/lib/calculations/pri";
import {
  ERROR_CLASSIFICATIONS,
  getErrorTypeLabel,
  type ErrorType,
} from "@/app/lib/constants/error-weights";
import { Activity, Server, AlertTriangle, Globe } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Structural shapes — satisfied by the home page's `aggregate` / `zones` objects.
interface ZoneData {
  zone_id: string;
  pri_score: number;
  success_rate: number;
  total_servers: number;
  hosts_count: number;
  vms_count: number;
  failed_count: number;
  color?: ZoneColor;
}

interface AggregateData {
  overview: {
    total_zones: number;
    total_servers: number;
    total_errors: number;
    total_hosts: number;
    total_vms: number;
    avg_pri_score: number;
    avg_success_rate: number;
    most_reliable_zone: string | null;
    highest_risk_zone: string | null;
    fleet_color?: ZoneColor;
  };
  errors: {
    total: number;
    pre_provision_total: number;
    post_provision_total: number;
    by_type: Array<{ type: string; count: number; percentage: number }>;
    by_node_type: { hosts: number; vms: number };
  };
  zones_comparison?: ZoneData[];
}

export type FleetStatTarget = "fleet" | "servers" | "errors" | "coverage";

interface FleetStatModalProps {
  target: FleetStatTarget | null;
  onOpenChange: (open: boolean) => void;
  aggregate: AggregateData;
  zones: ZoneData[];
}

const COLOR_TEXT: Record<ZoneColor, string> = {
  green: "text-green-400",
  amber: "text-yellow-400",
  red: "text-red-400",
};

const ZONE_HEX: Record<ZoneColor, string> = {
  green: "#22c55e",
  amber: "#eab308",
  red: "#ef4444",
};

const HOST_HEX = "#2b7fff";
const VM_HEX = "#8ec5ff";

function colorFor(c: ZoneColor | undefined, score: number): ZoneColor {
  if (c) return c;
  return score >= 90 ? "green" : score >= 75 ? "amber" : "red";
}

function errorLabel(type: string): string {
  return type in ERROR_CLASSIFICATIONS
    ? getErrorTypeLabel(type as ErrorType)
    : type;
}

const META: Record<
  FleetStatTarget,
  { title: string; description: string; Icon: typeof Activity }
> = {
  fleet: {
    title: "Fleet PRI",
    description: "Average provisioning reliability across all monitored zones.",
    Icon: Activity,
  },
  servers: {
    title: "Total Servers",
    description: "ESX hosts and virtual machines tracked across the fleet.",
    Icon: Server,
  },
  errors: {
    title: "Total Errors",
    description: "Provisioning failures grouped by phase, type, and node.",
    Icon: AlertTriangle,
  },
  coverage: {
    title: "Fleet Coverage",
    description: "Monitored zones ranked by provisioning reliability.",
    Icon: Globe,
  },
};

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface-3 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function FleetStatModal({
  target,
  onOpenChange,
  aggregate,
  zones,
}: FleetStatModalProps) {
  if (!target) return null;

  const { title, description, Icon } = META[target];
  const { overview, errors } = aggregate;

  const source =
    aggregate.zones_comparison && aggregate.zones_comparison.length > 0
      ? aggregate.zones_comparison
      : zones;

  const zoneRows = source
    .map((z) => ({
      zone_id: z.zone_id,
      label: formatZoneLabel(z.zone_id),
      pri_score: z.pri_score,
      success_rate: z.success_rate,
      total_servers: z.total_servers,
      hosts_count: z.hosts_count,
      vms_count: z.vms_count,
      failed_count: z.failed_count,
      color: colorFor(z.color, z.pri_score),
    }))
    .sort((a, b) => b.pri_score - a.pri_score);

  const chartHeight = Math.max(150, zoneRows.length * 40);

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 pr-8 pt-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </DialogTitle>
        <DialogDescription className="mb-3">{description}</DialogDescription>

        {target === "fleet" && (
          <div className="space-y-5 pb-2">
            <div className="grid grid-cols-3 gap-3">
              <StatBox
                label="Average PRI"
                value={overview.avg_pri_score.toFixed(1)}
                accent={
                  overview.fleet_color ? COLOR_TEXT[overview.fleet_color] : undefined
                }
              />
              <StatBox
                label="Avg success"
                value={`${overview.avg_success_rate.toFixed(1)}%`}
              />
              <StatBox label="Zones" value={String(overview.total_zones)} />
            </div>

            <div className="space-y-2">
              <SectionLabel>PRI by zone</SectionLabel>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={zoneRows}
                  layout="vertical"
                  margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={96}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    contentStyle={chartTooltipStyle()}
                    labelStyle={chartLabelStyle}
                    itemStyle={chartItemStyle}
                    formatter={(v) => [Number(v).toFixed(1), "PRI"]}
                  />
                  <Bar dataKey="pri_score" radius={[0, 4, 4, 0]} barSize={18}>
                    {zoneRows.map((r) => (
                      <Cell key={r.zone_id} fill={ZONE_HEX[r.color]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <BestWorstCard
                kind="best"
                zoneId={overview.most_reliable_zone}
                row={zoneRows[0]}
              />
              <BestWorstCard
                kind="worst"
                zoneId={overview.highest_risk_zone}
                row={zoneRows[zoneRows.length - 1]}
              />
            </div>
          </div>
        )}

        {target === "servers" && (
          <div className="space-y-5 pb-2">
            <div className="grid grid-cols-3 gap-3">
              <StatBox
                label="Total servers"
                value={String(overview.total_servers)}
              />
              <StatBox
                label="ESX hosts"
                value={String(overview.total_hosts)}
                accent="text-[color:#2b7fff]"
              />
              <StatBox label="VMs" value={String(overview.total_vms)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <SectionLabel>Node type split</SectionLabel>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Tooltip
                      contentStyle={chartTooltipStyle()}
                      labelStyle={chartLabelStyle}
                      itemStyle={chartItemStyle}
                    />
                    <Pie
                      data={[
                        { name: "ESX Hosts", value: overview.total_hosts, fill: HOST_HEX },
                        { name: "VMs", value: overview.total_vms, fill: VM_HEX },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={75}
                      stroke="none"
                    >
                      <Cell fill={HOST_HEX} />
                      <Cell fill={VM_HEX} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                <SectionLabel>Servers per zone</SectionLabel>
                <ResponsiveContainer width="100%" height={Math.max(150, zoneRows.length * 36)}>
                  <BarChart
                    data={zoneRows}
                    layout="vertical"
                    margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={90}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      contentStyle={chartTooltipStyle()}
                      labelStyle={chartLabelStyle}
                      itemStyle={chartItemStyle}
                    />
                    <Bar dataKey="hosts_count" name="ESX" stackId="s" fill={HOST_HEX} barSize={16} />
                    <Bar
                      dataKey="vms_count"
                      name="VMs"
                      stackId="s"
                      fill={VM_HEX}
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {target === "errors" && (
          <div className="space-y-5 pb-2">
            <div className="grid grid-cols-3 gap-3">
              <StatBox
                label="Total errors"
                value={String(errors.total)}
                accent="text-red-400"
              />
              <StatBox
                label="Pre-provision"
                value={String(errors.pre_provision_total)}
              />
              <StatBox
                label="Post-provision"
                value={String(errors.post_provision_total)}
              />
            </div>

            <div className="space-y-2">
              <SectionLabel>Errors by type</SectionLabel>
              {errors.by_type.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(150, errors.by_type.length * 38)}
                >
                  <BarChart
                    data={errors.by_type.map((e) => ({
                      name: errorLabel(e.type),
                      count: e.count,
                    }))}
                    layout="vertical"
                    margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      contentStyle={chartTooltipStyle()}
                      labelStyle={chartLabelStyle}
                      itemStyle={chartItemStyle}
                    />
                    <Bar
                      dataKey="count"
                      name="Errors"
                      fill="#ef4444"
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No errors recorded.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <SectionLabel>By node origin</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <StatBox
                  label="Host-originated"
                  value={String(errors.by_node_type.hosts)}
                />
                <StatBox
                  label="VM-originated"
                  value={String(errors.by_node_type.vms)}
                />
              </div>
            </div>
          </div>
        )}

        {target === "coverage" && (
          <div className="space-y-5 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <BestWorstCard
                kind="best"
                zoneId={overview.most_reliable_zone}
                row={zoneRows[0]}
              />
              <BestWorstCard
                kind="worst"
                zoneId={overview.highest_risk_zone}
                row={zoneRows[zoneRows.length - 1]}
              />
            </div>

            <div className="space-y-2">
              <SectionLabel>{overview.total_zones} zones — ranked by PRI</SectionLabel>
              <div className="space-y-1.5">
                {zoneRows.map((z) => (
                  <div
                    key={z.zone_id}
                    className="flex items-center gap-3 rounded-md border border-border/30 bg-surface-3 px-3 py-2"
                  >
                    <ZoneLogo
                      zoneId={z.zone_id}
                      width={20}
                      height={20}
                      className="object-contain shrink-0"
                    />
                    <span className="text-sm font-medium w-28 shrink-0 truncate">
                      {z.label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, z.pri_score))}%`,
                          backgroundColor: ZONE_HEX[z.color],
                        }}
                      />
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold w-12 text-right ${COLOR_TEXT[z.color]}`}
                    >
                      {z.pri_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                      {z.success_rate.toFixed(1)}% OK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BestWorstCard({
  kind,
  zoneId,
  row,
}: {
  kind: "best" | "worst";
  zoneId: string | null;
  row?: { zone_id: string; pri_score: number; color: ZoneColor };
}) {
  const id = zoneId ?? row?.zone_id ?? null;
  return (
    <div className="rounded-lg border border-border/40 bg-surface-3 p-3">
      <p className="text-xs text-muted-foreground">
        {kind === "best" ? "Most reliable" : "Highest risk"}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {id && (
          <ZoneLogo
            zoneId={id}
            width={22}
            height={22}
            className="object-contain shrink-0"
          />
        )}
        <span className="text-lg font-semibold truncate">
          {id ? formatZoneLabel(id) : "N/A"}
        </span>
        {row && (
          <span
            className={`ml-auto font-mono text-sm font-semibold ${COLOR_TEXT[row.color]}`}
          >
            {row.pri_score.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

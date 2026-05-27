"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import { sileo } from "sileo";
import { toastFill } from "@/app/lib/toast-style";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { Skeleton } from "@/app/components/ui/skeleton";

interface ErrorTimelineData {
  type: string;
  name: string;
  count: number;
  percentage: number;
}

interface ErrorTimelineProps {
  preProvisionData: ErrorTimelineData[];
  postProvisionData: ErrorTimelineData[];
  isLoading?: boolean;
}

const BAR_COLORS = ["#8ec5ff", "#2b7fff", "#155dfc", "#1447e6", "#193cb8"];

export function ErrorTimeline({
  preProvisionData,
  postProvisionData,
  isLoading = false,
}: ErrorTimelineProps) {
  const [phase, setPhase] = useState<"pre-provision" | "post-provision">(
    "post-provision",
  );

  const data = phase === "pre-provision" ? preProvisionData : postProvisionData;
  const totalSelectedPhase = data.reduce((sum, d) => sum + d.count, 0);
  const totalPreProvision = preProvisionData.reduce(
    (sum, d) => sum + d.count,
    0,
  );
  const totalPostProvision = postProvisionData.reduce(
    (sum, d) => sum + d.count,
    0,
  );

  const chartData = useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        fill: BAR_COLORS[index % BAR_COLORS.length],
      })),
    [data],
  );

  const chartConfig = {
    count: {
      label: "Errors",
      color: "#155dfc",
    },
  } satisfies ChartConfig;

  const handlePhaseChange = (nextPhase: "pre-provision" | "post-provision") => {
    if (nextPhase === phase) return;

    setPhase(nextPhase);
    const nextTotal =
      nextPhase === "pre-provision" ? totalPreProvision : totalPostProvision;

    sileo.info({
      title: "Error Classification Updated",
      fill: toastFill(),
      description: `Showing ${nextTotal} ${nextPhase.replace("-", " ")} errors.`,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-xl">Error Classification</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed breakdown of provisioning failures
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
      <Card className="border-border/50 shadow-sm h-fit">
        <CardHeader className="pb-4 border-b border-border/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Error Classification</CardTitle>
          </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
            <Button
              variant={phase === "pre-provision" ? "default" : "outline"}
              size="sm"
                className="h-auto min-w-24 py-2"
              onClick={() => handlePhaseChange("pre-provision")}
            >
                <span>Pre ({totalPreProvision})</span>
            </Button>
            <Button
              variant={phase === "post-provision" ? "default" : "outline"}
              size="sm"
                className="h-auto min-w-24 py-2"
              onClick={() => handlePhaseChange("post-provision")}
            >
                <span>Post ({totalPostProvision})</span>
            </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="pt-6">
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No {phase} errors detected</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="max-h-[340px] w-full">
            <BarChart
              accessibilityLayer
              width={900}
              height={320}
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 14 }}
                tickFormatter={(value) =>
                  typeof value === "string" ? value.slice(0, 14) : value
                }
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid color-mix(in oklch, var(--border) 60%, transparent)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                itemStyle={{ color: "var(--muted-foreground)" }}
              />
              <Bar dataKey="count" radius={8}>
                {chartData.map((entry, index) => (
                  <Cell key={`${entry.type}-bar-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="count"
                  position="top"
                  offset={10}
                  className="fill-foreground"
                  fontSize={14}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total {phase} errors: {totalSelectedPhase}{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing classified errors for the selected phase
        </div>
      </CardFooter>
    </Card>
  );
}

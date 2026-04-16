"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import { sileo } from "sileo";
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
      fill: "#171717",
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Error Classification</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant={phase === "pre-provision" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePhaseChange("pre-provision")}
            >
              Pre-Provision ({totalPreProvision})
            </Button>
            <Button
              variant={phase === "post-provision" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePhaseChange("post-provision")}
            >
              Post-Provision ({totalPostProvision})
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
                content={<ChartTooltipContent hideLabel />}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
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

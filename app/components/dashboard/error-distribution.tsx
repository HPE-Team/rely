"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/app/components/ui/chart";
import { Skeleton } from "@/app/components/ui/skeleton";

interface ErrorData {
  name: string;
  value: number;
  type: string;
  fill?: string;
}

interface ErrorDistributionProps {
  data: ErrorData[];
  title?: string;
  isLoading?: boolean;
}

const COLORS = [
  "#8ec5ff",
  "#2b7fff",
  "#155dfc",
  "#1447e6",
  "#193cb8",
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
];

export function ErrorDistributionChart({
  data,
  title = "Error Distribution by Type",
  isLoading = false,
}: ErrorDistributionProps) {
  const chartData = React.useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length],
      })),
    [data],
  );

  const totalErrors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  const topError = React.useMemo(
    () =>
      chartData.reduce((top, curr) => {
        if (!top || curr.value > top.value) return curr;
        return top;
      }, chartData[0]),
    [chartData],
  );

  if (isLoading) {
    return (
      <Card className="flex flex-col border-border/50 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed breakdown of provisioning failures
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pt-6 pb-0">
          <div className="mx-auto aspect-square max-h-[320px] flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
          <div className="mt-4 mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-40 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed breakdown of provisioning failures
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 h-80 flex items-center justify-center">
          <p className="text-muted-foreground">All systems operational</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    value: {
      label: "Errors",
    },
    ...Object.fromEntries(
      chartData.map((item, index) => [
        item.type,
        {
          label: item.name,
          color: COLORS[index % COLORS.length],
        },
      ]),
    ),
  };

  return (
    <Card className="flex flex-col border-border/50 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          Detailed breakdown of provisioning failures
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-6 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[320px]"
        >
          <PieChart width={320} height={320}>
            <ChartTooltip
              cursor={false}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid color-mix(in oklch, var(--border) 60%, transparent)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--popover-foreground)" }}
              itemStyle={{ color: "var(--muted-foreground)" }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={84}
              stroke="none"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.type}-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalErrors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Errors
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
          {chartData.map((item, index) => (
            <div
              key={`${item.type}-legend-${index}`}
              className="inline-flex items-center gap-3 rounded-md border border-border/50 px-3 py-2"
            >
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm">{item.name}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-4 flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Top error: {topError?.name ?? "N/A"} ({topError?.value ?? 0}){" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total errors for the selected zone
        </div>
      </CardFooter>
    </Card>
  );
}

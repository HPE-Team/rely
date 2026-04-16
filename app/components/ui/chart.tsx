"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/app/lib/utils"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, { label?: string; color?: string }>
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex aspect-video justify-center text-xs", className)}
    {...props}
  />
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
}

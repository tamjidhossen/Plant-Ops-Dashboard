import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts"
import {
  Tooltip as UITooltip,
  TooltipContent as UITooltipContent,
  TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Loader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { DailyMetric } from "@/lib/types"

const COLORS = {
  productive: "#10b981",
  downtime: "#f43f5e",
  total: "#64748b",
}

const chartConfig = {
  productive: {
    label: "Productive Hours",
    color: COLORS.productive,
  },
  downtime: {
    label: "Downtime Hours",
    color: COLORS.downtime,
  },
  total: {
    label: "Total Capacity",
    color: COLORS.total,
  },
} satisfies ChartConfig

interface OperationalHoursTrendProps {
  timeRange?: 3 | 7 | 30 | "all"
}

export function OperationalHoursTrend({ timeRange }: OperationalHoursTrendProps) {
  const [data, setData] = useState<DailyMetric[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleKeys, setVisibleKeys] = useState({
    productive: true,
    downtime: true,
    total: false,
  })

  useEffect(() => {
    setIsLoading(true)
    const days = timeRange && timeRange !== "all" ? timeRange : undefined
    api.getDailyMetrics(days).then((d) => {
      setData(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [timeRange])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Operational Hours Allocation</CardTitle>
          <CardDescription>Breakdown of active hours versus downtime hours</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <Loader message="Analyzing daily activities..." />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateStr = label
        ? new Date(label + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : ""

      // Find original daily record from payload
      const activeData = payload[0].payload as DailyMetric
      const productive = activeData.productive_hours
      const downtime = activeData.downtime_hours
      const total = activeData.total_hours

      const prodPercent = total > 0 ? ((productive / total) * 100).toFixed(1) : "0"
      const downPercent = total > 0 ? ((downtime / total) * 100).toFixed(1) : "0"

      return (
        <div className="rounded-lg border border-border bg-background p-3 shadow-md text-xs min-w-[200px]">
          <div className="font-semibold mb-2">{dateStr}</div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Productive
              </span>
              <span className="font-medium font-mono">
                {productive.toFixed(1)} hrs ({prodPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Downtime
              </span>
              <span className="font-medium font-mono">
                {downtime.toFixed(1)} hrs ({downPercent}%)
              </span>
            </div>
            <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Total Capacity
              </span>
              <span className="font-medium font-mono">{total.toFixed(1)} hrs</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Daily Operational Hours Allocation</CardTitle>
          <CardDescription>
            Stack of productive vs downtime hours. Line shows total shift capacity.
          </CardDescription>
        </div>
        
        {/* Interactive custom legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <UITooltip>
            <UITooltipTrigger asChild>
              <button
                onClick={() => setVisibleKeys(prev => ({ ...prev, productive: !prev.productive }))}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer text-xs",
                  visibleKeys.productive
                    ? "bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/10 text-foreground"
                    : "bg-muted border-transparent text-muted-foreground/60 line-through opacity-60"
                )}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                Productive Hours
              </button>
            </UITooltipTrigger>
            <UITooltipContent>
              <p>Shift duration spent on active operational tasks (e.g. normal operations, planned production runs).</p>
            </UITooltipContent>
          </UITooltip>

          <UITooltip>
            <UITooltipTrigger asChild>
              <button
                onClick={() => setVisibleKeys(prev => ({ ...prev, downtime: !prev.downtime }))}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer text-xs",
                  visibleKeys.downtime
                    ? "bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20 dark:border-rose-500/10 text-foreground"
                    : "bg-muted border-transparent text-muted-foreground/60 line-through opacity-60"
                )}
              >
                <div className="h-2 w-2 rounded-full bg-rose-400" />
                Downtime Hours
              </button>
            </UITooltipTrigger>
            <UITooltipContent>
              <p>Hours lost to operational interruptions (e.g. equipment breakdowns, power failures, cleaning delays).</p>
            </UITooltipContent>
          </UITooltip>

          <UITooltip>
            <UITooltipTrigger asChild>
              <button
                onClick={() => setVisibleKeys(prev => ({ ...prev, total: !prev.total }))}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer text-xs",
                  visibleKeys.total
                    ? "bg-slate-500/10 dark:bg-slate-500/5 border-slate-500/20 dark:border-slate-500/10 text-foreground"
                    : "bg-muted border-transparent text-muted-foreground/60 line-through opacity-60"
                )}
              >
                <div className="h-2 w-2 rounded-full bg-slate-500" />
                Total Shift Capacity
              </button>
            </UITooltipTrigger>
            <UITooltipContent>
              <p>Sum of all logged shift durations for the day (Productive Hours + Downtime Hours).</p>
            </UITooltipContent>
          </UITooltip>
        </div>
      </CardHeader>
      
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillProductive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.productive} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.productive} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillDowntime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.downtime} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.downtime} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const d = new Date(value + "T00:00:00")
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(val) => `${val} hrs`}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Overlapping Areas */}
            {visibleKeys.productive && (
              <Area
                dataKey="productive_hours"
                type="monotone"
                fill="url(#fillProductive)"
                stroke={COLORS.productive}
                strokeWidth={2}
              />
            )}
            {visibleKeys.downtime && (
              <Area
                dataKey="downtime_hours"
                type="monotone"
                fill="url(#fillDowntime)"
                stroke={COLORS.downtime}
                strokeWidth={2}
              />
            )}
            
            {/* Overlay line for capacity */}
            {visibleKeys.total && (
              <Line
                dataKey="total_hours"
                type="monotone"
                stroke={COLORS.total}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

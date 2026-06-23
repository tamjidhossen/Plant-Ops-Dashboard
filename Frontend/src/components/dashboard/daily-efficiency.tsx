import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Loader } from "@/components/ui/loader"
import { api } from "@/lib/api"
import type { DailyMetric } from "@/lib/types"

const chartConfig = {
  efficiency: {
    label: "Efficiency",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface DailyEfficiencyProps {
  timeRange?: 3 | 7 | 30 | "all"
}

export function DailyEfficiency({ timeRange }: DailyEfficiencyProps) {
  const [data, setData] = useState<DailyMetric[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        <CardHeader><CardTitle>Daily Efficiency Trend</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center min-h-[250px]">
          <Loader message="Fetching daily performance..." />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Efficiency Trend</CardTitle>
        <CardDescription>
          Operational efficiency score by date. Dashed line shows 80% target.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillEfficiency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-efficiency)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-efficiency)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const d = new Date(value + "T00:00:00")
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <ReferenceLine
              y={80}
              strokeDasharray="4 4"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  formatter={(value) => [`${value}%`, "Efficiency"]}
                />
              }
            />
            <Area
              dataKey="efficiency"
              type="monotone"
              fill="url(#fillEfficiency)"
              stroke="var(--color-efficiency)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

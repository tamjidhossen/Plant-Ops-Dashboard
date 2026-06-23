import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Loader } from "@/components/ui/loader"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/lib/api"
import type { HourlyActivity as HourlyActivityType } from "@/lib/types"

const chartConfig = {
  count: {
    label: "Events",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface HourlyDistributionChartProps {
  timeRange?: 3 | 7 | 30 | "all"
}

export function HourlyDistributionChart({ timeRange }: HourlyDistributionChartProps) {
  const [data, setData] = useState<HourlyActivityType[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const days = timeRange && timeRange !== "all" ? timeRange : undefined
    api.getHourlyActivity(days).then((d) => {
      setData(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [timeRange])

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Hourly Event Distribution</CardTitle>
          <CardDescription>Frequency of events by hour of day</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[240px]">
          <Loader message="Compiling hour profiles..." />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  // Aggregate count by hour across all dates
  const hourlyTotals = Array.from({ length: 24 }, (_, h) => {
    const total = data
      .filter((item) => item.hour === h)
      .reduce((sum, item) => sum + item.count, 0)
    return {
      hour: `${h.toString().padStart(2, "0")}:00`,
      count: total,
    }
  })

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <CardTitle>Hourly Event Distribution</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <InfoIcon className="size-3.5" />
                <span className="sr-only">Information</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px]">
              <p>
                Represents all recorded activities (including Breakdowns, Power Failures,
                Maintenance, and normal operational tasks) aggregated by their start hour across the selected time period.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>Frequency of events by hour of day</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4 flex flex-col">
        <ChartContainer config={chartConfig} className="w-full flex-1 min-h-[280px]">
          <BarChart data={hourlyTotals}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const hourNum = parseInt(value.split(":")[0])
                if (hourNum === 0) return "12 AM"
                if (hourNum === 12) return "12 PM"
                return hourNum > 12 ? `${hourNum - 12} PM` : `${hourNum} AM`
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.15 }}
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} event(s)`, "Events"]}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

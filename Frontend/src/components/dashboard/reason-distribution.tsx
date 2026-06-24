import { useEffect, useState } from "react"
import { Cell, Pie, PieChart } from "recharts"

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
import type { ReasonDistribution as ReasonDistType } from "@/lib/types"

import type { TimeRangeValue } from "@/lib/types"
import { parseTimeRange } from "@/lib/utils"

interface ReasonDistributionProps {
  timeRange?: TimeRangeValue
}

export function ReasonDistribution({ timeRange }: ReasonDistributionProps) {
  const [data, setData] = useState<ReasonDistType[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const { days, dateFrom, dateTo } = parseTimeRange(timeRange)
    api.getReasonDistribution(days, dateFrom, dateTo).then((d) => {
      setData(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [timeRange])

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader><CardTitle>Activity Distribution</CardTitle></CardHeader>
        <CardContent className="flex flex-1 items-center justify-center min-h-[250px]">
          <Loader message="Compiling activity share..." />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  const chartConfig: ChartConfig = {}
  data.forEach((d) => {
    chartConfig[d.reason] = { label: d.reason, color: d.color }
  })

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle>Activity Distribution</CardTitle>
        <CardDescription>Hours breakdown by activity reason</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center sm:flex-row items-center gap-6 pt-0 pb-6">
        <div className="relative w-full max-w-[200px] shrink-0">
          <ChartContainer config={chartConfig} className="aspect-square w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span>{name}</span>
                        <span className="ml-auto font-mono font-medium">{value}h</span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="hours"
                nameKey="reason"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={2}
                stroke="var(--card)"
              >
                {data.map((entry) => (
                  <Cell key={entry.reason} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full">
          {data.map((d) => (
            <div key={d.reason} className="flex items-center gap-2 text-xs">
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate text-muted-foreground font-medium" title={d.reason}>
                {d.reason}
              </span>
              <span className="ml-auto tabular-nums font-semibold text-foreground">
                {d.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

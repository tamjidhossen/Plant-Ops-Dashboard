import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Loader } from "@/components/ui/loader"
import { api } from "@/lib/api"
import type { HourlyActivity as HourlyActivityType } from "@/lib/types"

interface HourlyHeatmapProps {
  timeRange?: 3 | 7 | 30 | "all"
}

export function HourlyHeatmap({ timeRange }: HourlyHeatmapProps) {
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
      <Card>
        <CardHeader><CardTitle>Activity Heatmap</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <Loader message="Synthesizing activity concentrations..." />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  // Build grid: rows = dates, cols = hours 0-23
  const dates = [...new Set(data.map((d) => d.date))].sort()
  const grid: Record<string, Record<number, HourlyActivityType>> = {}
  let maxCount = 1

  data.forEach((item) => {
    if (!grid[item.date]) grid[item.date] = {}
    grid[item.date][item.hour] = item
    if (item.count > maxCount) maxCount = item.count
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <CardDescription>
          Event concentration by hour of day and date. Darker cells indicate more activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[480px] p-1">
            {/* Hour labels */}
            <div className="mb-2 flex gap-1">
              <div className="w-16 shrink-0" />
              <div className="flex gap-[3px]">
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    className="w-3.5 text-center text-[9px] font-medium text-muted-foreground/80 shrink-0"
                  >
                    {h % 4 === 0 ? `${h}h` : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid rows */}
            {dates.map((date) => (
              <div key={date} className="mb-1 flex items-center gap-1">
                <div className="w-16 shrink-0 pr-2 text-right text-[10px] font-medium text-muted-foreground/80">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex gap-[3px]">
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = grid[date]?.[h]
                    const count = cell?.count || 0

                    return (
                      <Tooltip key={h}>
                        <TooltipTrigger asChild>
                          <div
                            className={`size-3.5 rounded-[2px] transition-colors shrink-0 ${
                              count > 0
                                ? "bg-primary"
                                : "bg-muted/40 dark:bg-neutral-800/60 hover:bg-muted/60 dark:hover:bg-neutral-700/80"
                            }`}
                            style={
                              count > 0
                                ? {
                                    opacity: 0.25 + (count / maxCount) * 0.75,
                                  }
                                : undefined
                            }
                          />
                        </TooltipTrigger>
                        {count > 0 && (
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-semibold">
                                {date} at {h.toString().padStart(2, "0")}:00
                              </p>
                              <p className="text-muted-foreground mt-0.5">
                                {count} event{count > 1 ? "s" : ""} detected
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] border-t pt-1">
                                {cell?.reasons.join(", ")}
                              </p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Color scale legend */}
            <div className="mt-4 flex items-center justify-start pl-16 gap-1 text-[10px] text-muted-foreground">
              <span className="mr-1">Less</span>
              <div className="size-3.5 rounded-[2px] bg-muted/40 dark:bg-neutral-800/60" />
              {[0.25, 0.44, 0.63, 0.81, 1.0].map((opacity) => (
                <div
                  key={opacity}
                  className="size-3.5 rounded-[2px] bg-primary"
                  style={{
                    opacity: opacity,
                  }}
                />
              ))}
              <span className="ml-1">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

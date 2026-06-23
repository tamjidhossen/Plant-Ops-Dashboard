import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/lib/api"
import type { ShiftChartDay, CategoryConfig } from "@/lib/types"

interface ShiftAnalysisChartProps {
  categoryConfig: CategoryConfig | null
  timeRange?: 3 | 7 | 30 | "all"
}

export function ShiftAnalysisChart({ categoryConfig, timeRange }: ShiftAnalysisChartProps) {
  const [data, setData] = useState<ShiftChartDay[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set())

  // Responsive container width measuring
  const [containerWidth, setContainerWidth] = useState(800)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const days = timeRange && timeRange !== "all" ? timeRange : undefined
    api.getShiftChartData(days).then((d) => {
      setData(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [timeRange])

  // Initialize selected reasons once data is loaded
  useEffect(() => {
    if (data) {
      const reasons = new Set<string>()
      data.forEach((day) =>
        day.segments.forEach((seg) => reasons.add(seg.reason))
      )
      setSelectedReasons(reasons)
    }
  }, [data])

  useEffect(() => {
    if (!containerRef) return
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef)
    return () => observer.disconnect()
  }, [containerRef])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shift Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <Loader message="Mapping shift timeline..." />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shift Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No shift data available for visualization.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Collect all unique reasons for legend
  const allReasons = new Set<string>()
  data.forEach((day) =>
    day.segments.forEach((seg) => allReasons.add(seg.reason))
  )
  const reasonColors = categoryConfig?.reason_colors || {}

  // Chart dimensions
  const chartHeight = 400
  const chartPadding = { top: 20, right: 20, bottom: 60, left: 60 }
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const minChartWidth = 700
  const width = Math.max(containerWidth, minChartWidth)
  const plotWidth = width - chartPadding.left - chartPadding.right
  const dayWidth = data.length > 0 ? plotWidth / data.length : 50

  // Y-axis: 0 to 1440 minutes (24 hours), displayed as time labels
  const yScale = (minutes: number) => {
    return chartPadding.top + ((1440 - minutes) / 1440) * plotHeight
  }

  const timeLabels = [0, 180, 360, 540, 720, 900, 1080, 1260, 1440]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Analysis Chart</CardTitle>
        <CardDescription>
          Shift activity periods by date and time of day. Each bar represents a shift
          from start to end time, colored by activity reason.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Interactive Legend */}
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Interactive Legend (click to toggle)</span>
            <button
              onClick={() => {
                if (selectedReasons.size === allReasons.size) {
                  setSelectedReasons(new Set())
                } else {
                  setSelectedReasons(new Set(allReasons))
                }
              }}
              className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/5"
            >
              Toggle All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(allReasons)
              .sort()
              .map((reason) => {
                const isSelected = selectedReasons.has(reason)
                const color = reasonColors[reason] || "#94a3b8"
                return (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedReasons((prev) => {
                        const next = new Set(prev)
                        if (next.has(reason)) {
                          next.delete(reason)
                        } else {
                          next.add(reason)
                        }
                        return next
                      })
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-card text-foreground border-input shadow-xs"
                        : "bg-muted/40 text-muted-foreground/60 border-transparent"
                    }`}
                  >
                    <div
                      className="size-2 rounded-full transition-transform shrink-0"
                      style={{
                        backgroundColor: isSelected ? color : "currentColor",
                        transform: isSelected ? "scale(1)" : "scale(0.8)",
                      }}
                    />
                    <span>{reason}</span>
                  </button>
                )
              })}
          </div>
        </div>

        {/* Chart */}
        <div ref={setContainerRef} className="overflow-x-auto w-full">
          <svg
            width={width}
            height={chartHeight}
            className="font-sans text-xs"
          >
            {/* Y-axis grid lines and labels */}
            {timeLabels.map((mins) => {
              const y = yScale(mins)
              const hours = Math.floor(mins / 60)
              const label =
                hours === 0
                  ? "12 AM"
                  : hours === 12
                    ? "12 PM"
                    : hours < 12
                      ? `${hours} AM`
                      : `${hours - 12} PM`

              return (
                <g key={mins}>
                  <line
                    x1={chartPadding.left}
                    y1={y}
                    x2={width - chartPadding.right}
                    y2={y}
                    className="stroke-border"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartPadding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {label}
                  </text>
                </g>
              )
            })}

            {/* Bars for each day */}
            {data.map((day, dayIdx) => {
              const x = chartPadding.left + dayIdx * dayWidth + dayWidth / 2
              const visibleSegments = day.segments.filter((seg) => selectedReasons.has(seg.reason))

              return (
                <g key={day.date}>
                  {/* Date label on X-axis */}
                  <text
                    x={x}
                    y={chartHeight - chartPadding.bottom + 20}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                    transform={`rotate(-45, ${x}, ${chartHeight - chartPadding.bottom + 20})`}
                  >
                    {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>

                  {/* Shift bars */}
                  {visibleSegments.map((seg, segIdx) => {
                    const y1 = yScale(seg.end_minutes)
                    const y2 = yScale(seg.start_minutes)
                    const barHeight = Math.max(y2 - y1, 2)
                    const barWidth = dayWidth * 0.6

                    return (
                      <Tooltip key={segIdx}>
                        <TooltipTrigger asChild>
                          <rect
                            x={x - barWidth / 2}
                            y={y1}
                            width={barWidth}
                            height={barHeight}
                            rx={2}
                            fill={seg.color}
                            opacity={0.85}
                            className="cursor-pointer transition-opacity hover:opacity-100"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="text-xs">
                            <p className="font-medium">{seg.reason}</p>
                            <p>
                              {seg.start_time} - {seg.end_time}
                            </p>
                            <p>{seg.duration}h duration</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}

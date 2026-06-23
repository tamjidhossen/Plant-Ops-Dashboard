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
  AlertTriangleIcon,
  AlertCircleIcon,
  LightbulbIcon,
  TrendingDownIcon,
} from "lucide-react"
import { api } from "@/lib/api"
import type { OperationalInsight } from "@/lib/types"

const categoryIcons: Record<string, React.ElementType> = {
  critical: AlertTriangleIcon,
  warning: AlertCircleIcon,
  analysis: LightbulbIcon,
}

const categoryStyles: Record<string, string> = {
  critical: "border-red-500/20 bg-red-500/5",
  warning: "border-yellow-500/20 bg-yellow-500/5",
  analysis: "border-blue-500/20 bg-blue-500/5",
}

interface InsightsPanelProps {
  timeRange?: 3 | 7 | 30 | "all"
}

export function InsightsPanel({ timeRange }: InsightsPanelProps) {
  const [insights, setInsights] = useState<OperationalInsight[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const days = timeRange && timeRange !== "all" ? timeRange : undefined
    api.getInsights(days).then((d) => {
      setInsights(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [timeRange])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Operational Insights</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center min-h-[160px]">
          <Loader message="Synthesizing insights..." />
        </CardContent>
      </Card>
    )
  }

  if (!insights || insights.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational Insights</CardTitle>
        <CardDescription>
          Dynamically generated insights for plant managers. All metrics computed from uploaded data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {insights.map((insight, i) => {
            const Icon = categoryIcons[insight.category] || TrendingDownIcon
            const style = categoryStyles[insight.category] || ""

            return (
              <div
                key={i}
                className={`flex flex-col gap-2 rounded-lg border p-4 ${style}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    <span className="text-sm font-medium">{insight.title}</span>
                  </div>
                  <span className="rounded-md bg-background px-2 py-0.5 text-lg font-bold tabular-nums">
                    {insight.metric}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {insight.description}
                </p>
                <div className="mt-auto border-t pt-2">
                  <p className="text-xs font-medium text-foreground/80">
                    Recommendation:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {insight.recommendation}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

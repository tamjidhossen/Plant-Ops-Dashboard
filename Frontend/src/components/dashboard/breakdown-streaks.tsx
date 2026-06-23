import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader } from "@/components/ui/loader"
import { api } from "@/lib/api"
import type { BreakdownStreakResponse } from "@/lib/types"
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  ClockIcon,
  ZapIcon,
  ActivityIcon,
} from "lucide-react"

interface BreakdownStreaksProps {
  timeRange?: 3 | 7 | 30 | "all"
}

export function BreakdownStreaks({ timeRange }: BreakdownStreaksProps) {
  const [data, setData] = useState<BreakdownStreakResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const days = timeRange && timeRange !== "all" ? timeRange : undefined
    api.getBreakdownStreaks(undefined, days).then((d) => {
      setData(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [timeRange])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Breakdown Streaks</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <Loader message="Analyzing breakdown streaks..." />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const severityIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangleIcon className="size-3.5 text-red-500" />
      case "warning": return <AlertCircleIcon className="size-3.5 text-yellow-500" />
      default: return <InfoIcon className="size-3.5 text-blue-500" />
    }
  }

  const severityVariant = (level: string) => {
    switch (level) {
      case "critical": return "destructive" as const
      case "warning": return "secondary" as const
      default: return "outline" as const
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ZapIcon className="size-3.5" />
              Total Streaks
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data.summary?.total_streaks ?? 0}
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Detected breakdown clusters
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              Total Breakdown Hours
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {data.summary?.total_breakdown_hours ?? 0}h
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Accumulated across all streaks
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ActivityIcon className="size-3.5" />
              Worst Severity
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              {data.summary?.worst_severity ?? 0}
              <Badge variant={severityVariant(data.summary?.worst_severity_level || "minor")}>
                {data.summary?.worst_severity_level || "none"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            Highest severity score found
          </CardFooter>
        </Card>
      </div>

      {/* Streak detail table */}
      <Card>
        <CardHeader>
          <CardTitle>Streak Details</CardTitle>
          <CardDescription>
            Each streak represents a cluster of breakdown events within a
            {" "}{data.algorithm?.gap_threshold_hours ?? 8}h gap threshold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!data.streaks || data.streaks.length === 0) ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No breakdown streaks detected in the current dataset.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Span</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.streaks.map((streak, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant={severityVariant(streak.severity_level)} className="gap-1">
                          {severityIcon(streak.severity_level)}
                          {streak.severity_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(streak.start_time).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(streak.end_time).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {streak.total_duration_hours}h
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {streak.event_count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {streak.span_hours}h
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {streak.severity_score}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Algorithm explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Algorithm Documentation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="space-y-2">
            <p>{data.algorithm?.description ?? "Identify breakdown clusters by temporal proximity."}</p>
            <p>
              <strong className="text-foreground">Gap threshold:</strong>{" "}
              {data.algorithm?.gap_threshold_hours ?? 8} hours between events
            </p>
            <p>
              <strong className="text-foreground">Severity formula:</strong>{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {data.algorithm?.severity_formula ?? "severity = 0.6 * (total_duration / 10) + 0.4 * (event_count / 5)"}
              </code>
            </p>
            <div>
              <strong className="text-foreground">Severity levels:</strong>
              <ul className="mt-1 list-inside list-disc">
                {Object.entries(
                  data.algorithm?.levels || {
                    critical: "severity score >= 70",
                    warning: "severity score >= 40",
                    minor: "severity score < 40",
                  }
                ).map(([level, condition]) => (
                  <li key={level}>
                    <span className="capitalize">{level}</span>: {condition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

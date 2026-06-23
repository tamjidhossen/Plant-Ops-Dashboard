import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  CopyIcon,
  ClockIcon,
  CalendarIcon,
  LayersIcon,
} from "lucide-react"
import { api } from "@/lib/api"
import type { QualityReport } from "@/lib/types"

const ISSUE_TYPE_LABELS: Record<string, string> = {
  missing_timestamp: "Missing Timestamp",
  invalid_timestamp: "Invalid Timestamp",
  invalid_date: "Invalid Date",
  negative_duration: "Negative Duration",
  duration_mismatch: "Duration Mismatch",
  duplicate: "Duplicate Record",
  overlapping_shift: "Overlapping Shift",
  end_before_start: "End Before Start",
}

const ISSUE_TYPE_ICONS: Record<string, React.ElementType> = {
  missing_timestamp: ClockIcon,
  invalid_timestamp: ClockIcon,
  invalid_date: CalendarIcon,
  negative_duration: AlertTriangleIcon,
  duration_mismatch: AlertTriangleIcon,
  duplicate: CopyIcon,
  overlapping_shift: LayersIcon,
  end_before_start: AlertTriangleIcon,
}

export function DataQualityPage() {
  const [report, setReport] = useState<QualityReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.getQualityReport().then((d) => {
      setReport(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader message="Analyzing dataset quality..." />
      </div>
    )
  }

  if (!report) return null

  const totalIssues = Object.values(report.issue_summary).reduce((a, b) => a + b, 0)

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Records</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{report.total_records}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShieldCheckIcon className="size-3.5 text-green-500" />
              Valid Records
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">
              {report.valid_records}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangleIcon className="size-3.5 text-red-500" />
              Invalid Records
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-red-600 dark:text-red-400">
              {report.invalid_records}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CopyIcon className="size-3.5 text-yellow-500" />
              Duplicates
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">{report.duplicate_records}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Issue breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Breakdown</CardTitle>
          <CardDescription>
            {totalIssues} issues detected across {Object.keys(report.issue_summary).length} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 @xl/main:grid-cols-3 @3xl/main:grid-cols-4">
            {Object.entries(report.issue_summary)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const Icon = ISSUE_TYPE_ICONS[type] || AlertTriangleIcon
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {ISSUE_TYPE_LABELS[type] || type}
                      </p>
                      <p className="text-xs text-muted-foreground">{count} found</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Resolution strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resolution Strategy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="space-y-1.5">
            <li><strong className="text-foreground">Missing timestamps:</strong> Record excluded from timeline visualizations. Stated hours used for totals when available.</li>
            <li><strong className="text-foreground">Invalid timestamps:</strong> Same as missing. Record kept for aggregate metrics if duration is available.</li>
            <li><strong className="text-foreground">Invalid dates:</strong> Inferred from START timestamp when possible. Marked invalid otherwise.</li>
            <li><strong className="text-foreground">Negative durations:</strong> Recalculated from timestamps. Absolute value used as fallback.</li>
            <li><strong className="text-foreground">Duration mismatches:</strong> Recalculated value from timestamps used. Original preserved for audit.</li>
            <li><strong className="text-foreground">Duplicates:</strong> First occurrence kept. Duplicates excluded from all analysis.</li>
            <li><strong className="text-foreground">Overlapping shifts:</strong> Both records kept and flagged. May indicate concurrent operations or data entry errors.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Detailed issue table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Issue Log</CardTitle>
          <CardDescription>All data quality issues with original values, resolutions, and corrections applied</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.issues.length > 0 ? (
                    report.issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="tabular-nums">{issue.row_index}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {ISSUE_TYPE_LABELS[issue.issue_type] || issue.issue_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{issue.description}</TableCell>
                        <TableCell className="font-mono text-xs">{issue.original_value || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{issue.resolved_value || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{issue.resolution}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No quality issues found. Data is clean.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

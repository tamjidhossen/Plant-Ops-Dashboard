import { KPICards } from "@/components/dashboard/kpi-cards"
import { ShiftAnalysisChart } from "@/components/dashboard/shift-analysis-chart"
import { OperationalHoursTrend } from "@/components/dashboard/operational-hours-trend"
import { ReasonDistribution } from "@/components/dashboard/reason-distribution"
import { DailyEfficiency } from "@/components/dashboard/daily-efficiency"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import type { AnalyticsSummary, CategoryConfig } from "@/lib/types"

interface OverviewPageProps {
  summary: AnalyticsSummary | null
  categoryConfig: CategoryConfig | null
  timeRange: 3 | 7 | 30 | "all"
}

export function OverviewPage({ summary, categoryConfig, timeRange }: OverviewPageProps) {
  return (
    <>
      {summary && <KPICards summary={summary} />}
      <ShiftAnalysisChart categoryConfig={categoryConfig} timeRange={timeRange} />
      <OperationalHoursTrend timeRange={timeRange} />
      <div className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-2">
        <ReasonDistribution timeRange={timeRange} />
        <DailyEfficiency timeRange={timeRange} />
      </div>
      <InsightsPanel timeRange={timeRange} />
    </>
  )
}

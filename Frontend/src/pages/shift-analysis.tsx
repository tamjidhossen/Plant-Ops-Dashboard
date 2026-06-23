import { ShiftAnalysisChart } from "@/components/dashboard/shift-analysis-chart"
import { HourlyHeatmap } from "@/components/dashboard/hourly-heatmap"
import { HourlyDistributionChart } from "@/components/dashboard/hourly-distribution-chart"
import type { CategoryConfig } from "@/lib/types"

interface ShiftAnalysisPageProps {
  categoryConfig: CategoryConfig | null
  timeRange: 3 | 7 | 30 | "all"
}

export function ShiftAnalysisPage({ categoryConfig, timeRange }: ShiftAnalysisPageProps) {
  return (
    <>
      <ShiftAnalysisChart categoryConfig={categoryConfig} timeRange={timeRange} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <HourlyHeatmap timeRange={timeRange} />
        <HourlyDistributionChart timeRange={timeRange} />
      </div>
    </>
  )
}

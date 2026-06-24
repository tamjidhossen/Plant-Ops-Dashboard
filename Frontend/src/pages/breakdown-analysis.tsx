import { BreakdownStreaks } from "@/components/dashboard/breakdown-streaks"
import type { TimeRangeValue } from "@/lib/types"

interface BreakdownAnalysisPageProps {
  timeRange: TimeRangeValue
}

export function BreakdownAnalysisPage({ timeRange }: BreakdownAnalysisPageProps) {
  return (
    <>
      <BreakdownStreaks timeRange={timeRange} />
    </>
  )
}

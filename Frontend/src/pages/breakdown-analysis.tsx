import { BreakdownStreaks } from "@/components/dashboard/breakdown-streaks"

interface BreakdownAnalysisPageProps {
  timeRange: 3 | 7 | 30 | "all"
}

export function BreakdownAnalysisPage({ timeRange }: BreakdownAnalysisPageProps) {
  return (
    <>
      <BreakdownStreaks timeRange={timeRange} />
    </>
  )
}

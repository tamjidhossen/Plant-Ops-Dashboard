import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { CSVUpload } from "@/components/explorer/csv-upload"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { PageId, TimeRangeValue, AnalyticsSummary } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { subDays, format } from "date-fns"
import { type DateRange } from "react-day-picker"

const PAGE_TITLES: Record<PageId, string> = {
  "overview": "Overview",
  "shift-analysis": "Shift Analysis",
  "breakdown-analysis": "Breakdown Streaks",
  "data-explorer": "Data Explorer",
  "data-quality": "Data Quality",
  "upload-csv": "Upload CSV",
}

interface SiteHeaderProps {
  activePage: PageId
  hasData: boolean
  onDataChange: () => void
  timeRange: TimeRangeValue
  onTimeRangeChange: (range: TimeRangeValue) => void
  summary?: AnalyticsSummary | null
}

export function SiteHeader({
  activePage,
  hasData,
  onDataChange,
  timeRange,
  onTimeRangeChange,
  summary,
}: SiteHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Only show range filters on pages with graphs/metrics
  const showTimeFilter = hasData && ["overview", "shift-analysis", "breakdown-analysis"].includes(activePage)

  // Calculate default range (last 7 days of active dataset or today)
  const maxDate = summary?.max_date ? new Date(summary.max_date + "T00:00:00") : new Date()
  const defaultFrom = subDays(maxDate, 6)
  const defaultTo = maxDate

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                Plant Ops
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{PAGE_TITLES[activePage]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-3">
          {showTimeFilter && (
            <div className="flex items-center bg-muted/65 p-0.5 rounded-lg border border-border text-[11px] h-7 gap-0.5">
              {([3, 7, 30, "all"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  className={`h-full px-2.5 rounded-md font-medium transition-all cursor-pointer ${
                    timeRange === range
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range === "all" ? "All" : `${range}D`}
                </button>
              ))}

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => {
                      const isCustom = timeRange && typeof timeRange === "object";
                      if (!isCustom) {
                        onTimeRangeChange({ from: defaultFrom, to: defaultTo });
                      }
                    }}
                    className={`h-full px-2.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      timeRange && typeof timeRange === "object"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CalendarIcon className="h-3 w-3 shrink-0" />
                    {timeRange && typeof timeRange === "object" ? (
                      timeRange.from ? (
                        timeRange.to ? (
                          <span className="text-[10px] whitespace-nowrap">
                            {format(timeRange.from, "MMM d")} - {format(timeRange.to, "MMM d")}
                          </span>
                        ) : (
                          <span className="text-[10px] whitespace-nowrap">
                            {format(timeRange.from, "MMM d")}
                          </span>
                        )
                      ) : (
                        <span>Range</span>
                      )
                    ) : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={timeRange && typeof timeRange === "object" ? timeRange.from : defaultFrom}
                    selected={timeRange && typeof timeRange === "object" ? timeRange as DateRange : undefined}
                    onSelect={(range) => {
                      if (range) {
                        onTimeRangeChange(range);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          {hasData && <CSVUpload onUploadComplete={onDataChange} compact />}
          <AnimatedThemeToggler
            theme={theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme}
            onThemeChange={(newTheme) => setTheme(newTheme)}
            className="flex items-center justify-center h-7 w-7 rounded-lg border hover:bg-muted text-foreground transition-colors cursor-pointer [&>svg]:size-4"
          />
        </div>
      </div>
    </header>
  )
}


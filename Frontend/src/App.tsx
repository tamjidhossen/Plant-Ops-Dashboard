import { useEffect, useState } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { CSVUpload } from "@/components/explorer/csv-upload"
import { useShiftData } from "@/hooks/use-shift-data"
import { Loader } from "@/components/ui/loader"

import { OverviewPage } from "@/pages/overview"
import { ShiftAnalysisPage } from "@/pages/shift-analysis"
import { BreakdownAnalysisPage } from "@/pages/breakdown-analysis"
import { DataExplorerPage } from "@/pages/data-explorer"
import { DataQualityPage } from "@/pages/data-quality"

import type { PageId, TimeRangeValue } from "@/lib/types"

const getPageFromPath = (): PageId => {
  const path = window.location.pathname.replace(/^\//, "")
  const validPages: PageId[] = [
    "overview",
    "shift-analysis",
    "breakdown-analysis",
    "upload-csv",
    "data-explorer",
    "data-quality",
  ]
  return validPages.includes(path as PageId) ? (path as PageId) : "overview"
}

export function App() {
  const [activePage, setActivePage] = useState<PageId>(getPageFromPath)
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("all")
  
  const { hasData, isLoading, summary, categoryConfig, refetch } =
    useShiftData(timeRange)

  const handleNavigate = (page: PageId) => {
    setActivePage(page)
    const newPath = page === "overview" ? "/" : `/${page}`
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, "", newPath)
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromPath())
    }
    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !hasData && activePage !== "upload-csv") {
      setActivePage("upload-csv")
      if (window.location.pathname !== "/upload-csv") {
        window.history.pushState(null, "", "/upload-csv")
      }
    }
  }, [isLoading, hasData, activePage])

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center min-h-[50vh]">
          <Loader size="lg" message="Syncing operational metrics..." />
        </div>
      )
    }

    if (!hasData) {
      return <CSVUpload onUploadComplete={refetch} />
    }

    switch (activePage) {
      case "overview":
        return <OverviewPage summary={summary} categoryConfig={categoryConfig} timeRange={timeRange} />
      case "shift-analysis":
        return <ShiftAnalysisPage categoryConfig={categoryConfig} timeRange={timeRange} />
      case "breakdown-analysis":
        return <BreakdownAnalysisPage timeRange={timeRange} />
      case "data-explorer":
        return <DataExplorerPage categoryConfig={categoryConfig} />
      case "data-quality":
        return <DataQualityPage />
      case "upload-csv":
        return <CSVUpload onUploadComplete={refetch} />
      default:
        return <OverviewPage summary={summary} categoryConfig={categoryConfig} timeRange={timeRange} />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        hasData={hasData}
        variant="inset"
      />
      <SidebarInset className="@container/main">
        <SiteHeader
          activePage={activePage}
          hasData={hasData}
          onDataChange={refetch}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          summary={summary}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {renderPage()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App

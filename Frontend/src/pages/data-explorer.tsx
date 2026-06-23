import { useCallback, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { RotateCcwIcon, DownloadIcon, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { api } from "@/lib/api"
import type { ShiftRecord, CategoryConfig, FilterParams } from "@/lib/types"

interface DataExplorerPageProps {
  categoryConfig: CategoryConfig | null
}

export function DataExplorerPage({ categoryConfig }: DataExplorerPageProps) {
  const [records, setRecords] = useState<ShiftRecord[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterParams>({})

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getRecords(filters)
      setRecords(data)
    } catch {
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const resetFilters = () => setFilters({})

  const exportCSV = () => {
    if (!records) return
    const headers = ["Date", "Start", "End", "Duration (h)", "Reason", "Category", "Valid", "Anomalies"]
    const rows = records.map((r) => [
      r.day_date || "",
      r.start_time || "",
      r.end_time || "",
      r.duration_hours?.toString() || "",
      r.reason,
      r.category_group,
      r.is_valid ? "Yes" : "No",
      r.anomalies.join("; "),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "shift_data_export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const allReasons = categoryConfig
    ? Object.values(categoryConfig.groups).flat().sort()
    : []
  const allGroups = categoryConfig ? Object.keys(categoryConfig.groups).sort() : []

  return (
    <>
      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm">Filters</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcwIcon className="size-3" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={!records?.length}>
                <DownloadIcon className="size-3" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
              <Label className="text-xs">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full sm:w-40 justify-start text-left font-normal h-9 px-3",
                      !filters.date_from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {filters.date_from ? (
                      new Date(filters.date_from + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.date_from ? new Date(filters.date_from + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const offset = date.getTimezoneOffset()
                        const localDate = new Date(date.getTime() - offset * 60 * 1000)
                        const formatted = localDate.toISOString().split("T")[0]
                        setFilters((f) => ({ ...f, date_from: formatted }))
                      } else {
                        setFilters((f) => ({ ...f, date_from: undefined }))
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
              <Label className="text-xs">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full sm:w-40 justify-start text-left font-normal h-9 px-3",
                      !filters.date_to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {filters.date_to ? (
                      new Date(filters.date_to + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.date_to ? new Date(filters.date_to + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const offset = date.getTimezoneOffset()
                        const localDate = new Date(date.getTime() - offset * 60 * 1000)
                        const formatted = localDate.toISOString().split("T")[0]
                        setFilters((f) => ({ ...f, date_to: formatted }))
                      } else {
                        setFilters((f) => ({ ...f, date_to: undefined }))
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
              <Label htmlFor="reason-filter" className="text-xs">Reason</Label>
              <Select
                value={filters.reason || "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, reason: v === "all" ? undefined : v }))}
              >
                <SelectTrigger id="reason-filter" className="w-full sm:w-44">
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All reasons</SelectItem>
                    {allReasons.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
              <Label htmlFor="category-filter" className="text-xs">Category</Label>
              <Select
                value={filters.category || "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, category: v === "all" ? undefined : v }))}
              >
                <SelectTrigger id="category-filter" className="w-full sm:w-40">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All categories</SelectItem>
                    {allGroups.map((g) => (
                      <SelectItem key={g} value={g}>{g.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[100px] flex-1 sm:flex-none">
              <Label htmlFor="valid-filter" className="text-xs">Status</Label>
              <Select
                value={filters.is_valid || "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, is_valid: v === "all" ? undefined : v }))}
              >
                <SelectTrigger id="valid-filter" className="w-full sm:w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Valid</SelectItem>
                    <SelectItem value="false">Invalid</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Records</CardTitle>
          <CardDescription>
            {records ? `${records.length} records` : "Loading..."}
            {Object.values(filters).some(Boolean) && " (filtered)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader message="Querying dataset explorer..." />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead className="text-right">Stated (h)</TableHead>
                      <TableHead className="text-right">Actual (h)</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records && records.length > 0 ? (
                      records.map((r) => (
                        <TableRow
                          key={r.id}
                          className={!r.is_valid ? "bg-destructive/5" : r.anomalies.length > 0 ? "bg-yellow-500/5" : ""}
                        >
                          <TableCell className="text-xs whitespace-nowrap">{r.day_date || r.raw_day_date}</TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{r.start_time ? new Date(r.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{r.end_time ? new Date(r.end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                          <TableCell className="text-right tabular-nums text-xs">{r.raw_hours}</TableCell>
                          <TableCell className="text-right tabular-nums text-xs">{r.duration_hours ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {r.reason}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs capitalize whitespace-nowrap">{r.category_group.replace("_", " ")}</TableCell>
                          <TableCell>
                            {r.is_valid ? (
                              r.anomalies.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">Corrected</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Valid</Badge>
                              )
                            ) : (
                              <Badge variant="destructive" className="text-xs">Invalid</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          No records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

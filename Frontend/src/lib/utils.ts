import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { TimeRangeValue } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTimeRange(timeRange?: TimeRangeValue) {
  let days: number | undefined = undefined
  let dateFrom: string | undefined = undefined
  let dateTo: string | undefined = undefined

  if (typeof timeRange === "number") {
    days = timeRange
  } else if (timeRange && typeof timeRange === "object") {
    if (timeRange.from) {
      dateFrom = format(timeRange.from, "yyyy-MM-dd")
    }
    if (timeRange.to) {
      dateTo = format(timeRange.to, "yyyy-MM-dd")
    }
  }

  return { days, dateFrom, dateTo }
}


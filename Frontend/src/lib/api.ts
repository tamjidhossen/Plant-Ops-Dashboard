/**
 * API client for the Plant Ops Django backend.
 * All requests go through the Vite proxy (/api -> localhost:8000).
 */

import type {
  DataUpload,
  ShiftRecord,
  AnalyticsSummary,
  DailyMetric,
  ShiftChartDay,
  ReasonDistribution,
  HourlyActivity,
  BreakdownStreakResponse,
  OperationalInsight,
  QualityReport,
  CategoryConfig,
  FilterParams,
} from "./types";

const API_BASE = "/api";

const cache = new Map<string, Promise<any>>();

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const isGet = !options || !options.method || options.method.toUpperCase() === "GET";

  if (isGet) {
    if (cache.has(url)) {
      return cache.get(url)!;
    }
    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE}${url}`, {
          headers: { "Content-Type": "application/json", ...options?.headers },
          ...options,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${res.status}`);
        }

        if (res.status === 204) return {} as T;
        return res.json();
      } catch (err) {
        cache.delete(url);
        throw err;
      }
    })();
    cache.set(url, promise);
    return promise;
  }

  // Clear cache on mutations (POST, DELETE, PUT, PATCH)
  cache.clear();

  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  // Upload management
  uploadCSV: async (file: File) => {
    cache.clear();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/upload/`, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Upload failed");
    }
    return res.json();
  },

  getUploads: () => request<DataUpload[]>("/uploads/"),

  deleteUpload: (id: number) =>
    request<void>(`/uploads/${id}/`, { method: "DELETE" }),

  setActiveUpload: (id: number) =>
    request<DataUpload>(`/uploads/${id}/activate/`, { method: "POST" }),

  clearDatabase: () =>
    request<void>("/uploads/clear/", { method: "POST" }),

  // Records
  getRecords: (filters?: FilterParams) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
    }
    const qs = params.toString();
    return request<ShiftRecord[]>(`/records/${qs ? `?${qs}` : ""}`);
  },

  // Analytics
  getSummary: (days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<AnalyticsSummary>(`/analytics/summary/${qs ? `?${qs}` : ""}`);
  },
  getDailyMetrics: (days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<DailyMetric[]>(`/analytics/daily/${qs ? `?${qs}` : ""}`);
  },
  getShiftChartData: (days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<ShiftChartDay[]>(`/analytics/shift-chart/${qs ? `?${qs}` : ""}`);
  },
  getReasonDistribution: (days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<ReasonDistribution[]>(`/analytics/reason-distribution/${qs ? `?${qs}` : ""}`);
  },
  getHourlyActivity: (days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<HourlyActivity[]>(`/analytics/hourly-activity/${qs ? `?${qs}` : ""}`);
  },
  getBreakdownStreaks: (gapThreshold?: number, days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (gapThreshold) params.set("gap_threshold", gapThreshold.toString());
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<BreakdownStreakResponse>(`/analytics/breakdown-streaks/${qs ? `?${qs}` : ""}`);
  },
  getInsights: (days?: number, dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", days.toString());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    return request<OperationalInsight[]>(`/analytics/insights/${qs ? `?${qs}` : ""}`);
  },

  // Quality
  getQualityReport: () => request<QualityReport>("/quality-report/"),

  // Config
  getCategoryConfig: () => request<CategoryConfig>("/categories/"),
};

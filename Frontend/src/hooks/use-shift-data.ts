import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type {
  AnalyticsSummary,
  DataUpload,
  CategoryConfig,
} from "@/lib/types";

interface ShiftDataState {
  uploads: DataUpload[];
  activeUpload: DataUpload | null;
  summary: AnalyticsSummary | null;
  categoryConfig: CategoryConfig | null;
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
}

export function useShiftData(timeRange?: 3 | 7 | 30 | "all") {
  const [state, setState] = useState<ShiftDataState>({
    uploads: [],
    activeUpload: null,
    summary: null,
    categoryConfig: null,
    isLoading: true,
    hasData: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [uploads, categoryConfig] = await Promise.all([
        api.getUploads(),
        api.getCategoryConfig(),
      ]);

      const activeUpload = uploads.find((u) => u.is_active) || null;
      let summary: AnalyticsSummary | null = null;

      if (activeUpload) {
        const days = timeRange && timeRange !== "all" ? timeRange : undefined;
        summary = await api.getSummary(days);
      }

      setState({
        uploads,
        activeUpload,
        summary,
        categoryConfig,
        isLoading: false,
        hasData: !!activeUpload,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load data",
      }));
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

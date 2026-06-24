/**
 * TypeScript interfaces matching Django API responses.
 */

export interface DataUpload {
  id: number;
  filename: string;
  uploaded_at: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  is_active: boolean;
}

export interface ShiftRecord {
  id: number;
  raw_day_date: string;
  raw_start: string;
  raw_end: string;
  raw_hours: string;
  raw_reason: string;
  day_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number | null;
  reason: string;
  category_group: string;
  is_valid: boolean;
  is_duplicate: boolean;
  anomalies: string[];
}

export interface AnalyticsSummary {
  efficiency_score: number;
  total_hours: number;
  productive_hours: number;
  downtime_hours: number;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  breakdown_count: number;
  unique_categories: number;
  category_list: string[];
  max_date?: string;
  min_date?: string;
}

export interface DailyMetric {
  date: string;
  total_hours: number;
  productive_hours: number;
  downtime_hours: number;
  efficiency: number;
  event_count: number;
}

export interface ShiftSegment {
  start_minutes: number;
  end_minutes: number;
  start_time: string;
  end_time: string;
  duration: number;
  reason: string;
  color: string;
}

export interface ShiftChartDay {
  date: string;
  segments: ShiftSegment[];
}

export interface ReasonDistribution {
  reason: string;
  hours: number;
  count: number;
  percentage: number;
  color: string;
}

export interface HourlyActivity {
  date: string;
  hour: number;
  count: number;
  reasons: string[];
}

export interface BreakdownStreakEvent {
  start: string | null;
  end: string | null;
  duration: number;
  date: string;
}

export interface BreakdownStreak {
  start_time: string;
  end_time: string;
  total_duration_hours: number;
  event_count: number;
  span_hours: number;
  severity_score: number;
  severity_level: "critical" | "warning" | "minor";
  events: BreakdownStreakEvent[];
}

export interface StreakAlgorithm {
  description: string;
  gap_threshold_hours: number;
  severity_formula: string;
  levels: Record<string, string>;
}

export interface BreakdownStreakResponse {
  streaks: BreakdownStreak[];
  summary: {
    total_streaks: number;
    total_breakdown_hours: number;
    worst_severity: number;
    worst_severity_level: string;
    gap_threshold_hours: number;
  };
  algorithm: StreakAlgorithm;
}

export interface OperationalInsight {
  title: string;
  description: string;
  metric: string;
  category: "critical" | "warning" | "analysis";
  recommendation: string;
}

export interface DataQualityIssue {
  id: number;
  row_index: number;
  issue_type: string;
  description: string;
  original_value: string;
  resolved_value: string;
  resolution: string;
}

export interface QualityReport {
  upload: DataUpload;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  issue_summary: Record<string, number>;
  issues: DataQualityIssue[];
}

export interface CategoryConfig {
  groups: Record<string, string[]>;
  reason_colors: Record<string, string>;
  group_colors: Record<string, string>;
  downtime_reasons: string[];
}

export interface FilterParams {
  date_from?: string;
  date_to?: string;
  reason?: string;
  category?: string;
  is_valid?: string;
}

export type PageId =
  | "overview"
  | "shift-analysis"
  | "breakdown-analysis"
  | "data-explorer"
  | "data-quality"
  | "upload-csv";

export interface CustomDateRange {
  from?: Date;
  to?: Date;
}

export type TimeRangeValue = 3 | 7 | 30 | "all" | CustomDateRange;

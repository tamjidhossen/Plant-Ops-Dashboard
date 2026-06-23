# Operational Assumptions & Algorithms - Plant Operations Dashboard

This document details the engineering assumptions, data cleaning rules, category registries, and algorithmic choices implemented in the Plant Operations Dashboard.

---

## 1. Data Cleaning & Anomaly Resolution Strategy

The dataset (`shift_data.csv`) contained several intentional inconsistencies, missing values, and logical conflicts. We resolved these anomalies using a strict priority order before storing records in the database.

### Anomaly Taxonomy & Resolution Rules

| Anomaly Type | Detection Criteria | Resolution Strategy | Example in Dataset |
|---|---|---|---|
| **Invalid Date** | Month/Day values out of valid bounds (e.g., month > 12, day > 31). | Inferred the correct date using the date component of the `START` timestamp. | Row 20 (`DAY_DATE=2025-15-55` resolved to `2025-10-07`) |
| **Missing START/END Timestamp** | One or both timestamps are blank. | Flagged in the quality log. Excluded the record from timeline/gantt charts, but preserved stated `HOURS` for total production calculations. | Row 12 (missing START), Row 32 (missing END) |
| **Invalid Timestamp Format** | Unparseable datetime strings. | Same as missing. Excluded from timeline, but preserved stated `HOURS` for total metrics. | Row 42 (`START=invalid-time`) |
| **Negative Duration** | Stated `HOURS` is negative. | Recalculated correct duration from `START` and `END` timestamps. Used absolute stated hours as a secondary fallback. | Row 22 (`HOURS=-3` resolved to `2.7h`) |
| **Duration Mismatch** | Stated `HOURS` differs from `(END - START)` duration by $>0.25$ hours. | Calculated the actual duration from the timestamps. Original stated value is preserved for audit trail. | Row 5 (stated `10.5h` vs actual `2.9h`), Row 47 (stated `18h` vs actual `4h`) |
| **Exact Duplicate** | Entire row is identical to an earlier row. | Kept the first occurrence. Marked subsequent rows as duplicates and excluded them from all analytical views. | Row 27 (exact duplicate of Row 26) |
| **Overlapping Shifts** | Concurrent active time periods on the same date. | Kept both records to preserve operational history, but flagged them in the Data Quality Report for supervisor review. | Row 3 & Row 17 (overlapping time on Oct 8) |

---

## 2. Activity Classification System

To support extensibility without hardcoding, activities are mapped to category groups via a dynamic registry (`api/services/categories.py`). 

### Category Group Registry

*   **Productive**: Activity reasons contributing to plant output.
    *   *Reasons*: `Production`, `Setup`, `Training`, `Quality Check`
*   **Downtime**: Unplanned operational stoppages.
    *   *Reasons*: `Breakdown`, `Unknown Failure`
*   **Planned Stop**: Scheduled non-productive events.
    *   *Reasons*: `Maintenance`, `Cleaning`
*   **External**: Non-operational external stoppages.
    *   *Reasons*: `Power Failure`, `Material Shortage`
*   **Other**: Unclassified or minor activities.
    *   *Reasons*: `Idle`, `Other`, `Machine Jam`

> [!NOTE]
> Any new activity reason introduced to the CSV file that is not in this registry is automatically classified as `"uncategorized"` and assigned a default neutral gray color. It does not cause server crashes or parsing failures.

---

## 3. Operational Efficiency Score

Calculated at the dataset level using the following standardized operational formula:

$$\text{Operational Efficiency} = \left( \frac{\text{Productive Hours}}{\text{Total Hours}} \right) \times 100$$

Where:
*   $\text{Productive Hours}$ = Sum of durations for all records where the reason is categorized under `Production`, `Setup`, `Training`, or `Quality Check`.
*   $\text{Total Hours}$ = Sum of durations for all valid records (excluding duplicates and records flagged with a critical logical error like `END` preceding `START`).

---

## 4. Breakdown Streak Detection Algorithm

Unplanned breakdowns often occur in clusters (e.g., repeating machine failures due to a faulty repair or secondary issue). A simple consecutive row check fails to capture this because other events (like minor setups or cleanings) can occur between breakdowns.

### Algorithm Description

1.  **Chronological Sort**: Extract all `Breakdown` records and sort them by `start_time` ascending.
2.  **Rolling Gap Window**: Initialize a streak with the first breakdown event. For each subsequent breakdown:
    *   Compute the gap between the current event's `start_time` and the previous event's `end_time`.
    *   If the gap is $\le 8\text{ hours}$ (the default shift length / threshold), merge the event into the current streak and extend the streak's `end_time`.
    *   If the gap is $> 8\text{ hours}$, close the current streak and start a new one.
3.  **Severity Scoring**: Each streak is scored out of 100 based on its impact:
    $$\text{Severity} = 0.6 \times \left( \frac{\text{Total Duration (Hours)}}{10} \right) + 0.4 \times \left( \frac{\text{Event Count}}{5} \right)$$
    *The score is capped at 100.*
4.  **Classification**:
    *   $\ge 70$: **Critical** (High duration and high recurrence)
    *   $\ge 40$: **Warning** (Medium duration/recurrence)
    *   $< 40$: **Minor** (Isolated/short breakdown events)

---

## 5. Architectural Rationale

*   **Django REST Backend**:
    *   Ensures clean division of concerns.
    *   SQLite database stores uploaded CSV datasets so that parsed state persists across page reloads.
    *   All calculations (cleaning, streaks, insights) are performed server-side in Python, keeping the client code lean and highly performant.
*   **Vite & React Frontend**:
    *   Provides a highly responsive, modern interface.
    *   Leverages shadcn/ui components for a premium look.
    *   Fully typed with TypeScript matching backend serializers to guarantee runtime type safety.

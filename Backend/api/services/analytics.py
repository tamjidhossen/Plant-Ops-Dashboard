"""
Analytics engine for shift data.

Computes operational efficiency, breakdown streaks, daily metrics,
and generates dynamic actionable insights.
"""

from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum, Count, Q, F

from .categories import is_productive, DOWNTIME_REASONS, get_color_for_reason, get_all_category_info


def _filter_records(records, days=None):
    """Filter records by the last N days relative to the max date in the active dataset."""
    if days is not None:
        from django.db.models import Max
        max_res = records.aggregate(max_d=Max("day_date"))
        max_date = max_res["max_d"]
        if max_date:
            start_date = max_date - timedelta(days=days - 1)
            records = records.filter(day_date__gte=start_date, day_date__lte=max_date)
    return records


def _get_max_date(upload):
    """Get the maximum date of any record in the active dataset."""
    from api.models import ShiftRecord
    from django.db.models import Max
    return ShiftRecord.objects.filter(upload=upload, is_duplicate=False).aggregate(max_d=Max("day_date"))["max_d"]



def compute_summary(upload, days=None):
    """Compute KPI summary metrics for an upload."""
    from api.models import ShiftRecord

    records = ShiftRecord.objects.filter(upload=upload, is_duplicate=False)
    records = _filter_records(records, days=days)
    valid = records.exclude(duration_hours__isnull=True)

    total_hours = valid.aggregate(total=Sum("duration_hours"))["total"] or 0

    productive_qs = valid.exclude(reason__in=DOWNTIME_REASONS)
    productive_hours = productive_qs.aggregate(total=Sum("duration_hours"))["total"] or 0

    efficiency = round((productive_hours / total_hours * 100), 1) if total_hours > 0 else 0

    breakdown_qs = valid.filter(reason__in=DOWNTIME_REASONS)
    breakdown_hours = breakdown_qs.aggregate(total=Sum("duration_hours"))["total"] or 0

    unique_reasons = list(records.values_list("reason", flat=True).distinct().order_by("reason"))

    return {
        "efficiency_score": efficiency,
        "total_hours": round(total_hours, 1),
        "productive_hours": round(productive_hours, 1),
        "downtime_hours": round(breakdown_hours, 1),
        "total_records": records.count(),
        "valid_records": records.filter(is_valid=True).count(),
        "invalid_records": records.filter(is_valid=False).count(),
        "duplicate_records": ShiftRecord.objects.filter(upload=upload, is_duplicate=True).count(),
        "breakdown_count": breakdown_qs.count(),
        "unique_categories": len(unique_reasons),
        "category_list": unique_reasons,
    }


def compute_daily_metrics(upload, days=None):
    """Compute per-day aggregated metrics."""
    from api.models import ShiftRecord

    records = ShiftRecord.objects.filter(
        upload=upload, is_duplicate=False, day_date__isnull=False, duration_hours__isnull=False
    )
    records = _filter_records(records, days=days)

    daily = defaultdict(lambda: {"total": 0.0, "productive": 0.0, "downtime": 0.0, "events": 0})

    for rec in records:
        key = str(rec.day_date)
        daily[key]["total"] += rec.duration_hours
        daily[key]["events"] += 1
        if is_productive(rec.reason):
            daily[key]["productive"] += rec.duration_hours
        else:
            daily[key]["downtime"] += rec.duration_hours

    result = []
    for date_str in sorted(daily.keys()):
        d = daily[date_str]
        eff = round((d["productive"] / d["total"] * 100), 1) if d["total"] > 0 else 0
        result.append({
            "date": date_str,
            "total_hours": round(d["total"], 1),
            "productive_hours": round(d["productive"], 1),
            "downtime_hours": round(d["downtime"], 1),
            "efficiency": eff,
            "event_count": d["events"],
        })

    return result


def compute_shift_chart_data(upload, days=None):
    """
    Prepare data for the shift analysis chart.
    Returns segments grouped by date with time-of-day positioning.
    """
    from api.models import ShiftRecord

    records = ShiftRecord.objects.filter(
        upload=upload,
        is_duplicate=False,
        day_date__isnull=False,
        start_time__isnull=False,
        end_time__isnull=False,
    )
    records = _filter_records(records, days=days)
    records = records.order_by("day_date", "start_time")

    by_date = defaultdict(list)
    for rec in records:
        start_minutes = rec.start_time.hour * 60 + rec.start_time.minute
        duration_minutes = int((rec.end_time - rec.start_time).total_seconds() / 60)
        end_minutes = start_minutes + duration_minutes

        by_date[str(rec.day_date)].append({
            "start_minutes": start_minutes,
            "end_minutes": end_minutes,
            "start_time": rec.start_time.strftime("%H:%M"),
            "end_time": rec.end_time.strftime("%H:%M"),
            "duration": rec.duration_hours,
            "reason": rec.reason,
            "color": get_color_for_reason(rec.reason),
        })

    result = []
    for date_str in sorted(by_date.keys()):
        result.append({
            "date": date_str,
            "segments": by_date[date_str],
        })

    return result


def compute_reason_distribution(upload, days=None):
    """Compute hours distribution by reason."""
    from api.models import ShiftRecord

    records = ShiftRecord.objects.filter(
        upload=upload, is_duplicate=False, duration_hours__isnull=False
    )
    records = _filter_records(records, days=days)

    dist = records.values("reason").annotate(
        total_hours=Sum("duration_hours"),
        count=Count("id"),
    ).order_by("-total_hours")

    total = sum(d["total_hours"] for d in dist)

    return [
        {
            "reason": d["reason"],
            "hours": round(d["total_hours"], 1),
            "count": d["count"],
            "percentage": round(d["total_hours"] / total * 100, 1) if total > 0 else 0,
            "color": get_color_for_reason(d["reason"]),
        }
        for d in dist
    ]


def compute_hourly_activity(upload, days=None):
    """Compute hourly activity grid for heatmap visualization."""
    from api.models import ShiftRecord

    records = ShiftRecord.objects.filter(
        upload=upload,
        is_duplicate=False,
        start_time__isnull=False,
        day_date__isnull=False,
    )
    records = _filter_records(records, days=days)

    grid = defaultdict(lambda: defaultdict(int))
    reasons_at = defaultdict(lambda: defaultdict(list))

    for rec in records:
        date_str = str(rec.day_date)
        hour = rec.start_time.hour
        grid[date_str][hour] += 1
        reasons_at[date_str][hour].append(rec.reason)

    dates = sorted(grid.keys())
    result = []
    for date_str in dates:
        for hour in range(24):
            count = grid[date_str].get(hour, 0)
            if count > 0:
                result.append({
                    "date": date_str,
                    "hour": hour,
                    "count": count,
                    "reasons": reasons_at[date_str].get(hour, []),
                })

    return result


def compute_breakdown_streaks(upload, gap_threshold_hours=8, days=None):
    """
    Identify breakdown streaks -- clusters of temporally proximate breakdown events.

    Algorithm:
    1. Sort all Breakdown events chronologically by start_time
    2. Initialize a streak with the first event
    3. For each subsequent event:
       - If the gap between this event's start and previous event's end
         is <= gap_threshold_hours, extend the current streak
       - Otherwise, close the current streak and start a new one
    4. Score each streak based on total duration and event count
    """
    from api.models import ShiftRecord

    breakdowns_qs = ShiftRecord.objects.filter(
        upload=upload,
        reason="Breakdown",
        is_duplicate=False,
        start_time__isnull=False,
    )
    if days is not None:
        max_date = _get_max_date(upload)
        if max_date:
            start_date = max_date - timedelta(days=days - 1)
            breakdowns_qs = breakdowns_qs.filter(day_date__gte=start_date, day_date__lte=max_date)
    breakdowns = list(breakdowns_qs.order_by("start_time"))

    if len(breakdowns) == 0:
        return {
            "streaks": [],
            "summary": {
                "total_streaks": 0,
                "total_breakdown_hours": 0.0,
                "worst_severity": 0,
                "worst_severity_level": "none",
                "gap_threshold_hours": gap_threshold_hours,
            },
            "algorithm": {
                "description": (
                    "A breakdown streak is a cluster of Breakdown events where "
                    "each subsequent event starts within the gap threshold of the "
                    "previous event's end time."
                ),
                "gap_threshold_hours": gap_threshold_hours,
                "severity_formula": "severity = 0.6 * (total_hours / 10) + 0.4 * (event_count / 5), capped at 100",
            },
        }

    threshold = timedelta(hours=gap_threshold_hours)
    streaks_raw = []
    current = {
        "events": [breakdowns[0]],
        "start": breakdowns[0].start_time,
        "end": breakdowns[0].end_time or breakdowns[0].start_time,
    }

    for bd in breakdowns[1:]:
        gap = bd.start_time - current["end"]
        if gap <= threshold:
            current["events"].append(bd)
            if bd.end_time and bd.end_time > current["end"]:
                current["end"] = bd.end_time
        else:
            streaks_raw.append(current)
            current = {
                "events": [bd],
                "start": bd.start_time,
                "end": bd.end_time or bd.start_time,
            }

    streaks_raw.append(current)

    # Score and format each streak
    streaks = []
    for s in streaks_raw:
        total_duration = sum(e.duration_hours for e in s["events"] if e.duration_hours)
        event_count = len(s["events"])
        span_hours = (s["end"] - s["start"]).total_seconds() / 3600

        # Severity scoring (weighted combination)
        duration_score = min(total_duration / 10.0, 1.0)
        frequency_score = min(event_count / 5.0, 1.0)
        severity = round((0.6 * duration_score + 0.4 * frequency_score) * 100)

        if severity >= 70:
            level = "critical"
        elif severity >= 40:
            level = "warning"
        else:
            level = "minor"

        streaks.append({
            "start_time": s["start"].isoformat(),
            "end_time": s["end"].isoformat(),
            "total_duration_hours": round(total_duration, 1),
            "event_count": event_count,
            "span_hours": round(span_hours, 1),
            "severity_score": severity,
            "severity_level": level,
            "events": [
                {
                    "start": e.start_time.isoformat() if e.start_time else None,
                    "end": e.end_time.isoformat() if e.end_time else None,
                    "duration": e.duration_hours,
                    "date": str(e.day_date),
                }
                for e in s["events"]
            ],
        })

    total_duration = sum(s["total_duration_hours"] for s in streaks)
    worst = max(streaks, key=lambda s: s["severity_score"]) if streaks else None

    return {
        "streaks": streaks,
        "summary": {
            "total_streaks": len(streaks),
            "total_breakdown_hours": round(total_duration, 1),
            "worst_severity": worst["severity_score"] if worst else 0,
            "worst_severity_level": worst["severity_level"] if worst else "none",
            "gap_threshold_hours": gap_threshold_hours,
        },
        "algorithm": {
            "description": (
                "A breakdown streak is a cluster of Breakdown events where "
                "each subsequent event starts within the gap threshold of the "
                "previous event's end time."
            ),
            "gap_threshold_hours": gap_threshold_hours,
            "severity_formula": "severity = 0.6 * (total_hours / 10) + 0.4 * (event_count / 5), capped at 100",
            "levels": {
                "critical": "severity >= 70",
                "warning": "severity >= 40",
                "minor": "severity < 40",
            },
        },
    }


def generate_insights(upload, days=None):
    """Generate dynamic operational insights from the data."""
    from api.models import ShiftRecord

    records = ShiftRecord.objects.filter(upload=upload, is_duplicate=False)
    records = _filter_records(records, days=days)
    valid = records.filter(duration_hours__isnull=False)
    insights = []

    total_hours = valid.aggregate(total=Sum("duration_hours"))["total"] or 0
    if total_hours == 0:
        return insights

    # -- Insight 1: Top downtime contributor --
    downtime_by_reason = (
        valid.filter(reason__in=DOWNTIME_REASONS)
        .values("reason")
        .annotate(total=Sum("duration_hours"), count=Count("id"))
        .order_by("-total")
    )
    if downtime_by_reason:
        top = downtime_by_reason[0]
        pct = round(top["total"] / total_hours * 100, 1)
        insights.append({
            "title": "Primary Downtime Source",
            "description": (
                f"{top['reason']} accounts for {pct}% of total shift time "
                f"({round(top['total'], 1)}h across {top['count']} events). "
                f"This is the largest contributor to unplanned downtime."
            ),
            "metric": f"{pct}%",
            "category": "critical",
            "recommendation": (
                f"Prioritize root cause analysis on {top['reason']} events. "
                f"Consider implementing predictive maintenance to reduce occurrence."
            ),
        })

    # -- Insight 2: Peak failure window --
    failure_records = valid.filter(
        reason__in=list(DOWNTIME_REASONS) + ["Power Failure"],
        start_time__isnull=False,
    )
    if failure_records.exists():
        hour_counts = defaultdict(int)
        for r in failure_records:
            hour_counts[r.start_time.hour] += 1

        if hour_counts:
            peak_hour = max(hour_counts, key=hour_counts.get)
            peak_count = hour_counts[peak_hour]
            total_failures = sum(hour_counts.values())
            pct = round(peak_count / total_failures * 100, 1)

            insights.append({
                "title": "Peak Failure Time Window",
                "description": (
                    f"{pct}% of failure events ({peak_count} of {total_failures}) "
                    f"start between {peak_hour:02d}:00 and {peak_hour + 1:02d}:00. "
                    f"This concentration suggests a systemic pattern."
                ),
                "metric": f"{peak_hour:02d}:00-{peak_hour + 1:02d}:00",
                "category": "warning",
                "recommendation": (
                    f"Schedule additional monitoring or staffing during the "
                    f"{peak_hour:02d}:00-{peak_hour + 1:02d}:00 window. "
                    f"Investigate if shift transitions contribute to failures."
                ),
            })

    # -- Insight 3: Worst performing day --
    daily = (
        valid.filter(day_date__isnull=False)
        .values("day_date")
        .annotate(
            total=Sum("duration_hours"),
            downtime=Sum("duration_hours", filter=Q(reason__in=DOWNTIME_REASONS)),
        )
    )
    worst_day = None
    worst_eff = 100
    for d in daily:
        dt = d["downtime"] or 0
        eff = round(((d["total"] - dt) / d["total"]) * 100, 1) if d["total"] > 0 else 100
        if eff < worst_eff:
            worst_eff = eff
            worst_day = d

    if worst_day and worst_eff < 100:
        insights.append({
            "title": "Lowest Efficiency Day",
            "description": (
                f"{worst_day['day_date']} recorded the lowest operational efficiency "
                f"at {worst_eff}%, with {round(worst_day['downtime'] or 0, 1)}h of downtime "
                f"out of {round(worst_day['total'], 1)}h total."
            ),
            "metric": f"{worst_eff}%",
            "category": "critical",
            "recommendation": (
                f"Review operational logs for {worst_day['day_date']} to identify "
                f"root causes. Check if external factors (power, material) contributed."
            ),
        })

    # -- Insight 4: Power reliability --
    power_qs = valid.filter(reason="Power Failure")
    if power_qs.exists():
        power_hours = power_qs.aggregate(total=Sum("duration_hours"))["total"] or 0
        power_count = power_qs.count()
        power_pct = round(power_hours / total_hours * 100, 1)
        insights.append({
            "title": "Power Reliability Concern",
            "description": (
                f"Power failures account for {power_pct}% of total time "
                f"({round(power_hours, 1)}h across {power_count} events). "
                f"This external factor is impacting operational uptime."
            ),
            "metric": f"{round(power_hours, 1)}h",
            "category": "warning",
            "recommendation": (
                "Evaluate backup power solutions (UPS/generator) to mitigate "
                "power failure impact. Track power grid reliability patterns."
            ),
        })

    # -- Insight 5: Maintenance vs Breakdown correlation --
    maint_hours = valid.filter(reason="Maintenance").aggregate(total=Sum("duration_hours"))["total"] or 0
    bd_hours = valid.filter(reason="Breakdown").aggregate(total=Sum("duration_hours"))["total"] or 0
    if maint_hours > 0 and bd_hours > 0:
        ratio = round(bd_hours / maint_hours, 1)
        insights.append({
            "title": "Maintenance Effectiveness",
            "description": (
                f"Breakdown hours ({round(bd_hours, 1)}h) are {ratio}x the maintenance hours "
                f"({round(maint_hours, 1)}h). A high ratio may indicate "
                f"insufficient preventive maintenance."
            ),
            "metric": f"{ratio}x",
            "category": "analysis",
            "recommendation": (
                "Consider increasing scheduled maintenance frequency. "
                "A lower breakdown-to-maintenance ratio indicates better prevention."
            ),
        })

    # -- Insight 6: Category diversity --
    reason_counts = valid.values("reason").annotate(count=Count("id")).order_by("-count")
    if len(reason_counts) > 3:
        top3 = reason_counts[:3]
        top3_pct = round(
            sum(r["count"] for r in top3) / valid.count() * 100, 1
        ) if valid.count() > 0 else 0
        top3_names = ", ".join(r["reason"] for r in top3)
        insights.append({
            "title": "Activity Concentration",
            "description": (
                f"The top 3 activities ({top3_names}) account for "
                f"{top3_pct}% of all shift events. "
                f"High concentration in few categories may indicate process imbalance."
            ),
            "metric": f"{top3_pct}%",
            "category": "analysis",
            "recommendation": (
                "Review if the activity distribution aligns with operational goals. "
                "Diversified activity patterns often indicate healthier operations."
            ),
        })

    return insights

"""
Data cleaner for shift records.

Validates, detects anomalies, resolves issues, and produces a clean dataset
with a comprehensive quality report.
"""

import hashlib
from datetime import datetime

from .categories import classify_reason


def parse_date(date_str: str):
    """Try to parse a date string in multiple formats. Returns date or None."""
    if not date_str:
        return None

    formats = [
        "%m/%d/%Y",       # 10/21/2025
        "%Y-%m-%d",       # 2025-10-21
        "%d/%m/%Y",       # 21/10/2025
        "%Y/%m/%d",       # 2025/10/21
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    return None


def parse_datetime_str(dt_str: str):
    """Parse an ISO-ish datetime string. Returns datetime or None."""
    if not dt_str:
        return None

    formats = [
        "%Y-%m-%dT%H:%M:%SZ",   # 2025-10-21T07:00:00Z
        "%Y-%m-%dT%H:%M:%S",    # 2025-10-21T07:00:00
        "%Y-%m-%d %H:%M:%S",    # 2025-10-21 07:00:00
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(dt_str, fmt)
            try:
                from django.utils import timezone
                return timezone.make_aware(dt)
            except Exception:
                return dt
        except ValueError:
            continue

    return None


def parse_float_safe(val: str):
    """Parse a float string safely. Returns float or None."""
    if not val:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def hash_row(row: dict) -> str:
    """Create a hash of a raw row for duplicate detection."""
    key = f"{row['day_date']}|{row['start']}|{row['end']}|{row['hours']}|{row['reason']}"
    return hashlib.md5(key.encode()).hexdigest()


def clean_records(raw_rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Validate and clean raw CSV rows.

    Returns:
        (records, issues) - cleaned record dicts and quality issue dicts
    """
    records = []
    issues = []
    seen_hashes = {}

    for row in raw_rows:
        row_idx = row["row_index"]
        anomalies = []
        record_issues = []

        record = {
            "raw_day_date": row["day_date"],
            "raw_start": row["start"],
            "raw_end": row["end"],
            "raw_hours": row["hours"],
            "raw_reason": row["reason"],
            "reason": row["reason"] if row["reason"] else "Unknown",
            "is_valid": True,
            "is_duplicate": False,
            "anomalies": [],
        }

        # -- 1. Parse DAY_DATE --
        day_date = parse_date(row["day_date"])
        if day_date is None and row["day_date"]:
            start_dt = parse_datetime_str(row["start"])
            if start_dt:
                day_date = start_dt.date()
                anomalies.append(
                    f"Invalid DAY_DATE '{row['day_date']}', inferred {day_date} from START"
                )
                record_issues.append({
                    "row_index": row_idx,
                    "issue_type": "invalid_date",
                    "description": f"DAY_DATE '{row['day_date']}' is not a valid date",
                    "original_value": row["day_date"],
                    "resolved_value": str(day_date),
                    "resolution": "Inferred from START timestamp",
                })
            else:
                anomalies.append(
                    f"Invalid DAY_DATE '{row['day_date']}' and cannot infer from timestamps"
                )
                record["is_valid"] = False
                record_issues.append({
                    "row_index": row_idx,
                    "issue_type": "invalid_date",
                    "description": f"DAY_DATE '{row['day_date']}' is not a valid date",
                    "original_value": row["day_date"],
                    "resolved_value": "",
                    "resolution": "Record marked invalid",
                })

        record["day_date"] = day_date

        # -- 2. Parse START and END timestamps --
        start_time = parse_datetime_str(row["start"])
        end_time = parse_datetime_str(row["end"])

        if not row["start"]:
            anomalies.append("Missing START timestamp")
            record_issues.append({
                "row_index": row_idx,
                "issue_type": "missing_timestamp",
                "description": "START timestamp is empty",
                "original_value": "",
                "resolved_value": "",
                "resolution": "Excluded from timeline visualizations",
            })
        elif start_time is None:
            anomalies.append(f"Invalid START timestamp '{row['start']}'")
            record_issues.append({
                "row_index": row_idx,
                "issue_type": "invalid_timestamp",
                "description": f"START timestamp '{row['start']}' cannot be parsed",
                "original_value": row["start"],
                "resolved_value": "",
                "resolution": "Excluded from timeline visualizations",
            })

        if not row["end"]:
            anomalies.append("Missing END timestamp")
            record_issues.append({
                "row_index": row_idx,
                "issue_type": "missing_timestamp",
                "description": "END timestamp is empty",
                "original_value": "",
                "resolved_value": "",
                "resolution": "Excluded from timeline visualizations",
            })
        elif end_time is None:
            anomalies.append(f"Invalid END timestamp '{row['end']}'")
            record_issues.append({
                "row_index": row_idx,
                "issue_type": "invalid_timestamp",
                "description": f"END timestamp '{row['end']}' cannot be parsed",
                "original_value": row["end"],
                "resolved_value": "",
                "resolution": "Excluded from timeline visualizations",
            })

        record["start_time"] = start_time
        record["end_time"] = end_time

        # -- 3. Parse stated hours --
        stated_hours = parse_float_safe(row["hours"])

        if stated_hours is not None and stated_hours < 0:
            anomalies.append(f"Negative duration: {stated_hours}h")
            record_issues.append({
                "row_index": row_idx,
                "issue_type": "negative_duration",
                "description": f"Stated duration is negative ({stated_hours}h)",
                "original_value": str(stated_hours),
                "resolved_value": "",
                "resolution": "Will recalculate from timestamps if available",
            })

        # -- 4. Calculate duration from timestamps and detect mismatches --
        calculated_hours = None
        if start_time and end_time:
            diff_seconds = (end_time - start_time).total_seconds()
            calculated_hours = round(diff_seconds / 3600, 2)

            if calculated_hours < 0:
                anomalies.append(
                    f"END is before START (calculated {calculated_hours}h)"
                )
                record_issues.append({
                    "row_index": row_idx,
                    "issue_type": "end_before_start",
                    "description": "END timestamp is before START timestamp",
                    "original_value": f"{row['start']} -> {row['end']}",
                    "resolved_value": "",
                    "resolution": "Record marked invalid",
                })
                record["is_valid"] = False
                calculated_hours = None

            elif stated_hours is not None and abs(calculated_hours - abs(stated_hours)) > 0.25:
                anomalies.append(
                    f"Duration mismatch: stated {stated_hours}h vs calculated {calculated_hours}h"
                )
                record_issues.append({
                    "row_index": row_idx,
                    "issue_type": "duration_mismatch",
                    "description": (
                        f"Stated duration ({stated_hours}h) differs from "
                        f"calculated duration ({calculated_hours}h)"
                    ),
                    "original_value": str(stated_hours),
                    "resolved_value": str(calculated_hours),
                    "resolution": "Using recalculated value from timestamps",
                })

        # Determine final duration: prefer calculated, then positive stated
        if calculated_hours is not None and calculated_hours >= 0:
            record["duration_hours"] = calculated_hours
        elif stated_hours is not None and stated_hours > 0:
            record["duration_hours"] = stated_hours
        elif stated_hours is not None and stated_hours < 0 and calculated_hours is not None:
            record["duration_hours"] = calculated_hours
        else:
            record["duration_hours"] = abs(stated_hours) if stated_hours is not None else None

        # -- 5. Classify category --
        record["category_group"] = classify_reason(record["reason"])

        # -- 6. Check for duplicates --
        row_hash = hash_row(row)
        if row_hash in seen_hashes:
            record["is_duplicate"] = True
            anomalies.append(
                f"Duplicate of row {seen_hashes[row_hash]}"
            )
            record_issues.append({
                "row_index": row_idx,
                "issue_type": "duplicate",
                "description": f"Exact duplicate of row {seen_hashes[row_hash]}",
                "original_value": "",
                "resolved_value": "",
                "resolution": "Marked as duplicate, excluded from analysis",
            })
        else:
            seen_hashes[row_hash] = row_idx

        record["anomalies"] = anomalies
        records.append(record)
        issues.extend(record_issues)

    # -- 7. Detect overlapping shifts --
    overlap_issues = detect_overlaps(records, raw_rows)
    issues.extend(overlap_issues)

    return records, issues


def detect_overlaps(records: list[dict], raw_rows: list[dict]) -> list[dict]:
    """Detect overlapping shifts on the same date."""
    overlap_issues = []

    # Group records by date
    by_date = {}
    for i, rec in enumerate(records):
        if rec["day_date"] and rec["start_time"] and rec["end_time"] and not rec["is_duplicate"]:
            key = str(rec["day_date"])
            if key not in by_date:
                by_date[key] = []
            by_date[key].append((i, rec))

    for date_key, date_records in by_date.items():
        for i in range(len(date_records)):
            for j in range(i + 1, len(date_records)):
                idx_a, rec_a = date_records[i]
                idx_b, rec_b = date_records[j]

                # Check overlap: A starts before B ends AND B starts before A ends
                if rec_a["start_time"] < rec_b["end_time"] and rec_b["start_time"] < rec_a["end_time"]:
                    row_a = raw_rows[idx_a]["row_index"]
                    row_b = raw_rows[idx_b]["row_index"]
                    overlap_issues.append({
                        "row_index": row_b,
                        "issue_type": "overlapping_shift",
                        "description": (
                            f"Overlapping time range with row {row_a} on {date_key}"
                        ),
                        "original_value": (
                            f"Row {row_a}: {rec_a['raw_start']}-{rec_a['raw_end']} | "
                            f"Row {row_b}: {rec_b['raw_start']}-{rec_b['raw_end']}"
                        ),
                        "resolved_value": "",
                        "resolution": "Both records kept, flagged for review",
                    })

    return overlap_issues

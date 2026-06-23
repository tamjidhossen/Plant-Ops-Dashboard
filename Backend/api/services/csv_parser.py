"""
CSV parser for shift data files.

Handles various CSV formats, Windows line endings, and validates
that required columns exist before processing.
"""

import csv
import io


REQUIRED_COLUMNS = {"DAY_DATE", "START", "END", "HOURS", "REASON"}


def parse_csv(file_content: str) -> tuple[list[dict], list[str]]:
    """
    Parse CSV content and return a list of raw row dictionaries.

    Returns:
        (rows, errors) - list of parsed rows and any parsing errors
    """
    errors = []

    # Handle BOM and normalize line endings
    content = file_content.replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n")

    reader = csv.DictReader(io.StringIO(content))

    if reader.fieldnames is None:
        return [], ["CSV file appears to be empty or has no headers"]

    # Strip whitespace from field names
    reader.fieldnames = [f.strip() for f in reader.fieldnames]

    # Validate required columns
    missing = REQUIRED_COLUMNS - set(reader.fieldnames)
    if missing:
        return [], [f"Missing required columns: {', '.join(sorted(missing))}"]

    rows = []
    for i, row in enumerate(reader):
        try:
            rows.append({
                "row_index": i + 1,
                "day_date": (row.get("DAY_DATE") or "").strip(),
                "start": (row.get("START") or "").strip(),
                "end": (row.get("END") or "").strip(),
                "hours": (row.get("HOURS") or "").strip(),
                "reason": (row.get("REASON") or "").strip(),
            })
        except Exception as e:
            errors.append(f"Row {i + 2}: Failed to parse - {str(e)}")

    return rows, errors

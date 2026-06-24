from collections import Counter

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DataUpload, ShiftRecord, DataQualityIssue
from .serializers import (
    DataUploadSerializer,
    ShiftRecordSerializer,
    DataQualityIssueSerializer,
)
from .services.csv_parser import parse_csv
from .services.data_cleaner import clean_records
from .services.analytics import (
    compute_summary,
    compute_daily_metrics,
    compute_shift_chart_data,
    compute_reason_distribution,
    compute_hourly_activity,
    compute_breakdown_streaks,
    generate_insights,
)
from .services.categories import get_all_category_info


def _get_active_upload():
    """Get the currently active upload, or None."""
    return DataUpload.objects.filter(is_active=True).first()


# -- Upload endpoints --

@api_view(["POST"])
def upload_csv(request):
    """Upload and process a CSV file."""
    file = request.FILES.get("file")
    if not file:
        return Response(
            {"error": "No file provided. Send a CSV file with key 'file'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not file.name.endswith(".csv"):
        return Response(
            {"error": "File must be a CSV file."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        content = file.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        return Response(
            {"error": "File encoding not supported. Use UTF-8."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Parse CSV
    raw_rows, parse_errors = parse_csv(content)
    if parse_errors:
        return Response(
            {"error": "CSV parsing failed", "details": parse_errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not raw_rows:
        return Response(
            {"error": "CSV file contains no data rows."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Clean and validate records
    cleaned_records, quality_issues = clean_records(raw_rows)

    with transaction.atomic():
        # Deactivate previous uploads
        DataUpload.objects.filter(is_active=True).update(is_active=False)

        # Create new upload
        valid_count = sum(1 for r in cleaned_records if r["is_valid"] and not r["is_duplicate"])
        invalid_count = sum(1 for r in cleaned_records if not r["is_valid"])

        upload = DataUpload.objects.create(
            filename=file.name,
            total_records=len(cleaned_records),
            valid_records=valid_count,
            invalid_records=invalid_count,
            is_active=True,
        )

        # Bulk create shift records
        record_objects = []
        for rec in cleaned_records:
            record_objects.append(ShiftRecord(
                upload=upload,
                raw_day_date=rec["raw_day_date"],
                raw_start=rec["raw_start"],
                raw_end=rec["raw_end"],
                raw_hours=rec["raw_hours"],
                raw_reason=rec["raw_reason"],
                day_date=rec["day_date"],
                start_time=rec["start_time"],
                end_time=rec["end_time"],
                duration_hours=rec["duration_hours"],
                reason=rec["reason"],
                category_group=rec["category_group"],
                is_valid=rec["is_valid"],
                is_duplicate=rec["is_duplicate"],
                anomalies=rec["anomalies"],
            ))

        created_records = ShiftRecord.objects.bulk_create(record_objects)

        # Create quality issue records
        # Build a lookup from row_index to created record
        record_by_index = {}
        for i, rec_data in enumerate(cleaned_records):
            record_by_index[raw_rows[i]["row_index"]] = created_records[i]

        issue_objects = []
        for issue in quality_issues:
            issue_objects.append(DataQualityIssue(
                upload=upload,
                record=record_by_index.get(issue["row_index"]),
                row_index=issue["row_index"],
                issue_type=issue["issue_type"],
                description=issue["description"],
                original_value=issue.get("original_value", ""),
                resolved_value=issue.get("resolved_value", ""),
                resolution=issue.get("resolution", ""),
            ))

        DataQualityIssue.objects.bulk_create(issue_objects)

    return Response(
        {
            "message": f"Successfully processed {len(cleaned_records)} records",
            "upload": DataUploadSerializer(upload).data,
            "quality_summary": {
                "total": len(cleaned_records),
                "valid": valid_count,
                "invalid": invalid_count,
                "duplicates": sum(1 for r in cleaned_records if r["is_duplicate"]),
                "issues_found": len(quality_issues),
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def list_uploads(request):
    """List all uploads."""
    uploads = DataUpload.objects.all()
    return Response(DataUploadSerializer(uploads, many=True).data)


@api_view(["DELETE"])
def delete_upload(request, upload_id):
    """Delete an upload and all its data."""
    try:
        upload = DataUpload.objects.get(id=upload_id)
    except DataUpload.DoesNotExist:
        return Response({"error": "Upload not found"}, status=status.HTTP_404_NOT_FOUND)

    upload.delete()
    return Response({"message": "Upload deleted"}, status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def clear_db(request):
    """Clear all uploads and their data."""
    DataUpload.objects.all().delete()
    return Response({"message": "Database cleared successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
def set_active_upload(request, upload_id):
    """Set a specific upload as the active one."""
    try:
        upload = DataUpload.objects.get(id=upload_id)
    except DataUpload.DoesNotExist:
        return Response({"error": "Upload not found"}, status=status.HTTP_404_NOT_FOUND)

    DataUpload.objects.filter(is_active=True).update(is_active=False)
    upload.is_active = True
    upload.save()
    return Response(DataUploadSerializer(upload).data)


# -- Records endpoint --

@api_view(["GET"])
def list_records(request):
    """Get shift records with optional filtering."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset. Upload a CSV first."}, status=status.HTTP_404_NOT_FOUND)

    records = ShiftRecord.objects.filter(upload=upload, is_duplicate=False)

    # Apply filters
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")
    reason = request.query_params.get("reason")
    category = request.query_params.get("category")
    is_valid = request.query_params.get("is_valid")

    if date_from:
        records = records.filter(day_date__gte=date_from)
    if date_to:
        records = records.filter(day_date__lte=date_to)
    if reason:
        reasons = reason.split(",")
        records = records.filter(reason__in=reasons)
    if category:
        categories = category.split(",")
        records = records.filter(category_group__in=categories)
    if is_valid is not None:
        if is_valid.lower() == "true":
            records = records.filter(is_valid=True)
        elif is_valid.lower() == "false":
            records = records.filter(is_valid=False)

    return Response(ShiftRecordSerializer(records, many=True).data)


# -- Analytics endpoints --

def _get_date_params(request):
    """Helper to parse 'days', 'date_from', and 'date_to' query parameters."""
    days = request.query_params.get("days")
    if days and days.isdigit():
        days = int(days)
    else:
        days = None
    date_from = request.query_params.get("date_from")
    date_to = request.query_params.get("date_to")
    return days, date_from, date_to


@api_view(["GET"])
def analytics_summary(request):
    """Get KPI summary metrics."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)
    days, date_from, date_to = _get_date_params(request)
    return Response(compute_summary(upload, days=days, date_from=date_from, date_to=date_to))


@api_view(["GET"])
def analytics_daily(request):
    """Get daily aggregated metrics."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)
    days, date_from, date_to = _get_date_params(request)
    return Response(compute_daily_metrics(upload, days=days, date_from=date_from, date_to=date_to))


@api_view(["GET"])
def analytics_shift_chart(request):
    """Get pre-processed data for the shift analysis chart."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)
    days, date_from, date_to = _get_date_params(request)
    return Response(compute_shift_chart_data(upload, days=days, date_from=date_from, date_to=date_to))


@api_view(["GET"])
def analytics_reason_distribution(request):
    """Get hours distribution by reason."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)
    days, date_from, date_to = _get_date_params(request)
    return Response(compute_reason_distribution(upload, days=days, date_from=date_from, date_to=date_to))


@api_view(["GET"])
def analytics_hourly_activity(request):
    """Get hourly activity grid data."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)
    days, date_from, date_to = _get_date_params(request)
    return Response(compute_hourly_activity(upload, days=days, date_from=date_from, date_to=date_to))


@api_view(["GET"])
def analytics_breakdown_streaks(request):
    """Get breakdown streak analysis."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)

    gap = request.query_params.get("gap_threshold", 8)
    try:
        gap = float(gap)
    except (ValueError, TypeError):
        gap = 8

    days, date_from, date_to = _get_date_params(request)
    return Response(compute_breakdown_streaks(upload, gap_threshold_hours=gap, days=days, date_from=date_from, date_to=date_to))


@api_view(["GET"])
def analytics_insights(request):
    """Get dynamically generated operational insights."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)
    days, date_from, date_to = _get_date_params(request)
    return Response(generate_insights(upload, days=days, date_from=date_from, date_to=date_to))


# -- Quality report --

@api_view(["GET"])
def quality_report(request):
    """Get the data quality report for the active upload."""
    upload = _get_active_upload()
    if not upload:
        return Response({"error": "No active dataset"}, status=status.HTTP_404_NOT_FOUND)

    issues = DataQualityIssue.objects.filter(upload=upload)
    issue_types = Counter(i.issue_type for i in issues)

    records = ShiftRecord.objects.filter(upload=upload)
    duplicate_count = records.filter(is_duplicate=True).count()

    return Response({
        "upload": DataUploadSerializer(upload).data,
        "total_records": upload.total_records,
        "valid_records": upload.valid_records,
        "invalid_records": upload.invalid_records,
        "duplicate_records": duplicate_count,
        "issue_summary": dict(issue_types),
        "issues": DataQualityIssueSerializer(issues, many=True).data,
    })


# -- Categories config --

@api_view(["GET"])
def categories_config(request):
    """Get the category configuration for the frontend."""
    return Response(get_all_category_info())

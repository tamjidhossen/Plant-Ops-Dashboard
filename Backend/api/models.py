from django.db import models


class DataUpload(models.Model):
    """Tracks each CSV upload session."""

    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_records = models.IntegerField(default=0)
    valid_records = models.IntegerField(default=0)
    invalid_records = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.filename} ({self.uploaded_at:%Y-%m-%d %H:%M})"


class ShiftRecord(models.Model):
    """Individual shift record from an uploaded CSV."""

    upload = models.ForeignKey(
        DataUpload, on_delete=models.CASCADE, related_name="records"
    )

    # Raw values preserved for audit trail
    raw_day_date = models.CharField(max_length=50)
    raw_start = models.CharField(max_length=50, blank=True)
    raw_end = models.CharField(max_length=50, blank=True)
    raw_hours = models.CharField(max_length=20)
    raw_reason = models.CharField(max_length=100)

    # Cleaned values
    day_date = models.DateField(null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_hours = models.FloatField(null=True, blank=True)
    reason = models.CharField(max_length=100)
    category_group = models.CharField(max_length=50)

    # Validation metadata
    is_valid = models.BooleanField(default=True)
    is_duplicate = models.BooleanField(default=False)
    anomalies = models.JSONField(default=list)

    class Meta:
        ordering = ["day_date", "start_time"]

    def __str__(self):
        return f"{self.day_date} | {self.reason} | {self.duration_hours}h"


class DataQualityIssue(models.Model):
    """Individual data quality issue found during cleaning."""

    upload = models.ForeignKey(
        DataUpload, on_delete=models.CASCADE, related_name="issues"
    )
    record = models.ForeignKey(
        ShiftRecord,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quality_issues",
    )
    row_index = models.IntegerField(default=0)
    issue_type = models.CharField(max_length=50)
    description = models.CharField(max_length=500)
    original_value = models.CharField(max_length=200, blank=True)
    resolved_value = models.CharField(max_length=200, blank=True)
    resolution = models.CharField(max_length=200)

    class Meta:
        ordering = ["row_index", "issue_type"]

    def __str__(self):
        return f"Row {self.row_index}: {self.issue_type}"

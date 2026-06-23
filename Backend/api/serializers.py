from rest_framework import serializers

from .models import DataUpload, ShiftRecord, DataQualityIssue


class DataUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataUpload
        fields = [
            "id", "filename", "uploaded_at", "total_records",
            "valid_records", "invalid_records", "is_active",
        ]


class ShiftRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftRecord
        fields = [
            "id", "raw_day_date", "raw_start", "raw_end", "raw_hours", "raw_reason",
            "day_date", "start_time", "end_time", "duration_hours",
            "reason", "category_group", "is_valid", "is_duplicate", "anomalies",
        ]


class DataQualityIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityIssue
        fields = [
            "id", "row_index", "issue_type", "description",
            "original_value", "resolved_value", "resolution",
        ]


class QualityReportSerializer(serializers.Serializer):
    """Aggregated quality report for an upload."""
    total_records = serializers.IntegerField()
    valid_records = serializers.IntegerField()
    invalid_records = serializers.IntegerField()
    duplicate_records = serializers.IntegerField()
    issue_summary = serializers.DictField()
    issues = DataQualityIssueSerializer(many=True)

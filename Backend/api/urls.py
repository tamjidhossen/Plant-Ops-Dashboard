from django.urls import path

from . import views

urlpatterns = [
    # Upload management
    path("upload/", views.upload_csv, name="upload-csv"),
    path("uploads/", views.list_uploads, name="list-uploads"),
    path("uploads/clear/", views.clear_db, name="clear-db"),
    path("uploads/<int:upload_id>/", views.delete_upload, name="delete-upload"),
    path("uploads/<int:upload_id>/activate/", views.set_active_upload, name="activate-upload"),

    # Records
    path("records/", views.list_records, name="list-records"),

    # Analytics
    path("analytics/summary/", views.analytics_summary, name="analytics-summary"),
    path("analytics/daily/", views.analytics_daily, name="analytics-daily"),
    path("analytics/shift-chart/", views.analytics_shift_chart, name="analytics-shift-chart"),
    path("analytics/reason-distribution/", views.analytics_reason_distribution, name="analytics-reason-distribution"),
    path("analytics/hourly-activity/", views.analytics_hourly_activity, name="analytics-hourly-activity"),
    path("analytics/breakdown-streaks/", views.analytics_breakdown_streaks, name="analytics-breakdown-streaks"),
    path("analytics/insights/", views.analytics_insights, name="analytics-insights"),

    # Quality
    path("quality-report/", views.quality_report, name="quality-report"),

    # Config
    path("categories/", views.categories_config, name="categories-config"),
]

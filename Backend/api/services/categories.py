"""
Configurable category registry for shift activity reasons.

New categories can be added here without changing any core logic.
Any reason not listed is automatically classified as 'uncategorized'.
"""

CATEGORY_GROUPS = {
    "productive": {"Production", "Setup", "Training", "Quality Check"},
    "downtime": {"Breakdown", "Unknown Failure"},
    "planned_stop": {"Maintenance", "Cleaning"},
    "external": {"Power Failure", "Material Shortage"},
    "other": {"Idle", "Other", "Machine Jam"},
}

# Build reverse lookup dynamically
REASON_TO_GROUP = {}
for group, reasons in CATEGORY_GROUPS.items():
    for reason in reasons:
        REASON_TO_GROUP[reason] = group

DOWNTIME_REASONS = CATEGORY_GROUPS["downtime"]

# Display colors for each reason (used by frontend charts)
REASON_COLORS = {
    "Breakdown": "#ef4444",
    "Unknown Failure": "#f97316",
    "Power Failure": "#eab308",
    "Material Shortage": "#a855f7",
    "Maintenance": "#3b82f6",
    "Cleaning": "#06b6d4",
    "Training": "#22c55e",
    "Quality Check": "#10b981",
    "Setup": "#6366f1",
    "Production": "#14b8a6",
    "Idle": "#94a3b8",
    "Other": "#78716c",
    "Machine Jam": "#e11d48",
}

GROUP_COLORS = {
    "productive": "#22c55e",
    "downtime": "#ef4444",
    "planned_stop": "#3b82f6",
    "external": "#eab308",
    "other": "#94a3b8",
    "uncategorized": "#d4d4d4",
}


def classify_reason(reason: str) -> str:
    """Classify a reason into its category group. Unknown reasons -> 'uncategorized'."""
    return REASON_TO_GROUP.get(reason, "uncategorized")


def is_productive(reason: str) -> bool:
    """Check if a reason counts as productive (not Breakdown or Unknown Failure)."""
    return reason not in DOWNTIME_REASONS


def get_color_for_reason(reason: str) -> str:
    """Get display color for a specific reason."""
    return REASON_COLORS.get(reason, "#d4d4d4")


def get_all_category_info():
    """Return category configuration for the frontend."""
    return {
        "groups": {k: sorted(list(v)) for k, v in CATEGORY_GROUPS.items()},
        "reason_colors": REASON_COLORS,
        "group_colors": GROUP_COLORS,
        "downtime_reasons": sorted(list(DOWNTIME_REASONS)),
    }

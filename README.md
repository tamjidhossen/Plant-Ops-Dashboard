# Plant Operations Dashboard - Renata PLC Developer Assignment

A professional-grade, full-stack Plant Operations Dashboard designed to monitor operational efficiency, analyze shift activity timelines, cluster and score equipment breakdown streaks, and report data quality metrics.

Built as a submission for the Renata PLC Software Developer assignment, demonstrating engineering maturity, robust server-side processing, extensible architecture, and high-fidelity data visualization.

---

## 🚀 Quick Start

### Prerequisites
*   Python 3.10+
*   Node.js 18+ & npm

### One-Command Setup
From the root directory, install all dependencies, configure the SQLite database, and run migrations:
```bash
npm run setup
```

### Run Locally (Concurrently)
Start both the Django REST API (port 8000) and the Vite frontend (port 5173) with a single command:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser to view the application.

---

## 🛠️ Technology Stack

*   **Backend (Data & Analytics Engine)**:
    *   **Django 5.x**: Robust backend routing, request validation, and database management.
    *   **Django REST Framework (DRF)**: High-performance JSON API serialization.
    *   **SQLite**: Lightweight, zero-config relational database to persist CSV upload states.
*   **Frontend (Interactive User Interface)**:
    *   **React 19 & TypeScript**: Component-driven architecture with compile-time type safety.
    *   **Vite 8**: Ultra-fast next-generation frontend toolchain.
    *   **shadcn/ui**: Modern, accessible UI components styled with Vanilla CSS.
    *   **Recharts**: Declarative, responsive charting library for data visualization.
    *   **Lucide React**: Clean, modern iconography system (no emojis used in UI or code comments).

---

## 🌟 Key Engineering Features

### 1. Robust Server-Side Data Cleaning Pipeline
Evaluates every shift record against a taxonomy of 10 data anomalies (such as negative hours, duration mismatches, invalid months/days, missing timestamps, exact duplicates, and overlapping shifts). It resolves issues logically, logs details for supervisor audit, and saves the cleaned dataset to SQLite. See [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) for details.

### 2. Breakdown Streak Detection & Scoring
Implements a rolling-window breakdown streak clustering algorithm. It groups equipment breakdowns that occur within an 8-hour gap window of each other. Each streak is scored out of 100 using a weighted duration and recurrence formula to categorize streaks into **Critical**, **Warning**, or **Minor** severity levels.

### 3. Dynamic Operational Insights
Computes 6 distinct operational insights from the uploaded dataset rather than displaying hardcoded text:
1.  **Primary Downtime Source**: Highlights the top downtime contributor by percentage of total shift hours.
2.  **Peak Failure Time Window**: Identifies the hour of the day with the highest frequency of failure events.
3.  **Lowest Efficiency Day**: Flags the specific date with the worst operational efficiency.
4.  **Power Reliability Concern**: Isolates external utility failure metrics.
5.  **Maintenance Effectiveness**: Measures the ratio of breakdown hours to preventive maintenance hours.
6.  **Activity Concentration**: Analyzes diversity of operations to identify process imbalances.

### 4. Extensible Activity Category Registry
Includes a configuration-driven categories registry (`api/services/categories.py`). Activity reasons are mapped dynamically to groups (productive, downtime, planned stop, external, other). Any newly introduced reason in the CSV is automatically categorized as `"uncategorized"` and styled with neutral shades, ensuring the dashboard never crashes.

### 5. Multi-View Dashboard Layout
*   **Overview**: Summary cards (KPIs), the primary Shift Analysis gantt chart, activity distributions, and operational insights.
*   **Shift Analysis**: Interactive timeline charts and hourly event concentration heatmaps.
*   **Breakdown Streaks**: Visualizes streaks, durations, and outputs algorithm configurations.
*   **Data Explorer**: A sortable grid of raw records with date/reason/category filtering and client-side CSV export.
*   **Data Quality**: A first-class audit report detailing all flagged issues, original vs resolved values, and applied corrections.

---

## 📁 Project Structure

```
Renata/
├── Backend/                 # Django REST Backend
│   ├── api/                 # Django Application
│   │   ├── services/        # Business Logic (CSV parsing, cleaning, analytics)
│   │   ├── models.py        # Database Schemas (Uploads, Records, Quality Issues)
│   │   ├── views.py         # REST API Controllers
│   │   └── urls.py          # API Endpoint Registrations
│   └── plant_ops/           # Django Configuration
├── Frontend/                # Vite React Frontend
│   ├── src/
│   │   ├── components/      # UI & Visualization Components
│   │   ├── hooks/           # useShiftData API query hook
│   │   ├── lib/             # API Client & TypeScript Interfaces
│   │   └── pages/           # Dashboard Page Components
│   └── vite.config.ts       # Proxy configuration (/api -> localhost:8000)
├── docs/
│   └── ASSUMPTIONS.md       # Implementation Details & Algorithmic Rules
└── package.json             # Root Orchestrator (npm run setup / dev)
```

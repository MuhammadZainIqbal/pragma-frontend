# PRAGMA // Frontend Client

The web interface for the PRAGMA Autonomous Code Review Engine. Built with React, TypeScript, Vite, and Tailwind CSS, this application renders live pull request analysis, multi-agent execution telemetry, code defect citations, and human-in-the-loop approval gates.

---

## Technical Overview

- **Framework:** React 18 / Vite
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Industrial Monospaced Theme)
- **State Management & Data Fetching:** Native React Hooks with REST polling against FastAPI backend
- **Data Visualization:** Recharts / Custom SVG metric components
- **Deployment:** Vercel

---

## Core Dashboard Features

### 1. Interactive Staging & Approval Gate
- Displays pull request metadata, code quality evaluation scores, and critical defect counts.
- Features a persistent approval state backed by `localStorage` and backend state checks, allowing engineers to manually review findings and resume paused pipelines.

### 2. Multi-Agent Telemetry & Analytics
- **Node Execution Latency:** Displays duration metrics for individual agent nodes (`security_agent`, `architecture_agent`, `style_agent`).
- **Token Breakdown by Agent:** Aggregates input/output token volume per unique agent node with fixed color mapping. Handles retries cleanly without duplicating legend entries.

### 3. Defect Analysis & Diff Citation Viewer
- Categorizes findings by severity (`CRITICAL`, `WARNING`, `INFO`).
- Displays exact file paths, line ranges, remediation guidance, and highlighted code diff snippets.

### 4. Interactive System Diagram & User Manual
- Provides an integrated workflow breakdown explaining webhook ingestion, agent execution, and feedback delivery.
- Includes step-by-step setup guidance for installing the GitHub App and configuring repository permissions.

### 5. Static Demo Mode
- Intercepts requests for `?run_id=demo-sample-run` to render a pre-configured sample dataset without hitting backend or database endpoints.

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_FASTAPI_BACKEND_URL=https://pragma-backend-sxvw.onrender.com
VITE_SUPABASE_URL=https://<your-supabase-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

---

## Local Development

1. **Clone repository:**
```bash
git clone https://github.com/MuhammadZainIqbal/pragma-frontend.git
cd pragma-frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Verify TypeScript compilation and build:**
```bash
npm run build
```

---

## Project Structure

```text
pragma-frontend/
├── src/
│   ├── components/
│   │   ├── ReviewDashboard.tsx   # Primary PR evaluation view & approval gate
│   │   ├── TelemetryView.tsx     # Latency and token breakdown charts
│   │   ├── FindingsList.tsx      # Defect citations & remediation suggestions
│   │   ├── WorkflowDiagram.tsx   # Interactive pipeline visualization
│   │   └── LandingPage.tsx       # Root landing view & quickstart guide
│   ├── data/
│   │   └── demoSampleData.ts     # Mock telemetry & findings for demo mode
│   ├── App.tsx                   # Main route & query param inspector (?run_id=)
│   └── main.tsx                  # React DOM entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Data Flow & API Integration

1. **Parameter Inspection:** Upon mounting, `App.tsx` checks for a `?run_id=` URL parameter.
2. **Backend Queries:** If present, state is requested from `GET /api/state?run_id=<run_id>` on the FastAPI backend.
3. **Fallback & Error Handling:** If the run is not found or fails to respond, explicit error boundaries terminate loading spinners and render diagnostic state messages rather than empty views.

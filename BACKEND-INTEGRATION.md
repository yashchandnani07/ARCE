# ARCE Backend-Frontend Integration Guide

This document describes how the ARCE backend (FastAPI) connects to the frontend (TanStack Start).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCE System Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Frontend   │◄────────┤  FastAPI     │                  │
│  │  (React 19)  │  REST   │  Backend     │                  │
│  │  Port: 5173  │  API    │  Port: 8000  │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                           │
│                                   │ reads                     │
│                                   ▼                           │
│                          ┌─────────────────┐                 │
│                          │  runs/ directory│                 │
│                          │  (JSON records) │                 │
│                          └─────────────────┘                 │
│                                   ▲                           │
│                                   │ writes                    │
│                                   │                           │
│                          ┌────────┴────────┐                 │
│                          │  MCP Server     │                 │
│                          │  (arce tools)   │                 │
│                          └─────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Backend Dependencies

```bash
# Install FastAPI and dependencies
pip install -r arce/requirements-api.txt
```

### 2. Start the Backend Server

```bash
# From project root
python arce/api_server.py

# Or with uvicorn directly
uvicorn arce.api_server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Configure Frontend

The frontend is already configured with `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Start the Frontend

```bash
cd Frontend
bun install
bun dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/` | GET | Health check | Service status |
| `/api/kpis` | GET | Dashboard KPI metrics | `Kpi[]` |
| `/api/repositories` | GET | Repository status list | `Repository[]` |
| `/api/activity` | GET | Activity feed events | `ActivityEvent[]` |
| `/api/pull-requests/open` | GET | Most recent open PR | `PullRequest` |
| `/api/pull-requests/{pr_number}/trace` | GET | AI reasoning trace | `ReasoningLine[]` |
| `/api/audits/demo` | GET | Demo audit report | `AuditReport` |
| `/api/audits/{run_id}` | GET | Audit for specific run | `AuditReport` |
| `/api/audits/{run_id}/markdown` | GET | Audit markdown file | File download |
| `/api/runs` | GET | All run records | `Run[]` |
| `/api/runs/{run_id}` | GET | Specific run record | `Run` |
| `/api/bob/activity` | GET | Recent Bob activity | `{text, ago}[]` |

### Query Parameters

- `/api/activity?limit=10` - Limit number of activity events
- `/api/runs?limit=5` - Limit number of runs returned

## Data Flow

### 1. Run Creation (MCP Server → Disk)

```python
# In arce/mcp_server.py
from arce.run_io import start_run, update_run, finalize_run

# Start a new run
run_id = start_run(
    cve_id="CVE-2020-14343",
    package_name="pyyaml",
    version_before="5.3.1",
    cvss_before=9.8
)

# Update run with results
update_run(run_id, {
    "reachability": {"verdict": "reachable"},
    "tests": {"after_patch": {"passed": 3, "total": 3}}
})

# Finalize run
finalize_run(run_id, status="success")
```

This creates: `runs/{run_id}/run.json`

### 2. Data Transformation (Backend)

```python
# In arce/api_server.py
def transform_to_kpi(runs: List[Dict]) -> List[Dict]:
    """Transform run records into KPI metrics"""
    # Calculate security score, critical count, etc.
    # Returns frontend-compatible KPI format
```

### 3. Frontend Consumption

```typescript
// In Frontend/src/lib/api.ts
export async function getKpis(): Promise<Kpi[]> {
  if (!HAS_BACKEND) return KPIS; // Fallback to mocks
  
  const res = await fetch(apiUrl("/api/kpis"));
  if (!res.ok) throw new Error(`kpis: ${res.status}`);
  return (await res.json()) as Kpi[];
}
```

## Type Mappings

### Run Record → Frontend Types

| Run Record Field | Frontend Type | Transformation |
|------------------|---------------|----------------|
| `cve_id` | `string` | Direct mapping |
| `package.name` | `Repository.name` | Prefixed with "acme/" |
| `package.cvss_before` | `Kpi.value` | Aggregated into security score |
| `status` | `Repository.tone` | Mapped: success→ok, in_progress→ai, failed→err |
| `started_at` | `ActivityEvent.ago` | Converted to relative time (2s, 5m, 1h) |
| `pr_url` | `PullRequest.url` | Direct mapping |
| `tests.after_patch` | `PullRequest.testsPassed` | Formatted as "X / Y" |
| `self_correction_attempts` | `ReasoningLine` | Converted to reasoning trace |

## CORS Configuration

The backend is configured to allow requests from:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

To add production origins, modify [`arce/api_server.py`](arce/api_server.py:24-33):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-production-domain.com",  # Add production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Integration

### 1. Verify Backend is Running

```bash
curl http://localhost:8000/
# Expected: {"service":"ARCE API","version":"1.0.0","status":"operational"}
```

### 2. Test API Endpoints

```bash
# Get KPIs
curl http://localhost:8000/api/kpis

# Get repositories
curl http://localhost:8000/api/repositories

# Get activity feed
curl http://localhost:8000/api/activity?limit=5

# Get runs
curl http://localhost:8000/api/runs
```

### 3. Verify Frontend Connection

1. Open browser to `http://localhost:5173/dashboard`
2. Open browser DevTools → Network tab
3. Look for requests to `http://localhost:8000/api/*`
4. Verify responses are 200 OK with JSON data

### 4. Test with Real Data

```bash
# Create a test run using MCP tools
# This will populate runs/ directory with real data

# Then refresh the dashboard to see live data
```

## Fallback Behavior

The frontend gracefully falls back to mock data when:

1. `VITE_API_BASE_URL` is not set in `.env.local`
2. Backend is not running
3. API requests fail

This allows the frontend to work standalone for development and demos.

## Development Workflow

### Typical Development Flow

1. **Start Backend**: `python arce/api_server.py`
2. **Start Frontend**: `cd Frontend && bun dev`
3. **Run MCP Pipeline**: Execute ARCE remediation to generate run data
4. **View in Dashboard**: Navigate to `/dashboard` to see live data
5. **Iterate**: Make changes, backend auto-reloads with `--reload` flag

### Hot Reload

- **Backend**: Use `uvicorn arce.api_server:app --reload` for auto-reload on code changes
- **Frontend**: Vite automatically hot-reloads on file changes

## Troubleshooting

### CORS Errors

**Symptom**: Console shows "CORS policy" errors

**Solution**: Verify backend CORS configuration includes your frontend origin

### 404 Errors

**Symptom**: API returns 404 for `/api/runs` or other endpoints

**Solution**: Ensure `runs/` directory exists and contains run records

### Empty Data

**Symptom**: Dashboard shows no data or falls back to mocks

**Solution**: 
1. Check `VITE_API_BASE_URL` is set correctly
2. Verify backend is running on port 8000
3. Run ARCE pipeline to generate run data

### Type Mismatches

**Symptom**: Frontend shows errors or incorrect data

**Solution**: Verify backend transformers return data matching [`Frontend/src/data/types.ts`](Frontend/src/data/types.ts)

## Production Deployment

### Backend Deployment

```bash
# Install dependencies
pip install -r arce/requirements-api.txt

# Run with production settings
uvicorn arce.api_server:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Deployment

```bash
cd Frontend

# Set production API URL
echo "VITE_API_BASE_URL=https://api.your-domain.com" > .env.production

# Build for production
bun run build

# Deploy dist/ directory to your hosting provider
```

### Environment Variables

**Backend**: No environment variables required (uses local `runs/` directory)

**Frontend**:
- `VITE_API_BASE_URL`: Backend API base URL (required for live data)

## API Response Examples

### GET /api/kpis

```json
[
  {
    "label": "Security Score",
    "value": "94",
    "delta": "+6.2",
    "spark": [70, 72, 75, 78, 82, 88, 94],
    "tone": "ok"
  },
  {
    "label": "Open Critical",
    "value": "0",
    "delta": "−3",
    "spark": [3, 3, 2, 2, 1, 1, 0],
    "tone": "ok"
  }
]
```

### GET /api/repositories

```json
[
  {
    "name": "acme/pyyaml",
    "score": 94,
    "severityMix": "0 / 0 / 1",
    "status": "5m ago",
    "tone": "ok"
  }
]
```

### GET /api/activity

```json
[
  {
    "text": "PR #2 opened · pyyaml",
    "ago": "2s",
    "tone": "ok"
  },
  {
    "text": "CVE-2020-14343 detected in pyyaml",
    "ago": "45s",
    "tone": "err"
  }
]
```

## Next Steps

1. ✅ Backend API server created
2. ✅ Frontend wired to backend
3. ✅ CORS configured
4. ✅ Environment variables set
5. 🔄 Test with real run data
6. 🔄 Deploy to production

## Related Documentation

- [Frontend Integration Guide](Frontend/INTEGRATION.md) - Frontend-specific integration details
- [Run I/O Module](arce/run_io.py) - Run record management
- [MCP Server](arce/mcp_server.py) - Tool implementations that generate run data
- [API Server](arce/api_server.py) - Backend implementation
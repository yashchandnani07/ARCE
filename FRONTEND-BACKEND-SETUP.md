# Frontend-Backend Integration Setup

Complete guide to running the ARCE system with both frontend and backend connected.

## Quick Start (Automated)

### Windows (PowerShell)

```powershell
.\start-servers.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x start-servers.sh
./start-servers.sh
```

This will:
1. ✅ Install all dependencies (backend + frontend)
2. ✅ Start FastAPI backend on `http://localhost:8000`
3. ✅ Start frontend dev server on `http://localhost:5173`
4. ✅ Configure CORS for local development

## Manual Setup

### Step 1: Install Backend Dependencies

```bash
# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Install FastAPI and dependencies
pip install -r arce/requirements-api.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd Frontend
bun install
# or: npm install / pnpm install
cd ..
```

### Step 3: Configure Environment

The frontend is already configured with `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

To use mock data instead, remove or comment out this line.

### Step 4: Start Backend Server

```bash
# From project root
python arce/api_server.py

# Or with auto-reload for development:
uvicorn arce.api_server:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

### Step 5: Start Frontend Server

```bash
cd Frontend
bun dev
# or: npm run dev / pnpm dev
```

Frontend will be available at: `http://localhost:5173`

## Verify Integration

### 1. Check Backend Health

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "service": "ARCE API",
  "version": "1.0.0",
  "status": "operational"
}
```

### 2. Test API Endpoints

```bash
# Get KPIs
curl http://localhost:8000/api/kpis

# Get repositories
curl http://localhost:8000/api/repositories

# Get activity feed
curl http://localhost:8000/api/activity

# Get runs
curl http://localhost:8000/api/runs
```

### 3. Check Frontend Connection

1. Open browser to `http://localhost:5173`
2. Navigate to `/dashboard`
3. Open DevTools → Network tab
4. Look for requests to `http://localhost:8000/api/*`
5. Verify 200 OK responses with JSON data

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCE Full Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React 19 + TanStack Start)                        │
│  ├─ Marketing site (/)                                       │
│  ├─ Dashboard (/dashboard)                                   │
│  └─ Docs (/docs)                                             │
│                                                               │
│  ↓ HTTP REST API                                             │
│                                                               │
│  Backend (FastAPI)                                           │
│  ├─ /api/kpis                                                │
│  ├─ /api/repositories                                        │
│  ├─ /api/activity                                            │
│  ├─ /api/pull-requests/*                                     │
│  ├─ /api/audits/*                                            │
│  └─ /api/runs/*                                              │
│                                                               │
│  ↓ File I/O                                                  │
│                                                               │
│  Data Layer (runs/ directory)                                │
│  └─ runs/{run_id}/                                           │
│      ├─ run.json (structured data)                           │
│      ├─ audit.md (markdown report)                           │
│      └─ sbom.json (software bill of materials)               │
│                                                               │
│  ↑ MCP Tools                                                 │
│                                                               │
│  ARCE Pipeline (Bob + MCP Server)                            │
│  ├─ start_pipeline_run                                       │
│  ├─ check_reachability                                       │
│  ├─ run_tests                                                │
│  ├─ evaluate_policy                                          │
│  ├─ generate_audit_trail                                     │
│  ├─ create_governed_pr                                       │
│  └─ end_pipeline_run                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### 1. Pipeline Execution (MCP → Disk)

```python
# Bob executes ARCE pipeline via MCP tools
run_id = start_pipeline_run(
    cve_id="CVE-2020-14343",
    package_name="pyyaml",
    version_before="5.3.1",
    cvss_before=9.8
)
# Creates: runs/20260517-073000-CVE-2020-14343/run.json
```

### 2. Backend Transformation (Disk → API)

```python
# FastAPI reads run records and transforms to frontend types
runs = list_runs()  # Reads all runs/*.json files
kpis = transform_to_kpi(runs)  # Aggregates into KPI metrics
# Returns: [{"label": "Security Score", "value": "94", ...}]
```

### 3. Frontend Consumption (API → UI)

```typescript
// React component fetches from API
const kpis = await getKpis();
// Renders: Dashboard with live metrics
```

## Available Endpoints

| Endpoint | Description | Example Response |
|----------|-------------|------------------|
| `GET /` | Health check | `{"service": "ARCE API", ...}` |
| `GET /api/kpis` | Dashboard KPIs | `[{"label": "Security Score", ...}]` |
| `GET /api/repositories` | Repo status | `[{"name": "acme/pyyaml", ...}]` |
| `GET /api/activity` | Activity feed | `[{"text": "PR #2 opened", ...}]` |
| `GET /api/pull-requests/open` | Latest PR | `{"repo": "acme/pyyaml", ...}` |
| `GET /api/pull-requests/{n}/trace` | AI reasoning | `[{"tag": "[plan]", ...}]` |
| `GET /api/audits/demo` | Demo audit | `{"cve": "CVE-2020-14343", ...}` |
| `GET /api/audits/{run_id}` | Run audit | `{"cve": "...", ...}` |
| `GET /api/audits/{run_id}/markdown` | Audit file | `audit.md` download |
| `GET /api/runs` | All runs | `[{"run_id": "...", ...}]` |
| `GET /api/runs/{run_id}` | Single run | `{"run_id": "...", ...}` |
| `GET /api/bob/activity` | Bob activity | `[{"text": "patched pyyaml", ...}]` |

## Development Tips

### Hot Reload

- **Backend**: Use `uvicorn --reload` flag for auto-reload on code changes
- **Frontend**: Vite automatically hot-reloads on file changes

### Debugging

**Backend logs**:
```bash
# Backend logs appear in terminal where api_server.py is running
# Look for request logs: "GET /api/kpis HTTP/1.1" 200 OK
```

**Frontend logs**:
```bash
# Frontend logs in browser DevTools Console
# Network tab shows all API requests
```

### Testing with Real Data

1. Run ARCE pipeline to generate run data:
   ```bash
   # Execute remediation via Bob
   # This creates runs/{run_id}/run.json
   ```

2. Refresh dashboard to see live data:
   ```bash
   # Navigate to http://localhost:5173/dashboard
   # Data automatically fetches from backend
   ```

### Fallback to Mocks

To test frontend without backend:

1. Remove `VITE_API_BASE_URL` from `.env.local`
2. Restart frontend dev server
3. Frontend will use mock data from `Frontend/src/data/mock.ts`

## Troubleshooting

### Port Already in Use

**Backend (8000)**:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Frontend (5173)**:
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### CORS Errors

If you see CORS errors in browser console:

1. Verify backend is running on `http://localhost:8000`
2. Check `VITE_API_BASE_URL` matches backend URL
3. Ensure CORS middleware in `arce/api_server.py` includes your origin

### Empty Dashboard

If dashboard shows no data:

1. Check backend is running: `curl http://localhost:8000/`
2. Verify `runs/` directory exists and contains run records
3. Check browser Network tab for failed API requests
4. Run ARCE pipeline to generate test data

### Type Errors

If frontend shows type errors:

1. Verify backend responses match types in `Frontend/src/data/types.ts`
2. Check browser console for detailed error messages
3. Inspect API response in Network tab

## Production Deployment

### Backend

```bash
# Install dependencies
pip install -r arce/requirements-api.txt

# Run with production settings
uvicorn arce.api_server:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --no-access-log
```

### Frontend

```bash
cd Frontend

# Set production API URL
echo "VITE_API_BASE_URL=https://api.your-domain.com" > .env.production

# Build
bun run build

# Deploy dist/ to hosting provider (Vercel, Netlify, Cloudflare Pages, etc.)
```

## Related Documentation

- [`BACKEND-INTEGRATION.md`](BACKEND-INTEGRATION.md) - Detailed API documentation
- [`Frontend/INTEGRATION.md`](Frontend/INTEGRATION.md) - Frontend integration guide
- [`arce/api_server.py`](arce/api_server.py) - Backend implementation
- [`Frontend/src/lib/api.ts`](Frontend/src/lib/api.ts) - Frontend API adapter

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation in `BACKEND-INTEGRATION.md`
3. Inspect browser DevTools and backend logs
4. Verify all dependencies are installed correctly
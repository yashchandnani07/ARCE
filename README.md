<p align="center">
  <h1 align="center">🛡️ ARCE — Autonomous Remediation & Compliance Engine</h1>
</p>

<p align="center">
  <strong>An autonomous DevSecOps agent powered by IBM Bob that detects, remediates, and governs software supply chain vulnerabilities — end-to-end, without human intervention.</strong>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick_Start-▶-a3ff12?style=for-the-badge" alt="Quick Start"></a>
  <a href="#-demo"><img src="https://img.shields.io/badge/Live_Demo-🌐-00aaff?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://github.com/yashchandnani07/ARCE/pull/2"><img src="https://img.shields.io/badge/Governed_PR-📋-ff8800?style=for-the-badge" alt="PR"></a>
  <a href="bob-report/"><img src="https://img.shields.io/badge/Bob_Report-📊-9b59b6?style=for-the-badge" alt="Bob Report"></a>
</p>

---

> **"Other tools detect vulnerabilities. ARCE detects, verifies, patches, tests, self-corrects, verifies the live application, and submits a governed PR — autonomously, with a compliance-ready audit trail. The human stays in control. The agent handles the engineering toil."**

---

## 🎯 What It Does

ARCE is a **closed-loop, autonomous remediation pipeline** that transforms a CVE detection into a governed, human-reviewable Pull Request — in minutes, not days. It orchestrates IBM Bob through a custom `compliance-remediator` mode with two MCP servers to execute 9 steps autonomously:

| Step | Action | What Happens |
|:----:|--------|-------------|
| 1 | **Detect** | `pip-audit` scans dependencies and flags `pyyaml==5.3.1` with CVE-2020-14343 |
| 2 | **Verify Reachability** | AST-based static analysis confirms `yaml.load()` is imported AND called — not just listed as a dependency |
| 3 | **Patch** | Upgrades `pyyaml` to latest stable version in `requirements.txt` |
| 4 | **Test (FAIL)** | Runs pytest → `TypeError: load() missing 1 required positional argument: 'Loader'` |
| 5 | **Self-Correct** | Bob reads the error, reasons about the breaking API change, and fixes `yaml.load(f)` → `yaml.safe_load(f)` |
| 6 | **Test (PASS)** | Runs pytest again → all 3 tests pass ✅ |
| 7 | **E2E Verify** | Starts Flask app, uses Playwright to verify `localhost:5000` and `/api/health` respond correctly |
| 8 | **Generate Audit Trail** | Produces `audit.md` — a compliance-ready document with CVE details, patch diff, test results, and agent reasoning |
| 9 | **Create Governed PR** | Submits a GitHub Pull Request with the audit trail as the PR body |

**The self-correction at steps 4–6 is the killer feature.** Bob doesn't just blindly patch — it upgrades, discovers the upgrade broke tests, reads the error message, reasons about the fix, and applies it. This is agentic reasoning, not scripted automation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ARCE Full Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Frontend (React 19 + TanStack Start)            │       │
│  │  - Marketing site (/)                             │       │
│  │  - Live Dashboard (/dashboard)                    │       │
│  │  - Documentation (/docs)                          │       │
│  │  Port: 5173                                       │       │
│  └────────────────┬─────────────────────────────────┘       │
│                   │                                           │
│                   │ HTTP REST API (CORS enabled)             │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Backend (FastAPI)                               │       │
│  │  - 12 REST endpoints                             │       │
│  │  - Data transformers                             │       │
│  │  - Type-safe responses                           │       │
│  │  Port: 8000                                      │       │
│  └────────────────┬─────────────────────────────────┘       │
│                   │                                           │
│                   │ File I/O                                  │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Data Layer (runs/ directory)                    │       │
│  │  runs/{run_id}/                                  │       │
│  │    ├─ run.json (structured data)                 │       │
│  │    ├─ audit.md (markdown report)                 │       │
│  │    └─ sbom.json (bill of materials)              │       │
│  └────────────────▲─────────────────────────────────┘       │
│                   │                                           │
│                   │ MCP Tools                                 │
│                   │                                           │
│  ┌────────────────┴─────────────────────────────────┐       │
│  │  ARCE Pipeline (Bob + MCP Server)                │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │ MCP Server 1: arce-tools (FastMCP)        │  │       │
│  │  │ - check_reachability (AST analysis)       │  │       │
│  │  │ - run_tests (pytest subprocess)           │  │       │
│  │  │ - generate_audit_trail (audit.md)         │  │       │
│  │  │ - create_governed_pr (gh CLI)             │  │       │
│  │  │ - start/end_pipeline_run (run tracking)   │  │       │
│  │  │ - evaluate_policy (severity gating)       │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  │  ┌────────────────────────────────────────────┐  │       │
│  │  │ MCP Server 2: Playwright                  │  │       │
│  │  │ - browser_navigate, browser_snapshot      │  │       │
│  │  │ - browser_screenshot (E2E verification)   │  │       │
│  │  └────────────────────────────────────────────┘  │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Flow

1. **Detect** → `pip-audit` scans dependencies
2. **Verify Reachability** → AST analysis confirms usage
3. **Evaluate Policy** → Severity-based gating
4. **Patch** → Upgrade to latest stable version
5. **Test** → Run pytest (may fail)
6. **Self-Correct** → Bob fixes breaking changes
7. **Re-test** → Verify fix works
8. **E2E Verify** → Playwright checks live app
9. **Generate Audit** → Create compliance trail
10. **Create PR** → Submit governed pull request
11. **Dashboard** → View results in real-time

---

## 💻 Tech Stack

| Component | Tool | Cost |
|-----------|------|:----:|
| **Frontend** | React 19 + TanStack Start + Vite 7 | Free |
| **Backend API** | FastAPI + Uvicorn | Free |
| **Detection** | `pip-audit` (backed by OSV.dev) | Free |
| **Agentic Core** | IBM Bob — custom mode | Provided |
| **MCP Server 1** | `FastMCP` (Python) — remediation tools | Free |
| **MCP Server 2** | `@playwright/mcp` — E2E browser verification | Free |
| **Testing** | `pytest` | Free |
| **Static Analysis** | Python `ast` module | Built-in |
| **PR Creation** | GitHub CLI (`gh`) | Free |
| **UI Components** | shadcn/ui + Tailwind CSS v4 | Free |

> **Total cost: $0** — Every component is free or open-source.

---

## 🎬 Demo

### 🌐 Live Dashboard (React + FastAPI)

> **Frontend**: Modern React dashboard with real-time metrics
> **Backend**: FastAPI REST API serving live remediation data
> **[View Legacy Streamlit Dashboard →](https://arce-dashboard.streamlit.app)**

### 📋 Governed Pull Request

> **[View the Governed PR on GitHub →](https://github.com/yashchandnani07/ARCE/pull/2)**
>
> *PR #2: Security: Patch CVE-2020-14343 — created autonomously by ARCE with full audit trail*

### 📊 IBM Bob Report

> **[View the exported IBM Bob task report →](bob-report/)**

---

## 🚀 Quick Start

### One-Command Setup

```powershell
# Windows
.\start-servers.ps1

# Linux/Mac
chmod +x start-servers.sh
./start-servers.sh
```

**That's it!** This single command:
- ✅ Installs all dependencies (backend + frontend)
- ✅ Starts FastAPI backend on `http://localhost:8000`
- ✅ Starts React frontend on `http://localhost:5173`
- ✅ Configures CORS for local development

### Access Points

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Prerequisites

- **Python 3.10+**
- **Bun** (or Node.js 18+) — `npm install -g bun`
- **Git** + **GitHub CLI (`gh`)** — `winget install GitHub.cli`
- **IBM Bob** (provided by hackathon)

### Manual Setup (if needed)

```powershell
# Backend
pip install -r arce/requirements-api.txt
python arce/api_server.py

# Frontend (in new terminal)
cd Frontend
bun install
bun dev
```

### 2. Verify the Vulnerability Exists

```powershell
.\venv\Scripts\pip-audit.exe --format json -r demo-app/requirements.txt
```

Should flag `pyyaml==5.3.1` with **CVE-2020-14343** (arbitrary code execution via unsafe YAML deserialization).

### 3. Configure Bob IDE

1. Open Bob IDE → Settings → MCP Servers
2. Add `arce-tools` and `playwright` servers (see [MCP Configuration Guide](MCP-CONFIGURATION-GUIDE.md))
3. Verify both servers show ✅ Connected

### 4. Trigger the ARCE Pipeline

#### Scenario A: PyYAML Unsafe Deserialization (CVE-2020-14343)

1. Switch to **ARCE Compliance Remediator** mode in Bob IDE
2. Paste the pip-audit output and prompt:

```
I have scanned the demo-app directory with pip-audit and found vulnerabilities.
Here is the output: <paste CVE JSON>
Please execute the full remediation pipeline on the demo-app/ directory.
```

3. Watch Bob autonomously execute all 9 steps 🚀

#### Scenario B: Jinja2 Template Injection (CVE-2024-22195)

1. Verify the vulnerability exists:

```powershell
.\venv\Scripts\pip-audit.exe --format json -r demo-app-jinja/requirements.txt
```

Should flag `jinja2==3.1.2` with **CVE-2024-22195** (attribute injection via xmlattr filter).

2. Switch to **ARCE Compliance Remediator** mode in Bob IDE
3. Paste the pip-audit output and prompt:

```
I have scanned the demo-app-jinja directory with pip-audit and found vulnerabilities.
Here is the output: <paste CVE JSON>
Please execute the full remediation pipeline on the demo-app-jinja/ directory.
Remember to use project_dir="demo-app-jinja" when calling run_tests.
```

4. Watch Bob autonomously detect the jinja2 vulnerability, upgrade to the latest version,
   and verify the fix through the attribute injection test 🚀

### 5. View the Results

**Live Dashboard** (already running at http://localhost:5173):
- Real-time KPIs (security score, open critical CVEs, auto-patched count)
- Repository status with severity breakdown
- Activity feed showing recent events
- Pull request details with AI reasoning trace
- Audit reports with download links

**Check the Fix**:
```powershell
type demo-app\app.py          # yaml.load(f) → yaml.safe_load(f) ✅
type demo-app\requirements.txt # pyyaml upgraded ✅
type audit.md                  # Full compliance document ✅
```

**Legacy Streamlit Dashboard** (optional):
```powershell
cd dashboard
streamlit run streamlit_app.py
```

---

## 🎨 Frontend-Backend Integration

### Modern React Dashboard

The ARCE dashboard is a production-ready React application with:

**Frontend Features**:
- ⚡ **React 19** with TanStack Start for SSR
- 🎨 **Tailwind CSS v4** with custom design tokens
- 🧩 **shadcn/ui** components for consistent UI
- 📊 **Real-time metrics** from live remediation runs
- 🔄 **Smart fallback** to mock data when backend unavailable
- 📱 **Responsive design** for desktop and mobile

**Backend API** (FastAPI):
- 🚀 **12 REST endpoints** serving dashboard data
- 🔄 **Data transformers** converting run records to frontend types
- 🔒 **CORS configured** for secure local development
- 📝 **Type-safe responses** matching frontend contracts
- 📊 **Aggregated metrics** (KPIs, repositories, activity feed)
- 📥 **File downloads** for audit trails and SBOMs

**Key Endpoints**:
- `GET /api/kpis` - Dashboard KPI metrics
- `GET /api/repositories` - Repository status list
- `GET /api/activity` - Activity feed events
- `GET /api/pull-requests/open` - Latest open PR
- `GET /api/runs` - All run records
- `GET /api/audits/{run_id}/markdown` - Download audit trail

**Data Flow**:
```
MCP Pipeline → runs/{run_id}/run.json → FastAPI → React Dashboard
```

See [`BACKEND-INTEGRATION.md`](BACKEND-INTEGRATION.md) for complete API documentation.

---

## 📁 Project Structure

```
ARCE/
├── Frontend/                   # 🆕 React Dashboard (TanStack Start + Vite)
│   ├── src/
│   │   ├── routes/             #   File-based routing (/, /dashboard, /docs)
│   │   ├── components/         #   UI components + shadcn primitives
│   │   ├── lib/api.ts          #   Backend adapter (wired to FastAPI)
│   │   └── data/types.ts       #   TypeScript type definitions
│   ├── .env.local              #   API base URL configuration
│   └── package.json            #   Frontend dependencies
│
├── arce/                       # Backend & MCP Server
│   ├── api_server.py           # 🆕 FastAPI REST API (12 endpoints)
│   ├── requirements-api.txt    # 🆕 Backend dependencies
│   ├── mcp_server.py           #   FastMCP server with remediation tools
│   ├── run_io.py               #   Run record I/O operations
│   ├── policy/                 #   Policy engine for severity-based gating
│   └── schemas/                #   JSON schemas for run records
│
├── runs/                       # 🆕 Run artifacts (created by pipeline)
│   └── {run_id}/               #   Each run gets its own directory
│       ├── run.json            #   Structured run record
│       ├── audit.md            #   Compliance audit trail
│       └── sbom.json           #   Software bill of materials
│
├── demo-app/                   # Target application with known vulnerability
│   ├── app.py                  #   Flask app with vulnerable yaml.load()
│   ├── config.yaml             #   App configuration
│   ├── requirements.txt        #   pyyaml==5.3.1 → CVE-2020-14343
│   └── tests/                  #   pytest test suite
│
├── demo-app-jinja/             # Second demo scenario (Jinja2 CVE)
│   ├── app.py                  #   Flask app with vulnerable xmlattr filter
│   ├── requirements.txt        #   jinja2==3.1.2 → CVE-2024-22195
│   └── tests/                  #   pytest test suite
│
├── dashboard/                  # Legacy Streamlit Dashboard
│   ├── streamlit_app.py        #   SOC-style dashboard
│   └── requirements.txt        #   streamlit + plotly dependencies
│
├── .bob/                       # IBM Bob configuration
│   ├── mcp.json                #   MCP server registration
│   └── custom_modes.yaml       #   compliance-remediator mode definition
│
├── start-servers.ps1           # 🆕 One-command startup (Windows)
├── start-servers.sh            # 🆕 One-command startup (Linux/Mac)
├── test_integration.py         # 🆕 Backend integration tests
├── BACKEND-INTEGRATION.md      # 🆕 API documentation (372 lines)
├── FRONTEND-BACKEND-SETUP.md   # 🆕 Setup guide (344 lines)
├── INTEGRATION-SUMMARY.md      # 🆕 Integration overview (390 lines)
├── audit.md                    #   Generated audit trail
├── cve_output.json             #   pip-audit scan output
├── setup-mcp.ps1               #   MCP setup script
└── MCP-CONFIGURATION-GUIDE.md  #   MCP configuration reference
```

---

## 🔄 Resetting for a Fresh Demo Run

```powershell
git checkout main
git reset --hard origin/main
.\venv\Scripts\pip.exe install "pyyaml==5.3.1" --force-reinstall
```

This restores `app.py` to the vulnerable `yaml.load()` and pins pyyaml back to 5.3.1.

---

## 🔍 How the MCP Tools Work

### Tool 1: `check_reachability(package_name, source_dir)`

Uses Python's `ast` module to parse every `.py` file and walk the AST looking for:
- `import <package>` or `from <package> import ...` statements
- Function calls like `<package>.load()`, `<package>.dump()`, etc.

Returns `"reachable"` (imported + called), `"imported-but-unused"`, or `"not-imported"`.

**Why it matters:** Prevents patching code that doesn't even use the vulnerable package — this is the *Contextual Reasoning* criterion.

### Tool 2: `run_tests(test_dir)`

Executes `pytest` via subprocess and returns structured JSON with pass/fail status, stdout, stderr, and return code. Bob reads this to reason about test failures.

### Tool 3: `generate_audit_trail(cve_id, reachability_verdict, patch_diff, test_results, e2e_results)`

Produces a compliance-ready markdown document with:
- CVE details and reachability verdict
- Patch diff
- Test results (before and after self-correction)
- E2E verification evidence
- Agent reasoning trace (with triple-fallback: Bob export → task logs → tool I/O)

### Tool 4: `create_governed_pr(branch_name, commit_message, pr_title)`

Creates a Git branch, commits all changes, pushes, and opens a GitHub PR with `audit.md` as the PR body — all via `git` and `gh` CLI.

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| `pytest` not found | Use `.\venv\Scripts\pytest.exe` or activate venv first |
| MCP server not connecting | Check `.bob/mcp.json` paths; see [MCP Configuration Guide](MCP-CONFIGURATION-GUIDE.md) |
| `gh` not recognized | `winget install GitHub.cli` → `gh auth login` |
| Playwright fails | Run `npx playwright install` to download browsers |
| Tests fail on fresh clone | Ensure you're in `demo-app/` dir when running pytest |
| pyyaml version wrong | `pip install "pyyaml==5.3.1" --force-reinstall` |

📖 **Detailed troubleshooting:** [MCP Configuration Guide](MCP-CONFIGURATION-GUIDE.md) · [MCP Server Troubleshooting](Project-context/MCP-Server-Troubleshooting.md)

---

## 🏆 Hackathon Alignment

| Criterion | How ARCE Addresses It |
|-----------|----------------------|
| **Application of Tech** | Bob is the central orchestrator via custom mode + 2 MCP servers. Every step runs through Bob. |
| **Originality** | Closed-loop autonomy with self-correction. Detects → Remediates → Tests → Self-corrects → Verifies → Governs. |
| **Business Value** | Reduces mean-time-to-remediate from days to minutes. Governance-ready audit trail for CISO/compliance teams. |
| **Contextual Reasoning** | AST-based reachability analysis — checks if the vulnerable package is actually imported and called before patching. |
| **Knowledge Transfer** | Streamlit governance dashboard + audit.md serve as knowledge transfer artifacts. |

---

<p align="center">
  <strong>Built with ❤️ for the IBM Bob AI Agent Hackathon 2026</strong><br>
  <em>Total cost: $0 · Fully autonomous · Compliance-ready</em>
</p>

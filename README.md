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
Demo App (Flask + PyYAML 5.3.1)
        │
        ▼
    pip-audit ──→ CVE JSON (CVE-2020-14343)
        │
        ▼
┌─── IBM Bob (compliance-remediator mode) ───────────────────┐
│                                                             │
│  MCP Server 1: arce-tools (FastMCP / Python)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tool 1: check_reachability  → AST analysis            │  │
│  │ Tool 2: run_tests           → pytest subprocess       │  │
│  │ Tool 3: generate_audit_trail → audit.md               │  │
│  │ Tool 4: create_governed_pr   → gh CLI                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  MCP Server 2: Playwright (@playwright/mcp)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ browser_navigate, browser_snapshot, browser_screenshot │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Pipeline:                                                  │
│  1. Read CVE JSON                                          │
│  2. check_reachability → "reachable"                       │
│  3. Patch requirements.txt + pip install                   │
│  4. run_tests → FAIL (TypeError)                           │
│  5. Self-correct: yaml.load() → yaml.safe_load()          │
│  6. run_tests → PASS                                       │
│  7. Playwright → verify live app at localhost:5000         │
│  8. generate_audit_trail → audit.md                        │
│  9. create_governed_pr → GitHub PR                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
    Streamlit Governance Dashboard (hosted demo for judges)
```

---

## 💻 Tech Stack

| Component | Tool | Cost |
|-----------|------|:----:|
| **Detection** | `pip-audit` (backed by OSV.dev) | Free |
| **Agentic Core** | IBM Bob — custom mode | Provided |
| **MCP Server 1** | `FastMCP` (Python) — 4 custom tools | Free |
| **MCP Server 2** | `@playwright/mcp` — E2E browser verification | Free |
| **Testing** | `pytest` | Free |
| **Static Analysis** | Python `ast` module | Built-in |
| **PR Creation** | GitHub CLI (`gh`) | Free |
| **Hosted Demo** | Streamlit Community Cloud | Free |

> **Total cost: $0** — Every component is free or open-source.

---

## 🎬 Demo

### 🌐 Live Governance Dashboard

> **[View the ARCE Governance Dashboard →](https://arce-dashboard.streamlit.app)**
>
> *(Streamlit Community Cloud — a real-time view of completed ARCE remediation runs)*

### 📋 Governed Pull Request

> **[View the Governed PR on GitHub →](https://github.com/yashchandnani07/ARCE/pull/2)**
>
> *PR #2: Security: Patch CVE-2020-14343 — created autonomously by ARCE with full audit trail*

### 📊 IBM Bob Report

> **[View the exported IBM Bob task report →](bob-report/)**

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for Playwright MCP)
- **Git** + **GitHub CLI (`gh`)** — `winget install GitHub.cli`
- **IBM Bob** (provided by hackathon)

### 1. Clone & Setup

```powershell
git clone https://github.com/yashchandnani07/ARCE.git
cd ARCE

# Automated setup (recommended)
.\setup-mcp.ps1

# — OR — manual setup:
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastmcp pytest pip-audit flask "pyyaml==5.3.1" streamlit
npx playwright install
gh auth login
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

1. Switch to **ARCE Compliance Remediator** mode in Bob IDE
2. Paste the pip-audit output and prompt:

```
I have scanned the demo-app directory with pip-audit and found vulnerabilities.
Here is the output: <paste CVE JSON>
Please execute the full remediation pipeline on the demo-app/ directory.
```

3. Watch Bob autonomously execute all 9 steps 🚀

### 5. View the Results

```powershell
# Check the fix
type demo-app\app.py          # yaml.load(f) → yaml.safe_load(f) ✅
type demo-app\requirements.txt # pyyaml upgraded ✅

# View the audit trail
type audit.md                  # Full compliance document ✅

# Run the governance dashboard
cd dashboard
streamlit run streamlit_app.py
```

---

## 📁 Project Structure

```
ARCE/
├── demo-app/                   # Target application with known vulnerability
│   ├── app.py                  #   Flask app with vulnerable yaml.load()
│   ├── config.yaml             #   App configuration (YAML deserialization target)
│   ├── requirements.txt        #   pyyaml==5.3.1 → CVE-2020-14343
│   └── tests/
│       ├── __init__.py
│       └── test_app.py         #   3 pytest tests (health, index, load_config)
│
├── arce/                       # MCP Server — the 4 ARCE tools
│   ├── mcp_server.py           #   FastMCP server with check_reachability,
│   │                           #   run_tests, generate_audit_trail,
│   │                           #   create_governed_pr
│   └── run_mcp_server.py       #   Wrapper that suppresses stderr noise
│
├── dashboard/                  # Streamlit Governance Dashboard
│   ├── streamlit_app.py        #   SOC-style dashboard with live pipeline view
│   ├── audit.md                #   Audit trail from a successful ARCE run
│   └── requirements.txt        #   streamlit + plotly dependencies
│
├── bob-report/                 # Exported IBM Bob task report
│   └── ...                     #   Markdown export of Bob's reasoning sessions
│
├── .bob/                       # IBM Bob configuration
│   ├── mcp.json                #   MCP server registration (arce-tools + playwright)
│   └── custom_modes.yaml       #   compliance-remediator mode definition
│
├── Project-context/            # Design documents
│   ├── PRD.md                  #   Product Requirements Document
│   └── phasewise plan.md       #   Implementation plan (6 phases)
│
├── audit.md                    # Generated audit trail (from pipeline run)
├── cve_output.json             # pip-audit scan output
├── setup-mcp.ps1               # Automated setup script
├── MCP-CONFIGURATION-GUIDE.md  # Detailed MCP configuration reference
├── QUICK-START.md              # Quick start guide
├── SETUP-SUMMARY.md            # Setup summary
└── .gitignore
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

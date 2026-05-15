# ARCE — Autonomous Remediation & Compliance Engine

## Product Requirements Document (PRD)

**Event:** IBM Bob Hackathon (lablab.ai) — May 15–17, 2026  
**Format:** 48-hour virtual hackathon  
**Theme:** Agentic Development  
**Budget:** $0

---

## 1. Elevator Pitch

> Other tools detect vulnerabilities. ARCE detects, verifies reachability, patches, tests, catches its own mistakes, verifies the live application, and submits a governed Pull Request — all autonomously, with a compliance-ready audit trail.

ARCE is an autonomous, agentic DevSecOps workflow powered by IBM Bob. It scans a Python repository for supply chain vulnerabilities, uses AST-based static analysis to verify exploitability, generates and tests patches with a self-correction loop, verifies the running application via Playwright, produces a compliance-grade audit trail, and submits a governed GitHub Pull Request — without human intervention between steps.

---

## 2. Hackathon Alignment

### 2.1 Judging Criteria Mapping

| Criterion | How ARCE Addresses It |
|---|---|
| **Application of Tech** | Bob is the central orchestrator via custom mode + 2 MCP servers (ARCE tools + Playwright). Every step runs through Bob. |
| **Originality** | Closed-loop autonomy with self-correction. Past winner "Quanta" only detected vulns — ARCE detects, remediates, tests, self-corrects, and governs. |
| **Business Value** | Reduces mean-time-to-remediate from days to minutes. Governance-ready audit trail for CISO/compliance teams. |
| **Presentation** | Streamlit governance dashboard as hosted demo + 5-min video + 6-slide PDF deck. |

### 2.2 Focus Area Mapping

| Focus Area | ARCE Feature |
|---|---|
| **Contextual Reasoning** | AST-based reachability analysis — checks if the vulnerable package is actually imported and called in the codebase before patching. |
| **Repetitive Automation** | Autonomous test-fix loop + audit trail generation + governed PR creation. |
| **Knowledge Transfer** | The Streamlit governance dashboard and audit.md serve as knowledge transfer artifacts — a new developer opens them and immediately understands what was found, what was done, and why. |

### 2.3 Submission Checklist

| Requirement | Deliverable | Status |
|---|---|---|
| Project title + short description (≤255 chars) | "ARCE — AI agent that detects CVEs, verifies reachability, patches code, self-corrects test failures, verifies the live app, and submits governed PRs autonomously." | Planned |
| Long description (≥100 words) | README.md on GitHub | Planned |
| Cover image (PNG/JPG, 16:9) | Architecture diagram | Planned |
| Video (≤5 min, MP4) | OBS screen recording with voiceover | Planned |
| Slide deck (PDF) | 6 slides via Google Slides | Planned |
| Public GitHub repo | With code + exported IBM Bob report | Planned |
| Live demo URL | Streamlit Community Cloud dashboard | Planned |

---

## 3. Architecture

### 3.1 System Overview

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
│  3. Patch requirements.txt + app.py                        │
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
    Streamlit Dashboard (hosted demo for judges)
```

### 3.2 Tech Stack

| Layer | Component | Cost |
|---|---|---|
| Detection | `pip-audit` (backed by OSV.dev) | Free |
| Agentic Core | IBM Bob — custom mode | Provided by hackathon |
| MCP Server 1 | `FastMCP` (Python) — 4 custom tools | Free |
| MCP Server 2 | `@playwright/mcp` — E2E browser verification | Free |
| Testing | `pytest` | Free |
| Static Analysis | Python `ast` module | Built-in |
| PR Creation | GitHub CLI (`gh`) | Free |
| Hosted Demo | Streamlit Community Cloud | Free |
| Video Recording | OBS Studio | Free |

**Total cost: $0**

---

## 4. Demo Target Application

A purpose-built Flask app with a known vulnerable dependency and a deterministic breaking change on upgrade.

### 4.1 Vulnerability Selection

| Property | Value |
|---|---|
| Package | `pyyaml==5.3.1` |
| CVE | CVE-2020-14343 — arbitrary code execution via unsafe deserialization |
| pip-audit fix | Upgrade to `>=6.0.1` |
| Breaking change in 6.0+ | `yaml.load(data)` without `Loader` argument raises `TypeError` |
| Error message | `TypeError: load() missing 1 required positional argument: 'Loader'` |
| Required code fix | `yaml.load(f)` → `yaml.safe_load(f)` |

This is deterministic. The error is always identical. The fix is always the same one function call change. The vulnerability IS the unsafe code — the narrative is clean.

### 4.2 App Source Files

**`app.py`**
```python
from flask import Flask, jsonify
import yaml

app = Flask(__name__)

def load_config():
    """Load application configuration from YAML file."""
    with open("config.yaml", "r") as f:
        config = yaml.load(f)  # Vulnerable: CVE-2020-14343
    return config

@app.route("/")
def index():
    config = load_config()
    return jsonify({"status": "running", "app_name": config.get("app_name")})

@app.route("/api/health")
def health():
    return jsonify({"status": "healthy", "version": "1.0.0"})

if __name__ == "__main__":
    app.run(debug=False, port=5000)
```

**`config.yaml`**
```yaml
app_name: "ARCE Demo App"
version: "1.0.0"
database:
  host: "localhost"
  port: 5432
```

**`requirements.txt`**
```
flask==3.0.0
pyyaml==5.3.1
pytest==8.0.0
```

**`tests/test_app.py`**
```python
import pytest
from app import app, load_config

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200

def test_index(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["app_name"] == "ARCE Demo App"

def test_load_config():
    config = load_config()
    assert "app_name" in config
    assert config["app_name"] == "ARCE Demo App"
```

---

## 5. IBM Bob Configuration

### 5.1 MCP Server Registration — `.bob/mcp.json`

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "python",
      "args": ["mcp_server.py"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### 5.2 Custom Mode — `.bob/custom_modes.yaml`

```yaml
- slug: compliance-remediator
  name: ARCE Compliance Remediator
  roleDefinition: >
    You are an autonomous DevSecOps remediation agent. You detect supply chain
    vulnerabilities, verify reachability via AST analysis, generate and test
    patches with a self-correction loop, verify the live application via
    Playwright browser automation, produce compliance-ready audit trails, and
    submit governed pull requests. You operate without human intervention
    between steps.
  availableTools:
    - read
    - edit
    - command
    - mcp
  customInstructions: |-
    Execute the following remediation pipeline sequentially:

    1. Read the CVE JSON output from pip-audit.
    2. For each flagged vulnerability, invoke the check_reachability tool with
       the package name and the project source directory. Only proceed with
       remediation if the verdict is "reachable".
    3. Reason about the safest patch. Update requirements.txt to the LATEST
       stable version of the package (not just the minimum fix version).
       Install the updated dependency.
    4. Invoke run_tests. If tests FAIL:
       a. Read the stderr output carefully.
       b. Identify the breaking API change caused by the dependency upgrade.
       c. Apply the necessary code fix to the source files.
       d. Invoke run_tests again.
       e. Repeat up to 3 attempts total. If still failing after 3, halt and
          report the failure in the audit trail.
    5. After tests PASS: start the application server in the background.
       On Windows, use Start-Process or equivalent. Use the Playwright MCP
       tools to:
       a. Navigate to http://localhost:5000/
       b. Take a snapshot to verify the page loaded correctly.
       c. Navigate to http://localhost:5000/api/health
       d. Take a snapshot to verify the health endpoint responds.
       e. Take a screenshot for the audit trail.
       f. Kill the background server process.
    6. Invoke generate_audit_trail with the CVE ID, reachability verdict,
       patch diff, test results, and E2E verification results.
    7. Invoke create_governed_pr with the branch name, commit message,
       and PR body from audit.md.
```

---

## 6. MCP Tool Specifications

All tools are implemented in a single `mcp_server.py` file using FastMCP.

### Tool 1: `check_reachability`

| Property | Value |
|---|---|
| **Purpose** | Determine if a vulnerable package is actually invoked in the codebase |
| **Input** | `package_name: str`, `source_dir: str` |
| **Output** | One of: `"reachable"`, `"imported-but-unused"`, `"not-imported"` |
| **Implementation** | Python `ast.parse()` + `ast.NodeVisitor` |

**Detection patterns:**

| Pattern | Verdict |
|---|---|
| `import yaml` + `yaml.load()` call found | `reachable` |
| `import yaml` but no relevant call found | `imported-but-unused` |
| `from yaml import *` | `imported-but-unused` (conservative) |
| No import of the package found | `not-imported` |

**Scope note:** This is first-pass reachability signal using AST-level static analysis. It detects direct imports, from-imports, and function calls. A production system would integrate a full call-graph analyzer, but for the agentic workflow this level of signal is sufficient to prevent unnecessary patches.

### Tool 2: `run_tests`

| Property | Value |
|---|---|
| **Purpose** | Execute the test suite and return results to Bob |
| **Input** | `test_dir: str` (default: `"tests/"`) |
| **Output** | JSON with `passed: bool`, `stdout: str`, `stderr: str`, `return_code: int` |
| **Implementation** | `subprocess.run(["pytest", test_dir, "-v"], capture_output=True, timeout=60)` |

Bob reads the output. If tests fail, Bob reads stderr, reasons about the failure, fixes the code, and calls `run_tests` again. The custom mode instructions cap this at 3 attempts.

### Tool 3: `generate_audit_trail`

| Property | Value |
|---|---|
| **Purpose** | Produce a compliance-ready markdown document with full remediation evidence |
| **Input** | `cve_id: str`, `reachability_verdict: str`, `patch_diff: str`, `test_results: str`, `e2e_results: str` |
| **Output** | Writes `audit.md` to disk, returns confirmation string |

**Audit trail structure:**
```markdown
# ARCE Audit Trail
**Generated:** <ISO timestamp>
**CVE:** <CVE ID>
**Reachability Verdict:** <reachable | imported-but-unused | not-imported>

## Patch Applied
<diff block>

## Unit Test Results
<pytest output>

## E2E Verification
<Playwright verification results + screenshot path>

## Agent Reasoning Trace
<Bob's session trace>
```

**Agent trace retrieval — triple fallback:**
1. **Primary:** `bob export --all --format markdown --output ./bob-trace/`
2. **Fallback:** Read `%AppData%\Roaming\IBM Bob\User\globalStorage\ibm.bob-code\tasks\{task-id}\api_conversation_history.json`
3. **Fallback:** Use the tool's own input arguments as the trace record

### Tool 4: `create_governed_pr`

| Property | Value |
|---|---|
| **Purpose** | Create a human-reviewable GitHub PR with the patch and audit evidence |
| **Input** | `branch_name: str`, `commit_message: str`, `pr_title: str` |
| **Output** | PR URL string |
| **Implementation** | `git checkout -b`, `git add`, `git commit`, `gh pr create` |

The PR description body is auto-populated with the contents of `audit.md`.

### Playwright MCP (Server 2) — E2E Verification

Not a custom tool — this is the official `@playwright/mcp` server registered in `.bob/mcp.json`. Bob uses its built-in tools directly:

| Tool | Purpose in ARCE |
|---|---|
| `browser_navigate` | Navigate to `localhost:5000/` and `/api/health` |
| `browser_snapshot` | Get accessibility tree to verify page loaded and JSON response is correct |
| `browser_screenshot` | Capture visual evidence for the audit trail |

---

## 7. Pipeline Execution Flow

### 7.1 The 9-Step Sequence

| Step | Action | Tool Used | Expected Output |
|---|---|---|---|
| 1 | Scan dependencies | `pip-audit --format json -r requirements.txt` | CVE JSON flagging `pyyaml==5.3.1` |
| 2 | Check reachability | `check_reachability("yaml", "./")` | `"reachable"` — yaml.load is imported and called |
| 3 | Patch dependency | Bob edits `requirements.txt` | `pyyaml>=6.0.1` |
| 4 | Run tests (FAIL) | `run_tests("tests/")` | `TypeError: load() missing 1 required positional argument` |
| 5 | Self-correct | Bob edits `app.py` | `yaml.load(f)` → `yaml.safe_load(f)` |
| 6 | Run tests (PASS) | `run_tests("tests/")` | All 3 tests green |
| 7 | E2E verify | Playwright `browser_navigate` + `browser_snapshot` | App loads, health endpoint responds |
| 8 | Generate audit | `generate_audit_trail(...)` | `audit.md` written |
| 9 | Create PR | `create_governed_pr(...)` | GitHub PR URL |

### 7.2 Self-Correction Behavior

The self-correction at steps 4–6 is the killer feature. Here's why it's reliable:

- The error message is **deterministic**: always `TypeError: load() missing 1 required positional argument: 'Loader'`
- The fix is **one function call change**: `yaml.load(f)` → `yaml.safe_load(f)`
- Bob has seen this pattern thousands of times in training data — PyYAML's `load()` → `safe_load()` migration is one of the most documented breaking changes in the Python ecosystem

---

## 8. Hosted Demo — Streamlit Governance Dashboard

Since ARCE is a CLI tool, judges need an interactive URL. The solution is a Streamlit dashboard that displays completed ARCE run results.

**`streamlit_app.py`**
```python
import streamlit as st
from pathlib import Path

st.set_page_config(page_title="ARCE Dashboard", page_icon="🛡️", layout="wide")
st.title("🛡️ ARCE — Governance Dashboard")
st.caption("Autonomous Remediation & Compliance Engine")

# Pipeline status
st.subheader("Pipeline Status")
cols = st.columns(7)
steps = ["Detect", "Verify", "Patch", "Test", "Self-Correct", "E2E Verify", "Govern"]
for col, step in zip(cols, steps):
    col.metric(step, "✅")

# Audit trail
st.subheader("Latest Audit Trail")
audit_path = Path("audit.md")
if audit_path.exists():
    st.markdown(audit_path.read_text())
else:
    st.info("Run the ARCE pipeline to generate an audit trail.")

# PR link
st.subheader("Governed Pull Request")
st.link_button("View PR on GitHub", "https://github.com/your-repo/pull/1")
```

**Deployment:** Push to GitHub → connect to `share.streamlit.io` → live URL in 2 minutes. $0.

This dashboard also strengthens the **Knowledge Transfer** judging criterion — it IS the knowledge transfer artifact.

---

## 9. Demo Strategy

### 9.1 Video Structure (5 min max)

| Segment | Content | Duration |
|---|---|---|
| Hook | *"What if your AI could detect a CVE, verify it, fix it, test the fix, catch its own mistake, fix that too, verify the live app, and submit a governed PR — all autonomously?"* | 20s |
| Architecture | Pipeline diagram from slides | 30s |
| Live Demo | Full 9-step ARCE pipeline in terminal | 3 min |
| Results | Show audit.md + GitHub PR + Streamlit dashboard | 30s |
| Close | Differentiation + future vision | 30s |

**Tool:** OBS Studio (free). Record 3 successful runs, use the cleanest take, add voiceover after.

### 9.2 Slide Deck (6 slides, PDF)

1. **Title** — ARCE: Autonomous Remediation & Compliance Engine
2. **Problem** — "60% of breaches involve known, unpatched vulnerabilities. Remediation is manual, slow, and ungoverned."
3. **Solution** — 9-step pipeline diagram with Bob at center
4. **Demo** — Terminal screenshot showing the self-correction moment
5. **Business Value** — "Days → minutes. Governance-ready from day one."
6. **Stack** — IBM Bob + 5 MCP tools across 2 servers + pip-audit. All free.

**Tool:** Google Slides → export as PDF.

### 9.3 Live Demo Safety Net

```
1. Before recording/presenting: run the full pipeline 3 times.
   3/3 success → go live.

2. Record one successful run with OBS as backup.

3. During live demo, if Bob stalls >30s on self-correction:
   → "Let me show you the complete run we captured earlier"
   → Play the recording.
   
   Judges understand live demo variance. What matters is a working pipeline.
```

---

## 10. Project File Structure

```
ARCE/
├── demo-app/
│   ├── app.py                  # Flask app with vulnerable yaml.load()
│   ├── config.yaml             # App configuration
│   ├── requirements.txt        # pyyaml==5.3.1 (CVE-2020-14343)
│   └── tests/
│       └── test_app.py         # 3 pytest tests
│
├── arce/
│   └── mcp_server.py           # FastMCP server with 4 tools
│
├── dashboard/
│   ├── streamlit_app.py        # Governance dashboard
│   └── requirements.txt       # streamlit
│
├── .bob/
│   ├── mcp.json                # Registers arce-tools + playwright MCP servers
│   └── custom_modes.yaml       # compliance-remediator mode
│
├── audit.md                    # Generated by pipeline (not committed initially)
├── README.md                   # Project documentation for GitHub
└── .gitignore
```

---

## 11. First Hour Checklist (When Bob Access Arrives)

1. Open BobShell and run a trivial task to verify it works
2. Check `%AppData%\Roaming\IBM Bob\User\globalStorage\ibm.bob-code\tasks\` — verify log files exist and are readable
3. Try `bob export --all --format markdown --output ./test-export/` — verify the export command works
4. Based on results, set the primary audit trace approach in `mcp_server.py`
5. Register both MCP servers in `.bob/mcp.json` and verify Bob can see the tools
6. Switch to `compliance-remediator` mode and run a simple test

---

## 12. Time Budget (48 Hours)

| Block | Hours | Task |
|---|---|---|
| 1 | 1 | Verify BobShell logs + export command |
| 2 | 2 | Set up demo Flask app + tests + config |
| 3 | 4 | Build 4 FastMCP tools in mcp_server.py |
| 4 | 3 | Write .bob/ config files + configure Playwright MCP |
| 5 | 4 | Integration testing — full pipeline end-to-end |
| 6 | 2 | Build Streamlit dashboard |
| 7 | 1 | Deploy dashboard to Streamlit Community Cloud |
| 8 | 2 | Record video with OBS (3 takes minimum) |
| 9 | 2 | Build slide deck in Google Slides → PDF |
| 10 | 2 | Write README + export Bob report |
| 11 | 1 | Final submission on lablab.ai |
| **Buffer** | **~24** | **Sleep, eating, debugging** |

---

## 13. Differentiation Statement

For the opening line of every pitch, video, and PR description:

> **"Other tools detect vulnerabilities. ARCE detects, verifies, patches, tests, self-corrects, verifies the live application, and submits a governed PR — autonomously, with a compliance-ready audit trail. The human stays in control. The agent handles the engineering toil."**

# ARCE — Autonomous Remediation & Compliance Engine

> **Other tools detect vulnerabilities. ARCE detects, verifies, patches, tests, self-corrects, verifies the live application, and submits a governed PR — autonomously, with a compliance-ready audit trail.**

ARCE is an autonomous DevSecOps agent powered by IBM Bob. It scans a Python repository for supply chain vulnerabilities, uses AST-based static analysis to verify exploitability, generates and tests patches with a self-correction loop, verifies the running application via Playwright, produces a compliance-grade audit trail, and submits a governed GitHub Pull Request — without human intervention between steps.

---

## Architecture

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
└─────────────────────────────────────────────────────────────┘
        │
        ▼
    Streamlit Dashboard (hosted demo for judges)
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for Playwright MCP)
- **Git**
- **GitHub CLI (`gh`)** — install via `winget install GitHub.cli`
- **IBM Bob** (provided by hackathon)

---

## MCP Setup for Bob IDE

ARCE uses Model Context Protocol (MCP) to provide custom tools to Bob IDE. Follow these steps to set up the MCP server.

> 💡 **Note:** ARCE uses a wrapper script that suppresses stderr output to eliminate false error indicators in Bob IDE. You won't see any red error messages from FastMCP's informational output!

### Quick Setup (Recommended)

**Step 1: Clone and run the automated setup script**

```powershell
git clone https://github.com/yashchandnani07/ARCE.git
cd ARCE
.\setup-mcp.ps1
```

The script will:
- ✅ Check Python installation (3.8+ required)
- ✅ Create a virtual environment
- ✅ Install all dependencies (fastmcp, pytest, pip-audit, etc.)
- ✅ Validate the installation
- ✅ Configure wrapper script (suppresses stderr for clean error-free display)
- ✅ Display next steps

**Step 2: Get your Python path**

After the setup script completes, get the full path to your virtual environment Python:

```powershell
# Windows PowerShell (from ARCE directory)
(Get-Item .\venv\Scripts\python.exe).FullName
```

Copy this path - you'll need it for Bob IDE configuration.

**Step 3: Configure Bob IDE**

1. Open Bob IDE
2. Click the gear icon (⚙️) → Settings
3. Search for "MCP" or navigate to Extensions → MCP
4. Click "Edit in settings.json"
5. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "arce-tools": {
      "command": "PASTE_YOUR_PYTHON_PATH_HERE",
      "args": ["arce/run_mcp_server.py"],
      "alwaysAllow": [
        "check_reachability",
        "run_tests",
        "generate_audit_trail",
        "create_governed_pr"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "alwaysAllow": [
        "browser_navigate",
        "browser_snapshot",
        "browser_take_screenshot",
        "browser_close",
        "browser_console_messages"
      ]
    }
  }
}
```

**Example configuration:**
```json
"command": "d:/Projects/ARCE/venv/Scripts/python.exe"
```

> 💡 **Tip:** See `mcp-config-template.json` for a ready-to-use template and `MCP-CONFIGURATION-GUIDE.md` for detailed configuration instructions.

**Step 4: Verify the setup**

1. Restart Bob IDE
2. Check the MCP status icon (bottom right)
3. You should see green checkmarks for both:
   - ✅ `arce-tools` (no red error indicators!)
   - ✅ `playwright`

> 💡 **Why no red errors?** The wrapper script (`run_mcp_server.py`) suppresses stderr output from FastMCP's informational messages, giving you a clean, error-free experience in Bob IDE.

**Step 5: Test the MCP server**

In Bob IDE, try this prompt:
```
Use the check_reachability tool to analyze the demo-app directory for the yaml package.
```

If configured correctly, Bob will execute the tool and return results like "reachable", "imported-but-unused", or "not-imported".

### Manual Setup (Alternative)

If you prefer manual setup or the script doesn't work:

**1. Clone the repository**

```powershell
git clone https://github.com/yashchandnani07/ARCE.git
cd ARCE
```

**2. Create and activate virtual environment**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**3. Install Python dependencies**

```powershell
pip install fastmcp pytest pip-audit flask pyyaml streamlit
```

**4. Install Playwright browsers**

```powershell
npx playwright install
```

**5. Authenticate GitHub CLI**

```powershell
gh auth login
```

**6. Configure Bob IDE** (follow Step 3 from Quick Setup above)

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Script execution policy error | Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| MCP server shows red X | Verify Python path is correct and points to venv; check Bob IDE Output panel for errors |
| "Module 'fastmcp' not found" | Ensure you're using the venv Python path |
| Tools not working | Check `alwaysAllow` list includes all 4 ARCE tools |
| Playwright not connecting | Install Node.js 18+ and run `npx playwright install` |

📖 **For detailed troubleshooting, see:**
- [MCP Configuration Guide](MCP-CONFIGURATION-GUIDE.md) - Complete configuration reference
- [MCP Server Troubleshooting](Project-context/MCP-Server-Troubleshooting.md) - Common errors and solutions

### Resetting Demo App to Vulnerable State

To reset the demo app for a fresh demonstration:

```powershell
git checkout main
git reset --hard origin/main
.\venv\Scripts\pip.exe install "pyyaml==5.3.1" --force-reinstall
```

This restores `app.py` to the vulnerable `yaml.load()` and pins pyyaml back to 5.3.1.

---

## Setup (Windows) - Legacy Instructions

> ⚠️ **Note:** Use the MCP Setup section above for the recommended setup process.

### 1. Clone the repo

```powershell
git clone https://github.com/yashchandnani07/ARCE.git
cd ARCE
```

### 2. Create and activate virtual environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```powershell
pip install fastmcp pytest pip-audit flask "pyyaml==5.3.1" streamlit
```

### 4. Install Playwright browsers

```powershell
npx playwright install
```

### 5. Authenticate GitHub CLI

```powershell
gh auth login
```

### 6. Reset demo-app to vulnerable state (if needed)

```powershell
pip install "pyyaml==5.3.1"
```

Ensure `demo-app/app.py` uses `yaml.load(f)` and `demo-app/requirements.txt` has `pyyaml==5.3.1`.

---

## Project Structure

```
ARCE/
├── demo-app/
│   ├── app.py                  # Flask app with vulnerable yaml.load()
│   ├── config.yaml             # App configuration
│   ├── requirements.txt        # pyyaml==5.3.1 (CVE-2020-14343)
│   └── tests/
│       └── test_app.py         # 3 pytest tests
├── arce/
│   └── mcp_server.py           # FastMCP server with 4 tools
├── dashboard/
│   ├── streamlit_app.py        # Governance dashboard
│   └── requirements.txt        # streamlit
├── .bob/
│   ├── mcp.json                # MCP server registration
│   └── custom_modes.yaml       # compliance-remediator mode
├── audit.md                    # Generated by pipeline
├── README.md
└── .gitignore
```

---

## Running the Pipeline

### Step 1: Verify vulnerability exists

```powershell
.\venv\Scripts\pip-audit.exe --format json -r demo-app/requirements.txt
```

Should flag `pyyaml==5.3.1` with CVE-2020-14343.

### Step 2: Trigger ARCE via IBM Bob

1. Open IBM Bob IDE
2. Verify MCP servers are connected (Settings → MCP → both `arce-tools` and `playwright` show green)
3. Switch to **ARCE Compliance Remediator** mode
4. Paste the pip-audit JSON output and prompt:

```
I have scanned the demo-app directory with pip-audit and found vulnerabilities.
Here is the output: <paste CVE JSON>
Please execute the full remediation pipeline on the demo-app/ directory.
```

Bob will autonomously:
1. Check reachability → "reachable"
2. Upgrade pyyaml to latest
3. Run tests → FAIL (TypeError)
4. Self-correct: `yaml.load(f)` → `yaml.safe_load(f)`
5. Run tests → PASS
6. Start Flask app, verify with Playwright
7. Generate `audit.md`
8. Create governed PR

---

## Running the Dashboard

```powershell
cd dashboard
streamlit run streamlit_app.py
```

---

## Resetting for a Fresh Demo Run

```powershell
git checkout main
git reset --hard origin/main
.\venv\Scripts\pip.exe install "pyyaml==5.3.1" --force-reinstall
```

This restores `app.py` to the vulnerable `yaml.load()` and pins pyyaml back to 5.3.1.

---

## Tech Stack

| Component | Tool | Cost |
|-----------|------|------|
| Detection | pip-audit (OSV.dev) | Free |
| Agentic Core | IBM Bob (custom mode) | Provided |
| MCP Server 1 | FastMCP (Python) | Free |
| MCP Server 2 | @playwright/mcp | Free |
| Testing | pytest | Free |
| Static Analysis | Python ast module | Built-in |
| PR Creation | GitHub CLI (gh) | Free |
| Dashboard | Streamlit Community Cloud | Free |

**Total cost: $0**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pytest` not found | Use `.\venv\Scripts\pytest.exe` or activate venv first |
| MCP server not connecting | Check `.bob/mcp.json` paths are correct for your machine |
| `gh` not recognized | Install: `winget install GitHub.cli`, then `gh auth login` |
| Playwright fails | Run `npx playwright install` to download browsers |
| Tests fail on fresh clone | Ensure you're in `demo-app/` dir when running pytest |
| pyyaml version wrong | `pip install "pyyaml==5.3.1" --force-reinstall` |

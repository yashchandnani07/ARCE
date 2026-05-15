# ARCE — Phasewise Implementation Plan

> [!CAUTION]
> **CVE Correction (verified):** The original Core Idea and earlier drafts referenced CVE-2020-1747.
> This is WRONG — `pyyaml==5.3.1` is the FIX for CVE-2020-1747, so pip-audit will NOT flag it.
> The correct CVE is **CVE-2020-14343** (affects pyyaml < 5.4). pip-audit WILL flag 5.3.1 for this.
> The demo still works because: pip-audit recommends `>=5.4`, but `pip install` grabs the latest
> version (6.0+), which causes the `yaml.load()` TypeError. The self-correction scenario is unchanged.

## Assumptions

- IBM Bob is available and installed (provided by hackathon)
- Python 3.10+ is installed locally
- Node.js 18+ is installed (for Playwright MCP)
- GitHub CLI (`gh`) is installed and authenticated
- Git is configured with a remote GitHub repo for the project
- Working directory: `d:\Prooject\bob\ACRE\`
- **OS: Windows** — all commands use PowerShell syntax. `&` for background processes does NOT work; use `Start-Process` instead.

---

## Phase 0: Project Scaffolding & Environment

**Goal:** Create the folder structure and virtual environment so all subsequent phases have a clean foundation.

### Steps

0.1. Create the following directory structure inside `ARCE/`:
```
ARCE/
├── demo-app/
│   └── tests/
├── arce/
├── dashboard/
└── .bob/
```
- **Where:** `d:\Prooject\bob\ACRE\`
- **Why:** Every subsequent phase writes files into these directories. Creating them upfront prevents path errors.

0.2. Create a Python virtual environment inside `ARCE/`.
- Run `python -m venv venv` at the project root.
- **Why:** Isolates dependencies. The demo app needs `pyyaml==5.3.1` specifically — a global install could conflict.

0.3. Activate the virtual environment and install the development dependencies.
- Run `pip install fastmcp pytest pip-audit flask pyyaml==5.3.1 streamlit`
- **Why:** Installs all tools needed across every phase in one shot.

0.4. Install Playwright browser binaries.
- Run `npx playwright install`
- **Why:** The Playwright MCP server needs browser binaries to function. Without this, the E2E verification step will fail silently.

0.5. Create a `.gitignore` file at the project root.
- Ignore: `venv/`, `__pycache__/`, `*.pyc`, `audit.md`, `bob-trace/`, `.bob/mcp.json` (contains local paths).
- **Why:** Keeps the repo clean for the public GitHub submission.

0.6. Initialize a git repository with `git init` and make an initial commit.
- **Why:** The `create_governed_pr` tool needs git history to create branches and PRs.

### ✅ Human Verification — Phase 0

```
□ Run: dir ARCE\demo-app\tests    → folder exists
□ Run: python --version            → 3.10+
□ Run: venv\Scripts\activate       → prompt changes to (venv)
□ Run: pip list                    → shows fastmcp, pytest, pip-audit, flask, pyyaml 5.3.1, streamlit
□ Run: npx playwright --version   → prints a version number
□ Run: gh auth status              → shows "Logged in to github.com"
□ Run: git status                  → shows "on branch main" with initial commit
```

---

## Phase 1: Demo Target Application

**Goal:** Build the purpose-built Flask app that has the vulnerable `pyyaml==5.3.1` dependency and a deterministic breaking change on upgrade.

### Steps

1.1. Create `demo-app/requirements.txt` with exactly these three pinned dependencies:
- `flask==3.0.0`
- `pyyaml==5.3.1`
- `pytest==8.0.0`
- **Why:** `pyyaml==5.3.1` has **CVE-2020-14343** (arbitrary code execution, affects < 5.4). pip-audit will flag it. When Bob upgrades the dependency, pip installs the latest version (6.0+), which makes `yaml.load()` without a Loader argument raise a `TypeError` — this is the self-correction trigger.

1.2. Create `demo-app/config.yaml` with the following YAML content:
- Keys: `app_name: "ARCE Demo App"`, `version: "1.0.0"`, and a `database` block with `host: "localhost"` and `port: 5432`.
- **Why:** The Flask app reads this file using the vulnerable `yaml.load()`. This is the code path that triggers the CVE.

1.3. Create `demo-app/app.py` — a minimal Flask application with:
- An `import yaml` statement at the top.
- A `load_config()` function that opens `config.yaml` and parses it using `yaml.load(f)` (no Loader argument — this is intentionally vulnerable).
- A `/` route that calls `load_config()` and returns JSON with `status` and `app_name`.
- A `/api/health` route that returns `{"status": "healthy", "version": "1.0.0"}`.
- A `__main__` block that runs the app on port 5000.
- **Where:** `demo-app/app.py`
- **Why:** This is the target app ARCE will remediate. The `yaml.load(f)` call is both the CVE vector AND the code that breaks on upgrade.

1.4. Create `demo-app/tests/test_app.py` with three pytest tests:
- `test_health` — GET `/api/health`, assert status 200.
- `test_index` — GET `/`, assert status 200, assert JSON `app_name` equals `"ARCE Demo App"`.
- `test_load_config` — call `load_config()` directly, assert `app_name` key exists and has correct value.
- Include a pytest fixture `client` that creates a Flask test client.
- **Where:** `demo-app/tests/test_app.py`
- **Why:** These tests must PASS with pyyaml 5.3.1 and FAIL with pyyaml 6.0+ (due to TypeError on `yaml.load()`). This is what triggers the self-correction loop.

1.5. Create an empty `demo-app/tests/__init__.py` file.
- **Why:** Makes the `tests` directory a proper Python package so pytest can import from it.

### ✅ Human Verification — Phase 1

```
□ cd demo-app
□ Run: pip install -r requirements.txt
□ Run: python app.py
  → Open browser to http://localhost:5000/
  → See JSON: {"app_name": "ARCE Demo App", "status": "running"}
  → Open http://localhost:5000/api/health
  → See JSON: {"status": "healthy", "version": "1.0.0"}
  → Stop the server (Ctrl+C)

□ Run: pytest tests/ -v
  → All 3 tests PASS (test_health, test_index, test_load_config)

□ Run: pip-audit --format json -r requirements.txt
  → Output contains CVE-2020-14343 for pyyaml==5.3.1
  → If it shows a DIFFERENT CVE ID, that's fine — what matters is pyyaml is flagged.
  → Note the exact CVE ID shown — use THIS ID in the audit trail.

□ Now simulate the breaking change manually:
  Run: pip install "pyyaml>=6.0"
  Run: pytest tests/ -v
  → test_index and test_load_config FAIL with:
    "TypeError: load() missing 1 required positional argument: 'Loader'"
  → This confirms the self-correction scenario is deterministic.

□ Roll back: pip install pyyaml==5.3.1
  → Re-run pytest → all pass again. Demo app is reset.
```

---

## Phase 2: MCP Server — The 4 ARCE Tools

**Goal:** Build a single FastMCP server (`mcp_server.py`) that exposes 4 tools Bob will invoke during the pipeline.

### Steps

2.1. Create `arce/mcp_server.py` with the FastMCP boilerplate.
- Import `FastMCP` from `fastmcp`.
- Instantiate `mcp = FastMCP("arce-tools")`.
- Add a `__main__` block that calls `mcp.run()`.
- **Decorator syntax:** Use `@mcp.tool` (NO parentheses) to decorate each tool function. FastMCP uses the function's name, docstring, and type hints to auto-generate the tool schema.
- **Where:** `arce/mcp_server.py`
- **Why:** This is the entry point Bob will launch via `.bob/mcp.json`. The `mcp.run()` call starts the stdio transport that Bob communicates over.

> **LLM Note:** Every tool function MUST have:
> - Full type hints on all parameters and return type
> - A docstring (FastMCP uses it as the tool description for Bob)
> - A try/except block wrapping the entire body, returning error strings instead of raising exceptions. If a tool crashes, Bob loses the connection to the MCP server entirely.

2.2. Implement Tool 1: `check_reachability(package_name: str, source_dir: str) -> str`
- Use Python's `ast` module. For every `.py` file in `source_dir`:
  - Parse the file with `ast.parse()`.
  - Walk the AST with a custom `ast.NodeVisitor`.
  - Check for `import <package_name>` nodes (ast.Import).
  - Check for `from <package_name> import ...` nodes (ast.ImportFrom).
  - Check for function call nodes (ast.Call) where the function name contains the package name (e.g., `yaml.load`).
- Return logic:
  - If an import AND a call are found → return `"reachable"`.
  - If an import is found but no call → return `"imported-but-unused"`.
  - If `from <pkg> import *` is found → return `"imported-but-unused"` (conservative).
  - If no import found in any file → return `"not-imported"`.
- Add a docstring: `"Check if a vulnerable package is actually imported and called in the codebase. Returns: reachable, imported-but-unused, or not-imported."`
- **Why:** This prevents Bob from patching code that doesn't even use the vulnerable package. It's the "Contextual Reasoning" judging criterion.

2.3. Implement Tool 2: `run_tests(test_dir: str = "tests/") -> str`
- Use `subprocess.run()` to execute `["pytest", test_dir, "-v"]`.
- Set `capture_output=True`, `text=True`, `timeout=60`.
- Return a JSON string containing: `passed` (bool, based on return code 0), `stdout`, `stderr`, `return_code`.
- Add a docstring: `"Run pytest on the specified test directory and return the results."`
- **Why:** Bob needs structured output to reason about test failures. The JSON format lets Bob parse exactly what failed.

2.4. Implement Tool 3: `generate_audit_trail(cve_id: str, reachability_verdict: str, patch_diff: str, test_results: str, e2e_results: str) -> str`
- Build a markdown string with sections: header (timestamp, CVE, verdict), Patch Applied (diff block), Unit Test Results, E2E Verification, Agent Reasoning Trace.
- For the Agent Reasoning Trace, implement the triple fallback:
  - Try 1: Run `subprocess.run(["bob", "export", "--all", "--format", "markdown", "--output", "./bob-trace/"])`. If successful, read the latest `.md` file from `./bob-trace/`.
  - Try 2: Read `api_conversation_history.json` from `%AppData%\Roaming\IBM Bob\User\globalStorage\ibm.bob-code\tasks\` (latest task folder).
  - Try 3: If both fail, insert a note: `"*(Agent trace built from tool I/O — session export unavailable)*"`.
- Write the complete markdown to `audit.md` in the current working directory.
- Return a confirmation string with the byte count.
- Add a docstring: `"Generate a compliance-ready audit trail document from the remediation results."`
- **Why:** This is the governance output. The triple fallback guarantees the audit trail is ALWAYS generated regardless of Bob's log accessibility.

2.5. Implement Tool 4: `create_governed_pr(branch_name: str, commit_message: str, pr_title: str) -> str`
- Run the following git/gh commands via `subprocess.run()`, each as a separate call:
  - `git checkout -b {branch_name}`
  - `git add -A`
  - `git commit -m "{commit_message}"`
  - `git push origin {branch_name}`
  - `gh pr create --title "{pr_title}" --body-file audit.md`
- Capture the stdout of the `gh pr create` command — it outputs the PR URL.
- Return the PR URL string.
- Add a docstring: `"Create a governed GitHub Pull Request with the patch and audit evidence."`
- **Why:** The final output of the pipeline. The PR body is auto-populated from `audit.md`, giving judges a governed, human-reviewable artifact.

### ✅ Human Verification — Phase 2

```
□ Run: python arce/mcp_server.py
  → Should start without errors and wait for stdio input.
  → Press Ctrl+C to stop.

□ Test check_reachability manually:
  Create a temporary Python script that imports and calls the function directly:
    from arce.mcp_server import check_reachability
    result = check_reachability("yaml", "./demo-app")
    print(result)
  → Output: "reachable"
  
  Test with a non-existent package:
    result = check_reachability("nonexistent_pkg", "./demo-app")
    print(result)
  → Output: "not-imported"

□ Test run_tests manually:
    from arce.mcp_server import run_tests
    import json
    result = json.loads(run_tests("demo-app/tests/"))
    print(result["passed"])
  → Output: True (assuming pyyaml 5.3.1 is installed)

□ Test generate_audit_trail manually:
    from arce.mcp_server import generate_audit_trail
    result = generate_audit_trail(
        cve_id="CVE-2020-14343",
        reachability_verdict="reachable",
        patch_diff="- pyyaml==5.3.1\n+ pyyaml>=6.0.1",
        test_results="3 passed",
        e2e_results="App verified at localhost:5000"
    )
    print(result)
  → Check that audit.md was created in the current directory.
  → Open audit.md → verify it has all sections: CVE, Patch, Tests, E2E, Trace.

□ Test create_governed_pr: SKIP for now (requires a real remote repo).
  We will test this during Phase 4 integration.
```

---

## Phase 3: IBM Bob Configuration

**Goal:** Configure IBM Bob to recognize both MCP servers and operate in the custom `compliance-remediator` mode.

### Steps

3.1. Create `.bob/mcp.json` at the project root with two server entries:
- `"arce-tools"`: command `"python"`, args `["arce/mcp_server.py"]`.
- `"playwright"`: command `"npx"`, args `["-y", "@playwright/mcp@latest"]`.
- **Where:** `ARCE/.bob/mcp.json`
- **Why:** This tells Bob where to find the two MCP servers. Without this file, Bob cannot invoke any of the custom tools or Playwright.

3.2. Create `.bob/custom_modes.yaml` at the project root with the `compliance-remediator` mode.
- `slug`: `compliance-remediator`
- `name`: `ARCE Compliance Remediator`
- `roleDefinition`: A paragraph defining Bob as an autonomous DevSecOps remediation agent (use the exact text from PRD Section 5.2).
- `availableTools`: `[read, edit, command, mcp]`
- `customInstructions`: The 7-step sequential instruction chain from PRD Section 5.2. Copy it exactly, with these two critical additions:
  - In step 3, add: **"Always upgrade to the LATEST stable version of the package, not just the minimum fix version, to ensure maximum security coverage."** (This ensures Bob installs 6.0+ instead of 5.4, which is necessary for the breaking change.)
  - In step 5, replace `python app.py &` with: **"Start the application server. On Windows, use `Start-Process python -ArgumentList 'demo-app/app.py'` or equivalent. Verify the server is running before navigating."** (The `&` syntax is bash/Linux — you are on Windows PowerShell.)
- **Where:** `ARCE/.bob/custom_modes.yaml`
- **Why:** This is the brain of the system. The custom instructions tell Bob exactly what to do at each step. Without this, Bob has no idea what pipeline to follow.

3.3. Open IBM Bob IDE. Navigate to MCP settings (three dots → MCP servers). Verify that both `arce-tools` and `playwright` appear in the server list.
- **Why:** If the servers don't appear, the `mcp.json` path or syntax is wrong. Fix before proceeding.

3.4. In IBM Bob IDE, switch to the `compliance-remediator` mode (via the mode dropdown).
- Verify the mode name appears and the role definition is visible.
- **Why:** Confirms the YAML was parsed correctly and the mode is registered.

3.5. Verify BobShell log location. Open a BobShell terminal and run a trivial command (e.g., "list all files in demo-app").
- After it completes, check `%AppData%\Roaming\IBM Bob\User\globalStorage\ibm.bob-code\tasks\`.
- Look for the latest task folder. Open `api_conversation_history.json`.
- **Why:** This confirms Fallback 2 of the audit trail works. If this folder structure differs, update the path in `mcp_server.py` (step 2.4).

3.6. Test the `bob export` command.
- Run: `bob export --all --format markdown --output ./bob-trace/`
- Check if a markdown file was created in `./bob-trace/`.
- **Why:** This confirms Fallback 1 of the audit trail works. If the command doesn't exist or fails, the triple fallback still guarantees audit generation.

### ✅ Human Verification — Phase 3

```
□ Open Bob IDE → MCP servers panel
  → "arce-tools" shows status: Connected (or Ready)
  → "playwright" shows status: Connected (or Ready)

□ Mode dropdown in Bob IDE
  → "ARCE Compliance Remediator" appears as an option
  → Selecting it shows the roleDefinition text

□ Run a trivial Bob task in BobShell
  → Check %AppData%\Roaming\IBM Bob\...\tasks\ for a new folder
  → The folder contains api_conversation_history.json

□ If bob export works → note "Fallback 1 is active"
  If it fails → note "Fallback 1 unavailable, Fallback 2/3 will handle it"
  → Update mcp_server.py accordingly (remove or reorder fallbacks)
```

---

## Phase 4: Integration Testing — Full Pipeline

**Goal:** Run the entire 9-step ARCE pipeline end-to-end through IBM Bob and verify every step produces the correct output.

### Steps

4.1. Reset the demo app to its vulnerable state.
- Ensure `demo-app/requirements.txt` has `pyyaml==5.3.1`.
- Ensure `demo-app/app.py` uses `yaml.load(f)` (no Loader).
- Run `pip install pyyaml==5.3.1` to reset the installed version.
- **Why:** Each pipeline test run starts from a clean vulnerable state.

4.2. Push the project to GitHub as a public repository.
- Run `git remote add origin <your-github-repo-url>` (if not done).
- Run `git push -u origin main`.
- **Why:** The `create_governed_pr` tool needs a remote to push branches and open PRs. Without a remote, step 9 of the pipeline will fail.

4.3. Run pip-audit standalone to verify detection output.
- Run `pip-audit --format json -r demo-app/requirements.txt`
- Save the output to `cve_output.json` in the project root.
- **Why:** This is the input that kicks off the pipeline. Verify the JSON structure contains the CVE ID, package name, and fix version before feeding it to Bob.

4.4. Activate `compliance-remediator` mode in Bob IDE and give it the trigger prompt:
```
I have scanned the demo-app directory with pip-audit and found vulnerabilities.
Here is the output: <paste contents of cve_output.json>
Please execute the full remediation pipeline on the demo-app/ directory.
```
- **Why:** This is the actual pipeline trigger. Watch Bob execute each step.

4.5. Monitor Bob's execution. For each step, observe the terminal/chat for:
- Step 1: Bob reads the CVE JSON.
- Step 2: Bob invokes `check_reachability` → expect `"reachable"`.
- Step 3: Bob edits `requirements.txt` (pyyaml version bump) and runs `pip install`.
- Step 4: Bob invokes `run_tests` → expect FAIL with TypeError.
- Step 5: Bob reads the error and edits `app.py` → `yaml.safe_load(f)`.
- Step 6: Bob invokes `run_tests` again → expect PASS.
- Step 7: Bob starts the Flask app, uses Playwright to browse `localhost:5000`.
- Step 8: Bob invokes `generate_audit_trail` → `audit.md` created.
- Step 9: Bob invokes `create_governed_pr` → PR URL returned.
- **Why:** This is the integration test. Every step must succeed.

4.6. If any step fails, debug and fix:
- **check_reachability returns wrong verdict:** Review the AST visitor logic in `mcp_server.py`. Print the AST nodes for `demo-app/app.py` to debug.
- **run_tests doesn't capture errors:** Verify `capture_output=True` and `text=True` are set in `subprocess.run`.
- **Playwright E2E fails:** Check that `npx playwright install` was run (Phase 0.4). Verify the Flask app is actually running on port 5000 before Playwright tries to navigate.
- **generate_audit_trail crashes:** Check which fallback is being used. If Fallback 1 and 2 fail, ensure Fallback 3 still writes the audit from tool arguments.
- **create_governed_pr fails:** Verify `gh auth status` shows logged in. Verify the remote is set. Try `gh pr create` manually to isolate the issue.

4.7. After a successful full run, verify the outputs:
- Open `audit.md` — check all sections are populated.
- Open the GitHub PR URL — check the PR body contains the audit trail.
- Check that `demo-app/app.py` now has `yaml.safe_load(f)`.
- Check that `demo-app/requirements.txt` now has an upgraded pyyaml version (e.g., `pyyaml>=6.0.1` or `pyyaml>=5.4` — either is valid, but the installed version must be 6.0+ for the breaking change to trigger).

4.8. Reset and run the pipeline 2 more times (total 3 runs).
- Before each run: `git checkout main`, `git reset --hard`, reinstall `pyyaml==5.3.1`.
- **Why:** 3/3 success confirms the pipeline is deterministic and safe for a live demo. If any run fails, debug and fix before proceeding.

### ✅ Human Verification — Phase 4

```
□ After the pipeline completes:

□ Open demo-app/app.py in a text editor
  → Line with yaml.load(f) should now read yaml.safe_load(f)

□ Open demo-app/requirements.txt
  → pyyaml version should be upgraded (not 5.3.1)

□ Open audit.md in a text editor
  → Has sections: ARCE Audit Trail, CVE, Reachability, Patch, Tests, E2E, Trace
  → CVE section shows CVE-2020-14343 (or whatever pip-audit flagged)
  → Reachability shows "reachable"
  → Test Results show "3 passed"
  → E2E section mentions localhost:5000 verification

□ Open the GitHub PR URL in browser
  → PR exists on your repo
  → PR body contains the full audit.md content
  → PR shows the diff: yaml.load → yaml.safe_load + requirements.txt change

□ Run the pipeline 3 times total → all 3 succeed
  → If yes: pipeline is deterministic. Proceed.
  → If no: debug the failing step before moving on.
```

---

## Phase 5: Streamlit Governance Dashboard

**Goal:** Build a Streamlit app that displays completed ARCE run results and deploy it as the "live demo" URL for judges.

### Steps

5.1. Create `dashboard/requirements.txt` with:
- `streamlit`
- **Where:** `dashboard/requirements.txt`
- **Why:** Needed for Streamlit Community Cloud to install dependencies during deployment.

5.2. Create `dashboard/streamlit_app.py` with:
- Page config: title "ARCE Dashboard", icon "🛡️", wide layout.
- Title: "🛡️ ARCE — Governance Dashboard"
- Subtitle/caption: "Autonomous Remediation & Compliance Engine"
- A "Pipeline Status" section showing 7 columns, one for each pipeline step (Detect, Verify, Patch, Test, Self-Correct, E2E Verify, Govern), each displaying a ✅ metric.
- An "Audit Trail" section that reads and renders `audit.md` as markdown. If `audit.md` doesn't exist, show an info message.
- A "Governed Pull Request" section with a link button pointing to the GitHub PR URL.
- **Where:** `dashboard/streamlit_app.py`
- **Why:** This is the hosted demo URL judges will interact with. It also serves as the "Knowledge Transfer" artifact.

5.3. Copy the `audit.md` file (generated by a successful Phase 4 run) into the `dashboard/` directory.
- **Why:** Streamlit Community Cloud deploys from GitHub. The `audit.md` needs to be committed alongside the dashboard code so the deployed app can read it.

5.4. Test the dashboard locally.
- Run `streamlit run dashboard/streamlit_app.py` from the project root.
- **Why:** Verify it renders correctly before deploying.

5.5. Push the `dashboard/` directory to GitHub.
- `git add dashboard/` and commit.

5.6. Deploy to Streamlit Community Cloud.
- Go to `share.streamlit.io`.
- Sign in with GitHub.
- Click "New app" → select your repo → branch `main` → main file path `dashboard/streamlit_app.py`.
- Click Deploy.
- **Why:** This produces the live URL judges will visit.

5.7. Update the PR link in `streamlit_app.py` to point to the actual GitHub PR URL from a successful ARCE run. Redeploy.

### ✅ Human Verification — Phase 5

```
□ Run: streamlit run dashboard/streamlit_app.py
  → Browser opens automatically
  → Title shows "🛡️ ARCE — Governance Dashboard"
  → Pipeline Status row shows 7 green checkmarks
  → Audit Trail section displays the full audit.md content
  → "View PR on GitHub" button links to the actual PR

□ After Streamlit Cloud deploy:
  → Visit the generated URL (e.g., your-app.streamlit.app)
  → Same content appears as the local version
  → Page loads in under 5 seconds
  → Share the URL with a friend → they can access it (it's public)
```

---

## Phase 6: GitHub README & Project Polish

**Goal:** Write the public-facing README and ensure the repo is submission-ready.

### Steps

6.1. Create `README.md` at the project root with:
- Project title: ARCE — Autonomous Remediation & Compliance Engine
- The differentiation statement from PRD Section 13 as the opening line.
- A "What it does" section explaining the 9-step pipeline in plain English.
- An architecture diagram (copy the ASCII art from PRD Section 3.1).
- A "Tech Stack" section listing all components and noting $0 total cost.
- A "How to Run" section with step-by-step commands (activate venv, install deps, run pip-audit, trigger Bob).
- A "Demo" section with a link to the Streamlit dashboard URL.
- A link to the exported IBM Bob report (next step).
- **Where:** `ARCE/README.md`
- **Why:** Required submission deliverable. Judges read this first.

6.2. Export the IBM Bob task report.
- Run `bob export --all --format markdown --output ./bob-report/` (or manually copy from `%AppData%\...\tasks\`).
- Commit the exported report into the repo under `bob-report/`.
- **Why:** Lablab.ai requires "an exported IBM Bob report of all relevant tasks/sessions." This is a mandatory submission item.

6.3. Do a final `git add -A`, `git commit`, `git push` to ensure everything is on GitHub.

6.4. Verify the GitHub repo is set to **Public** (Settings → General → Danger Zone → Visibility).

### ✅ Human Verification — Phase 6

```
□ Open your GitHub repo URL in a browser
  → README.md renders with title, architecture diagram, and all sections
  → bob-report/ folder exists with exported markdown files
  → Repo is Public (visible without login)
  → All source code is present: demo-app/, arce/, dashboard/, .bob/
```

---

## Phase Summary & Dependency Chain

```
Phase 0 (Scaffolding)
   │
   ▼
Phase 1 (Demo App)      ← Can be verified standalone
   │
   ▼
Phase 2 (MCP Server)    ← Can be verified standalone (unit tests)
   │
   ▼
Phase 3 (Bob Config)    ← Requires Phase 2 (MCP server must exist)
   │
   ▼
Phase 4 (Integration)   ← Requires ALL previous phases + GitHub remote
   │
   ▼
Phase 5 (Dashboard)     ← Requires Phase 4 (needs audit.md from a real run)
   │
   ▼
Phase 6 (README/Polish) ← Requires Phase 5 (needs dashboard URL)
```

**Critical path:** Phases 0→1→2 can be built without IBM Bob access. Phase 3 onwards requires Bob. If Bob access is delayed, build Phases 0–2 first.

---

## LLM Execution Safety Notes

These are traps that will silently break the build if an LLM misses them:

1. **FastMCP decorator is `@mcp.tool` NOT `@mcp.tool()`** — no parentheses. Using parentheses will cause a registration error.
2. **Every MCP tool must have a try/except block** — if a tool raises an unhandled exception, the entire MCP server connection dies and Bob can't recover.
3. **`subprocess.run` on Windows needs `shell=True` for commands like `pip install`** — without it, Windows may fail to find the command.
4. **The `&` background operator does NOT work in PowerShell** — Bob must use `Start-Process` to start the Flask app in the background before Playwright verification.
5. **pip-audit flags CVE-2020-14343 for pyyaml==5.3.1, NOT CVE-2020-1747** — the earlier PRD drafts had the wrong CVE. Use whatever CVE ID pip-audit actually outputs.
6. **pip-audit recommends `>=5.4` as the fix, but the breaking change is in 6.0+** — the custom mode instructions must tell Bob to upgrade to the LATEST version, not just the minimum fix.
7. **All file paths in MCP tools should use `pathlib.Path`** — avoids Windows backslash vs Unix forward-slash issues.
8. **`run_tests` must set `cwd` parameter** — if Bob runs from the project root but tests are in `demo-app/tests/`, the working directory matters. Pass `cwd="demo-app"` to `subprocess.run`.

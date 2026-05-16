Let me read the relevant code first so the plan references the right files and functions.

# ARCE Enhancement Implementation Plan

**Audience:** Coding agent / junior developer executing one step at a time.
**Scope:** Implement the Tier 1 + select Tier 2 enhancements identified in the analysis. The Bob session export (`bob-report/`) is **out of scope** — the user is handling it.
**Prerequisites:** Working venv, MCP servers configured, demo-app vulnerability + tests pass on fix as documented in `README.md`.

---

## Assumptions and Open Questions

Before execution, treat these as ground truth unless the user corrects them. Each step that depends on one of these will reference it.

1. **A1 — Run history location:** All run artifacts live under `runs/<run_id>/` at the repo root. `<run_id>` is `YYYYMMDD-HHMMSS-<cve_id>`.
2. **A2 — `audit.md` semantics:** The top-level `audit.md` continues to be the *latest* run's audit (overwritten each run). The historical copy lives at `runs/<run_id>/audit.md`. Do not break existing behavior; add the per-run copy.
3. **A3 — Second CVE scenario** uses a **separate folder** `demo-app-jinja/` rather than a config flag on `demo-app/`. This keeps the original demo untouched and lets judges see two distinct remediation shapes.
4. **A4 — Policy engine** is enforced by the agent (the custom mode reads `policy.yaml` and decides), not by silently blocking tools. The `evaluate_policy` tool returns a verdict; the agent acts on it.
5. **A5 — Honest-failure scenario** is triggered by a third demo folder `demo-app-unfixable/` where self-correction cannot succeed within 3 attempts.
6. **A6 — Streamlit dashboard** reads from `runs/` on disk. No database. No live websockets. Auto-refresh is acceptable.
7. **A7 — SBOM format:** CycloneDX JSON via `cyclonedx-bom` Python package.
8. **A8 — Out of scope:** `bob-report/` export (user-owned), multi-language support, CI/CD pipelines, authentication, deployment beyond Streamlit Community Cloud.

**Open question to flag if you encounter it:** if `pip-audit` does not flag the second CVE on the user's machine due to OSV.dev cache differences, halt and ask for a different CVE selection rather than guessing.

---

## Phase 0 — Project Setup & Conventions

**Goal:** Establish directory layout, schemas, and shared utilities every later phase depends on.

1. Create the directory `runs/` at the repo root. Add a `.gitkeep` file inside so the directory is tracked but contents are ignored.
2. Append `runs/*/` to `.gitignore` (keep the directory, ignore per-run subfolders) so demo runs don't pollute version control.
3. Create `arce/schemas/` directory.
4. Inside `arce/schemas/`, create `run_record.schema.json`. This is a JSON Schema document describing the run record shape with these fields: `run_id` (string), `cve_id` (string), `package` (string with `name` and `version_before`/`version_after`), `reachability` (enum: `reachable`, `imported-but-unused`, `not-imported`), `cvss_before` (number), `cvss_after` (number, defaults to 0.0 when patched), `started_at` (ISO timestamp), `ended_at` (ISO timestamp, nullable), `mttr_seconds` (number, nullable), `status` (enum: `running`, `succeeded`, `halted`, `failed`), `self_correction_attempts` (integer), `tests` (object with `before` and `after` each containing `passed`/`failed`/`stdout`), `policy_verdict` (string), `pr_url` (string, nullable), `sbom_path` (string, nullable). Document each field with a one-line `description`.
5. Create `arce/run_io.py`. This module is responsible for run-record I/O. Do not implement business logic here. It exposes: `start_run(cve_id) -> run_id`, `update_run(run_id, **fields)`, `finalize_run(run_id, status)`, `read_run(run_id)`, `list_runs() -> list[dict]`. Implementation is JSON file read/write under `runs/<run_id>/run.json`. *Why:* every later phase writes through this single module so the schema stays consistent.
6. Create `arce/policy/` directory. Create `arce/policy/default_policy.yaml` with three sections: `auto_remediate` (list of severities and a `reachable_only` boolean), `require_approval` (list of severities), `skip` (list of severities and a `reachable` filter). Use the example shape from the analysis document. *Why:* later phases will load this; having the file first removes cyclic dependencies.
7. Create `arce/policy/__init__.py` (empty) so the directory is a package.
8. Verify Phase 0 by running `python -c "from arce.run_io import start_run; print(start_run('TEST-0000'))"` — it should print a `run_id` and create `runs/<run_id>/run.json`. Delete the test directory afterward.

---

## Phase 1 — Run Recording Layer (Instrument the MCP Tools)

**Goal:** Every existing MCP tool writes structured data to the active run. Without this layer, the dashboard and metrics features have nothing to render.

1. In `arce/mcp_server.py`, add an in-memory module-level variable `_active_run_id: Optional[str] = None`. *Why:* MCP tools are stateless across calls; we need a way to thread the run id through tool invocations without changing every tool signature.
2. Add a new MCP tool `start_pipeline_run(cve_id: str, package_name: str, version_before: str, cvss_before: float) -> str`. It calls `run_io.start_run(...)`, sets `_active_run_id`, and returns the `run_id`. The agent will call this *first* before any other tool.
3. Add a new MCP tool `end_pipeline_run(status: str) -> str`. It calls `run_io.finalize_run(...)`, clears `_active_run_id`, and returns a confirmation string. Valid statuses: `succeeded`, `halted`, `failed`.
4. Modify `check_reachability` to, after computing the verdict, call `run_io.update_run(_active_run_id, reachability=<verdict>)` if `_active_run_id` is set. Do not change the return value or the existing logic.
5. Modify `run_tests` to, after each invocation, call `run_io.update_run` with a `tests` payload. The first call writes to `tests.before`; subsequent calls write to `tests.after` and increment `self_correction_attempts`. Use a counter stored on the run record itself, not in memory. *Why:* makes the self-correction count visible in the audit trail and dashboard.
6. Modify `generate_audit_trail` to, when `_active_run_id` is set, additionally write a copy of `audit.md` to `runs/<run_id>/audit.md` and call `run_io.update_run` with `audit_path=<path>`. Do not change the existing top-level `audit.md` write. *Why:* preserves history while keeping the demo's "open audit.md" muscle memory.
7. Modify `create_governed_pr` to, on success, call `run_io.update_run(_active_run_id, pr_url=<url>)`. On failure, do not update.
8. Update `.bob/mcp.json` `alwaysAllow` list for `arce-tools` to include `start_pipeline_run` and `end_pipeline_run`.
9. Update `.bob/custom_modes.yaml` `customInstructions` so step 1 of the pipeline now reads: "Invoke `start_pipeline_run` with the CVE id, package name, vulnerable version, and CVSS score from the pip-audit JSON. Capture the returned `run_id`." Add a final step: "Invoke `end_pipeline_run` with status `succeeded` if the PR was created, `halted` if self-correction limit reached, or `failed` for any other terminal error." Renumber existing steps accordingly.
10. Verify Phase 1 by manually triggering each tool from a Python REPL with `_active_run_id` set, and confirm `runs/<run_id>/run.json` updates correctly. Do not require Bob for this verification.

---

## Phase 2 — Live Metrics: MTTR, CVSS Delta, Self-Correction Count

**Goal:** Make impact measurable. These metrics must appear in the audit trail and on the dashboard.

1. Add a function `compute_metrics(run_record: dict) -> dict` to `arce/run_io.py`. It returns `{"mttr_seconds": ..., "mttr_human": "Xm Ys", "cvss_delta": ..., "self_correction_attempts": ...}` derived from the existing fields. Handle nulls gracefully.
2. Modify `run_io.finalize_run` to compute and store `mttr_seconds` (= `ended_at - started_at` in seconds) on the run record before writing.
3. Modify `generate_audit_trail` in `arce/mcp_server.py`: when `_active_run_id` is set, read the run record, call `compute_metrics`, and inject a new "Impact Metrics" section near the top of `audit.md`. The section should include: MTTR (human-readable), CVSS before → after, self-correction attempts, reachability verdict. Place it directly under the `## Executive Summary` section.
4. If no `_active_run_id`, skip the Impact Metrics section silently. *Why:* keeps the tool callable in non-pipeline contexts.
5. Update the function signature of `generate_audit_trail` to optionally accept `cvss_before: float = None` and `cvss_after: float = 0.0` so the agent can pass these through directly without round-tripping. Pass these through to `run_io.update_run` as well.
6. Verify Phase 2 by creating a synthetic run record on disk with all fields populated, calling `generate_audit_trail` with that run active, and confirming the generated `audit.md` contains a correctly formatted "Impact Metrics" block.

---

## Phase 3 — Policy Engine

**Goal:** Add severity-aware policy gating. The agent calls `evaluate_policy` and reasons about the verdict before patching.

1. Create `arce/policy/engine.py`. Implement a single function `evaluate(severity: str, reachability: str, policy_path: str = "arce/policy/default_policy.yaml") -> dict`. Return shape: `{"action": "auto_remediate" | "require_approval" | "skip", "reason": "<human-readable>"}`. Do not raise on unknown severity; return `{"action": "require_approval", "reason": "unknown severity"}`.
2. Add unit-style sanity at the bottom of `engine.py` under `if __name__ == "__main__":` exercising at least 4 cases (critical+reachable, medium+reachable, low+not-imported, unknown). *Why:* lets a junior dev verify the function without standing up MCP.
3. Add a new MCP tool `evaluate_policy(severity: str, reachability: str) -> str` in `arce/mcp_server.py` that wraps `engine.evaluate` and returns the JSON-serialized verdict. Include the verdict in the active run record under `policy_verdict`.
4. Add `evaluate_policy` to `.bob/mcp.json` `alwaysAllow`.
5. Update `.bob/custom_modes.yaml` `customInstructions` to insert a new step between "check_reachability" and "patch dependency": "Invoke `evaluate_policy` with the CVE severity and reachability verdict. If the action is `skip`, log the reason in the audit trail and call `end_pipeline_run` with status `succeeded`. If `require_approval`, halt and write the verdict to the audit trail. If `auto_remediate`, proceed with patching." Renumber subsequent steps.
6. Modify `generate_audit_trail` to include a "Policy Decision" section above "Patch Applied" that displays the policy verdict and reason from the run record.
7. Verify Phase 3 by directly invoking `evaluate_policy("critical", "reachable")` (expect `auto_remediate`) and `evaluate_policy("low", "not-imported")` (expect `skip`).

---

## Phase 4 — Second CVE Scenario (`demo-app-jinja/`)

**Goal:** Eliminate the "one-trick pony" objection. A second target with a different remediation shape proves the pipeline is general.

> **Pre-step verification:** Before starting Phase 4, run `pip-audit -r demo-app/requirements.txt` to confirm baseline still flags CVE-2020-14343. If not, halt and notify the user.

1. Create directory `demo-app-jinja/` with subdirectory `tests/`.
2. Create `demo-app-jinja/requirements.txt` pinning a version of `jinja2` flagged by pip-audit's current OSV mirror. Start with `jinja2==3.1.2` (CVE-2024-22195). Also pin `flask==3.0.0`, `pytest==8.0.0`, `markupsafe==2.1.3`. *Why:* deterministic dependency set across machines.
3. **Verification gate:** Run `python -m pip_audit -r demo-app-jinja/requirements.txt`. If `jinja2==3.1.2` is *not* flagged, halt and ask the user to confirm a different version (e.g., `3.1.3`) or different CVE. Do not silently change the version.
4. Create `demo-app-jinja/app.py`: a Flask app with a `/render` endpoint that uses `jinja2.Environment` to render a template attribute. Make the route call `xmlattr` filter on user-provided attribute keys (this is the vulnerable path for CVE-2024-22195). Use `os.path.dirname(os.path.abspath(__file__))` for any file paths to match the fix already applied in `demo-app/app.py`.
5. Create `demo-app-jinja/tests/__init__.py` (empty).
6. Create `demo-app-jinja/tests/test_app.py` with three tests: a health check, a baseline render check, and an attribute-injection check that asserts the injected key is sanitized. The third test must fail before the patch and pass after the patch. *Why:* proves the patch worked without relying on test count alone.
7. Create `demo-app-jinja/templates/render.html` if templates are needed for the test. Keep it minimal.
8. Update `arce/mcp_server.py`: confirm `check_reachability` works on `demo-app-jinja/`. Run `check_reachability("jinja2", "demo-app-jinja")` from a Python REPL and verify the result is `reachable`.
9. Update `arce/mcp_server.py` `run_tests` so the `cwd` is parameterizable. Currently it is hardcoded to `demo-app`. Refactor to accept `project_dir: str = "demo-app"`. Update the docstring. Update `.bob/custom_modes.yaml` to mention the new parameter.
10. Update `.bob/mcp.json` `alwaysAllow` if any tool name changed (it should not).
11. Update `README.md` `## 🎬 Demo` section to add a "Scenario B: Jinja2 Template Injection" subsection with the trigger prompt the user pastes into Bob.
12. Verify Phase 4 by running `pytest demo-app-jinja/tests/ -v` from the repo root — expect 1 fail (the injection test). After applying the manual fix to `demo-app-jinja/app.py`, expect all 3 to pass. Document this baseline in a comment at the top of `demo-app-jinja/app.py`.

---

## Phase 5 — SBOM Generation

**Goal:** Attach a CycloneDX SBOM to the audit trail and PR. Free credibility for compliance-minded judges.

1. Add `cyclonedx-bom` to the project's dev dependencies. Document the install command in `README.md` under setup. Do not modify `demo-app/requirements.txt`.
2. Add a new MCP tool `generate_sbom(project_dir: str) -> str` to `arce/mcp_server.py`. It runs `python -m cyclonedx_py requirements <project_dir>/requirements.txt -o <project_dir>/sbom.json` via subprocess. Capture stdout/stderr. Return the absolute path of the produced `sbom.json` or an error string.
3. If `_active_run_id` is set, copy the produced SBOM to `runs/<run_id>/sbom.json` and call `run_io.update_run(_active_run_id, sbom_path=<path>)`.
4. Add `generate_sbom` to `.bob/mcp.json` `alwaysAllow`.
5. Update `.bob/custom_modes.yaml` `customInstructions` to insert a step between "tests pass" and "E2E verification": "Invoke `generate_sbom` with the project directory to produce a CycloneDX SBOM."
6. Modify `generate_audit_trail` to append an "SBOM" section after "E2E Verification" that links to the SBOM file (`runs/<run_id>/sbom.json`) when present.
7. Modify `create_governed_pr` to detect `runs/<run_id>/sbom.json` and `git add` it before commit. *Why:* SBOM should ride along with the PR.
8. Verify Phase 5 by running `generate_sbom("demo-app")` directly and confirming `demo-app/sbom.json` is valid JSON conforming to CycloneDX 1.4+ (`bomFormat: "CycloneDX"` field present).

---

## Phase 6 —cancelled, skip this phase .

---

## Phase 7 — Streamlit Dashboard Rewrite (Real Data)

**Goal:** Replace the cosmetic dashboard with one that reads `runs/` from disk. The fake `lodash`/`axios` data must go.

1. In `dashboard/`, create a new module `dashboard/data_loader.py` with three functions: `load_all_runs() -> pd.DataFrame` (reads every `runs/*/run.json`), `load_run(run_id) -> dict`, `load_audit_md(run_id) -> str`. Handle missing files gracefully with empty returns. *Why:* isolating disk I/O makes the Streamlit code testable and refresh-friendly.
2. Refactor `dashboard/streamlit_app.py`. Remove all hardcoded sample dataframes (`vuln_data`, `repo_data`, `vuln_details`, `reasoning_steps`). Keep the CSS, page config, and sidebar navigation.
3. Rewrite the "📊 Overview" page to render KPIs computed from `load_all_runs()`: total runs, succeeded count, halted count, average MTTR (formatted), aggregate CVSS reduction, self-correction success rate. If no runs exist, show an "Awaiting first run…" empty state — do not show fake numbers.
4. Replace the "REMEDIATION - 14D" chart with a real chart of MTTR per run over time, plotted from `load_all_runs()`. Sort by `started_at`. Use the run id on the x-axis if dates are sparse.
5. Replace the "SEVERITY BREAKDOWN" with a count of runs grouped by `policy_verdict` action (auto_remediate vs require_approval vs skip).
6. Rewrite the "VULNERABILITY EXPLORER" table to render columns from real run records: `run_id`, `cve_id`, `package`, `reachability`, `cvss_before`, `cvss_after`, `mttr_human`, `status`, `pr_url`. Make the run_id a clickable link that sets a query param navigating to a run detail view.
7. Add a new sidebar entry "🏃 Run Detail" that, when a run is selected, displays the full run record, the run's `audit.md`, a download link for the SBOM (if present), and a link to the PR.
8. Rewrite "📋 Audit Reports" to list all `runs/*/audit.md` with a selector. The currently selected run's audit displays inline. Keep the download button.
9. Rewrite "🤖 AI Reasoning" to display the *actual* sequence of MCP tool invocations for the selected run. **If the run record does not contain a tool-call timeline, omit this view rather than fabricating one.** Add a "Coming soon" message and a TODO comment in the code referencing the optional Phase 9.
10. Remove the "🔧 PR Review" page entirely or convert it into a thin link to the actual GitHub PR URL from the latest succeeded run. Do not retain fake PR numbers like `#4127`.
11. Remove all references to fictional repos (`acme/payments`, etc.) from the "⚙️ Settings" page. Replace `monitored repositories` multi-select with a read-only display of detected demo-app folders (`demo-app/`, `demo-app-jinja/`, `demo-app-unfixable/`).
12. Add an `st.button("🔄 Refresh")` at the top of the Overview page that calls `st.rerun()`. *Why:* judges want to see new runs reflected immediately.
13. Update `dashboard/requirements.txt` to pin versions: `streamlit>=1.36`, `plotly>=5.18`, `pandas>=2.0`, `pyyaml>=6.0`. *Why:* unpinned dependencies cause Community Cloud cold-start surprises.
14. Update `dashboard/README.md` (create if missing) with: prerequisites, local run command, deployment instructions for Streamlit Community Cloud, and a note that the dashboard reads from `../runs/`.
15. Verify Phase 7 by:
    a. Generate a synthetic run record with all fields populated by calling the run_io functions directly.
    b. Run `streamlit run dashboard/streamlit_app.py`.
    c. Confirm Overview KPIs reflect the synthetic record, the table shows it, and the run detail view renders correctly.

---

## Phase 8 — Demo Orchestration & Verification

**Goal:** Pre-flight, smoke-test, and document the demo flow so live runs are deterministic.

1. Create `scripts/reset_demo.ps1`. The script restores `demo-app/` to its vulnerable baseline: re-pins `pyyaml==5.3.1` in `requirements.txt`, reverts `app.py` to the `yaml.load(f)` form (preserving the BASE_DIR fix from Phase 0 of the existing project), runs `pip install -r demo-app/requirements.txt --force-reinstall`, and clears any existing `runs/` directory. *Why:* a one-command reset between rehearsals.
2. Create `scripts/reset_demo_jinja.ps1` (same idea for the jinja scenario).
3. Create `scripts/reset_demo_unfixable.ps1`.
4. Create `scripts/preflight.ps1`. The script:
   - Verifies Python version is 3.10+.
   - Verifies `venv/Scripts/python.exe` exists.
   - Runs `python -m pip_audit -r demo-app/requirements.txt` and asserts CVE-2020-14343 appears in stdout.
   - Runs `python -m pip_audit -r demo-app-jinja/requirements.txt` and asserts the chosen jinja CVE appears.
   - Runs `gh auth status` and asserts logged in.
   - Runs `npx playwright --version` and asserts no error.
   - Verifies all MCP servers in `.bob/mcp.json` resolve to existing executables.
   - Prints a green ✅ block on success or a red ❌ block listing failures.
5. Create `DEMO-SCRIPT.md` at the repo root. Contents:
   - Section 1: 60-second pre-flight checklist (run `preflight.ps1`, open Bob, confirm MCP indicators).
   - Section 2: Scenario A walkthrough — exact prompt to paste into Bob, expected timing per pipeline step, what to point at on screen.
   - Section 3: Scenario B walkthrough (jinja).
   - Section 4: Scenario C walkthrough (honest failure).
   - Section 5: Streamlit dashboard tour — the 3 numbers to land on.
   - Section 6: Recovery playbook — what to do if Bob stalls, Playwright fails, or `gh` errors.
6. Update `README.md` Quick Start to reference `scripts/preflight.ps1` and `DEMO-SCRIPT.md`.
7. Update the `## 🏆 Hackathon Alignment` table in `README.md` with new evidence rows: "Live Metrics", "Policy Engine", "SBOM", "Honest Failure", "Multi-CVE", each pointing at the relevant file or scenario.
8. Verify Phase 8 by running `scripts/preflight.ps1` end-to-end on a fresh shell and confirming the green block.

---

## Phase 9 (Optional, Time-Permitting) — Tool Call Timeline

**Goal:** Capture the agent's tool-invocation sequence per run so the "AI Reasoning" dashboard view becomes real, not stubbed. **Skip this phase if any earlier phase ran long.**

1. In `arce/mcp_server.py`, add a decorator `@record_invocation` that wraps every `@mcp.tool` function. The decorator appends `{"tool": <name>, "args": <args>, "ts": <iso>, "duration_ms": <int>, "result_preview": <first 200 chars>}` to `runs/<run_id>/tool_calls.jsonl` when `_active_run_id` is set.
2. Apply the decorator to all existing MCP tools.
3. Add `tool_calls_path` to the run record schema and `run_io` updates.
4. Wire the Streamlit "🤖 AI Reasoning" page to read `tool_calls.jsonl` line-by-line and render a vertical timeline with phase color codes (reuse the existing `phase_colors` dict).
5. Verify Phase 9 by triggering the pipeline once and confirming `runs/<run_id>/tool_calls.jsonl` is populated and the dashboard renders it.

---

## Execution Order Recap

1. Phase 0 (foundation, ~30 min)
2. Phase 1 (instrumentation, ~1 hr) — **everything else depends on this**
3. Phase 2 (metrics, ~45 min) — **highest judge ROI**
4. Phase 7 (dashboard rewrite, ~2 hr) — second-highest judge ROI; do this before Phase 3-6 if dashboard time is tight
5. Phase 3 (policy, ~1 hr)
6. Phase 4 (second CVE, ~2 hr)
7. Phase 6 (honest failure, ~1 hr)
8. Phase 5 (SBOM, ~45 min)
9. Phase 8 (demo orchestration, ~1.5 hr) — **must complete before submission**
10. Phase 9 (optional)

If forced to cut: **drop Phase 5 (SBOM) and Phase 9 first**, then Phase 6, then Phase 3. Never drop Phases 0, 1, 2, 7, or 8.

---

## Verification Discipline

After every phase, the executing agent must:

1. Re-run `python -m pytest demo-app/tests/` from the repo root and confirm 3/3 pass (this is the existing baseline; do not break it).
2. Re-run `scripts/preflight.ps1` once it exists.
3. Stage no commits unless the user explicitly requests them.

If any phase produces a regression in the baseline tests, halt and report rather than patching forward.
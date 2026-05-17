/**
 * Single source of truth for all UI data shown by the ARCE frontend.
 *
 * Components must NOT define mock data inline. They import from this
 * module via `src/lib/api.ts`. When the backend is wired up, only
 * `src/lib/api.ts` changes — the literals below remain as fallbacks
 * for offline / Storybook / test rendering.
 */

import type {
  ActivityEvent,
  AuditReport,
  EcosystemCard,
  Feature,
  FooterColumn,
  HeroMetric,
  Kpi,
  NavItem,
  PipelineStep,
  PullRequest,
  ReasoningLine,
  Repository,
  TerminalLine,
} from "./types";

/* ============================================================
 *  MARKETING SITE
 * ============================================================ */

export const NAV_ITEMS: NavItem[] = [
  { label: "Pipeline", href: "#pipeline" },
  { label: "Platform", href: "#platform" },
  { label: "Live Demo", href: "#demo" },
  { label: "Governance", href: "#governance" },
  { label: "Docs", href: "/docs" },
  { label: "Dashboard", href: "/dashboard" },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  { title: "Platform", items: ["Remediation", "Reachability", "Governance", "MCP Server", "CLI"] },
  { title: "Resources", items: ["Documentation", "Changelog", "Security", "API"] },
  { title: "Company", items: ["About", "Customers", "Careers", "Contact"] },
];

export const HERO_METRICS: HeroMetric[] = [
  { label: "Steps", value: "9", sub: "closed loop", tone: "ok" },
  { label: "Self-corr.", value: "1", sub: "ws v8 enum", tone: "ai" },
  { label: "Tests", value: "3/3", sub: "passing", tone: "info" },
];

export const PIPELINE_STEPS: PipelineStep[] = [
  { code: "01", title: "Detect", description: "pip-audit scans dependencies and flags pyyaml==5.3.1 with CVE-2020-14343." },
  { code: "02", title: "Verify Reachability", description: "AST analysis confirms yaml.load() is imported AND called — not just listed." },
  { code: "03", title: "Patch", description: "Bob upgrades pyyaml to the latest stable version in requirements.txt." },
  { code: "04", title: "Test (FAIL)", description: "pytest → TypeError: load() missing 1 required positional argument: 'Loader'." },
  { code: "05", title: "Self-Correct", description: "Bob reasons about the breaking API change and rewrites yaml.load(f) → yaml.safe_load(f)." },
  { code: "06", title: "Test (PASS)", description: "Re-runs pytest → all 3 tests pass. The fix verifies itself." },
  { code: "07", title: "E2E Verify", description: "Starts Flask, drives Playwright against localhost:5000 and /api/health." },
  { code: "08", title: "Generate Audit Trail", description: "Produces audit.md — CVE details, patch diff, test results, agent reasoning." },
  { code: "09", title: "Governed PR", description: "Bob opens a GitHub PR via gh CLI with audit.md as the PR body." },
];

export const FEATURES: Feature[] = [
  { title: "IBM Bob Orchestration", description: "Custom compliance-remediator mode drives the entire 9-step pipeline.", icon: "⚙" },
  { title: "Agentic Self-Correction", description: "Bob reads pytest failures, reasons about breaking APIs, and rewrites the fix.", icon: "✶" },
  { title: "AST Reachability", description: "Confirms the vulnerable package is imported AND called before patching.", icon: "◎" },
  { title: "Playwright E2E Verify", description: "Boots Flask, hits the live endpoint, snapshots proof of working app.", icon: "▶" },
  { title: "Compliance Audit Trail", description: "audit.md with CVE details, patch diff, test results, reasoning trace.", icon: "❖" },
  { title: "Governed GitHub PR", description: "Branch + commit + gh pr create, with audit.md as the PR body.", icon: "⌥" },
  { title: "MCP-Native (×2)", description: "FastMCP server with 4 custom tools + @playwright/mcp for browser checks.", icon: "▣" },
  { title: "$0 Stack", description: "pip-audit · pytest · FastMCP · Playwright · gh CLI · Streamlit — all OSS.", icon: "✓" },
];

export const ECOSYSTEM_CARDS: EcosystemCard[] = [
  { title: "arce-tools (FastMCP)", description: "4 custom tools: check_reachability, run_tests, generate_audit_trail, create_governed_pr.", code: "$ python arce/run_mcp_server.py" },
  { title: "@playwright/mcp", description: "Headless browser MCP. Bob drives Playwright to verify the live app.", code: "$ npx @playwright/mcp@latest" },
  { title: "GitHub CLI", description: "Bob authors the branch, commits, and opens the governed PR via gh.", code: "$ gh pr create --body-file audit.md" },
];

/* ============================================================
 *  LIVE DEMO — TERMINAL STREAM
 * ============================================================ */

export const TERMINAL_SCRIPT: TerminalLine[] = [
  { text: "$ pip-audit --format json -r demo-app/requirements.txt", kind: "cmd", delay: 300 },
  { text: "→ Scanning 14 packages against OSV.dev advisories…", kind: "dim", delay: 700 },
  { text: "! CVE-2020-14343  pyyaml==5.3.1  (CRITICAL · arbitrary code exec)", kind: "err", delay: 800 },
  { text: "→ Handing off to Bob (compliance-remediator mode)…", kind: "dim", delay: 600 },
  { text: "[bob] check_reachability(pyyaml, demo-app/)", kind: "ai", delay: 700 },
  { text: "[bob] AST: yaml imported + yaml.load() called → reachable", kind: "ai", delay: 700 },
  { text: "→ Patching requirements.txt: pyyaml==5.3.1 → 6.0.2", kind: "info", delay: 700 },
  { text: "→ pip install -r demo-app/requirements.txt", kind: "dim", delay: 800 },
  { text: "→ pytest demo-app/tests/", kind: "dim", delay: 700 },
  { text: "✗ test_load_config FAILED · TypeError: load() missing 'Loader'", kind: "err", delay: 900 },
  { text: "[bob] Reasoning about breaking API change in PyYAML 6.x…", kind: "ai", delay: 800 },
  { text: "[bob] Self-correction: yaml.load(f) → yaml.safe_load(f)", kind: "ai", delay: 800 },
  { text: "→ Re-running pytest…", kind: "dim", delay: 700 },
  { text: "✓ 3 / 3 tests passing", kind: "ok", delay: 600 },
  { text: "[bob] Playwright → GET http://localhost:5000/api/health · 200 OK", kind: "ai", delay: 700 },
  { text: "→ generate_audit_trail(CVE-2020-14343)", kind: "info", delay: 600 },
  { text: "→ create_governed_pr → gh pr create", kind: "info", delay: 700 },
  { text: "✓ PR #2 opened with audit.md as PR body", kind: "ok", delay: 700 },
  { text: "$ _", kind: "cmd", delay: 800 },
];

export const LIVE_DEMO_STATS: HeroMetric[] = [
  { label: "CVEs detected", value: "2", tone: "err", sub: "HIGH + CRITICAL, both reachable" },
  { label: "AI self-corrections", value: "1", tone: "ai", sub: "ws v8 enum import → patched" },
  { label: "Tests after fix", value: "1284 / 1284", tone: "ok", sub: "Re-ran full suite in 41s" },
  { label: "Mean time to PR", value: "86s", tone: "ok", sub: "From detect → governed PR" },
];

/* ============================================================
 *  DASHBOARD / CONSOLE
 * ============================================================ */

export const KPIS: Kpi[] = [
  { label: "Security Score", value: "94", delta: "+6.2", spark: [70, 72, 75, 78, 82, 88, 94] },
  { label: "Open Critical", value: "0", delta: "−3", spark: [3, 3, 2, 2, 1, 1, 0] },
  { label: "Auto-Patched (24h)", value: "38", delta: "+12", spark: [12, 18, 22, 28, 30, 34, 38] },
  { label: "AI Success", value: "99.4%", delta: "+0.3%", spark: [96, 97, 97, 98, 98, 99, 99.4] },
];

export const REPOSITORIES: Repository[] = [
  { name: "acme/payments-api", score: 94, severityMix: "0 / 3 / 12", status: "2m ago", tone: "ok" },
  { name: "acme/web-shop", score: 88, severityMix: "0 / 1 / 9", status: "8m ago", tone: "ok" },
  { name: "acme/internal-tools", score: 71, severityMix: "1 / 4 / 22", status: "ai correcting", tone: "ai" },
  { name: "acme/data-warehouse", score: 82, severityMix: "0 / 2 / 7", status: "scanning", tone: "info" },
  { name: "acme/legacy-cms", score: 54, severityMix: "3 / 8 / 31", status: "needs review", tone: "err" },
  { name: "acme/auth-gateway", score: 96, severityMix: "0 / 0 / 4", status: "12m ago", tone: "ok" },
];

export const ACTIVITY_FEED: ActivityEvent[] = [
  { text: "PR #1428 opened · ws@8.18.0", ago: "2s", tone: "ok" },
  { text: "Self-correction applied to acme/internal-tools", ago: "9s", tone: "ai" },
  { text: "Tests passed · 1,284 / 1,284", ago: "14s", tone: "ok" },
  { text: "CVE-2024-48817 detected in acme/legacy-cms", ago: "31s", tone: "err" },
  { text: "Reachability scan started", ago: "1m", tone: "info" },
  { text: "PR #1427 merged by @sara", ago: "3m", tone: "ok" },
  { text: "Audit package signed · sha256:9f4e…", ago: "5m", tone: "info" },
];

/** Pool of events appended by the live-streaming dashboard widget. */
export const ACTIVITY_POOL: ActivityEvent[] = [
  { text: "AI patch confidence 0.97", ago: "now", tone: "ai" },
  { text: "Targeted exploit test green", ago: "now", tone: "ok" },
  { text: "Dependency graph rebuilt", ago: "now", tone: "info" },
  { text: "New advisory ingested · GHSA-x", ago: "now", tone: "err" },
];

export const REASONING_TRACE: ReasoningLine[] = [
  { tag: "[plan]", text: "Upgrade ws → 8.18.0", tone: "ai" },
  { tag: "", text: "    impact: src/auth/session.ts (1 import)", tone: "info" },
  { tag: "[fail]", text: "enum RECEIVER_OPCODE removed in v8", tone: "err" },
  { tag: "[think]", text: "enum re-exported under constants", tone: "ai" },
  { tag: "[gen]", text: "shim import + alias", tone: "ai" },
  { tag: "[ok]", text: "1,284 / 1,284 passing", tone: "ok" },
  { tag: "", text: "    confidence: 0.97 · risk: LOW", tone: "info" },
];

export const OPEN_PR: PullRequest = {
  repo: "acme/payments-api",
  number: 1428,
  title: "chore(security): patch CVE-2024-37890 + self-corrected ws v8 enum",
  author: "arce-bot",
  filesChanged: 4,
  additions: 37,
  deletions: 18,
  testsPassed: "1,284 / 1,284",
  regressions: 0,
  risk: "LOW",
  url: "#",
  diff: [
    { sign: "-", path: "src/auth/session.ts", text: 'import { RECEIVER_OPCODE } from "ws";' },
    { sign: "+", path: "src/auth/session.ts", text: 'import { constants as W } from "ws";' },
    { sign: "+", path: "src/auth/session.ts", text: "const RECEIVER_OPCODE = W.RECEIVER_OPCODE;" },
  ],
};

/* ============================================================
 *  GOVERNANCE — DEMO AUDIT REPORT
 * ============================================================ */

export const DEMO_AUDIT: AuditReport = {
  cve: "CVE-2020-14343",
  package: { name: "pyyaml", from: "5.3.1", to: "6.0.2" },
  severity: "CRITICAL · arbitrary code execution",
  reachable: true,
  reasoning: [
    "Upgrade broke test_load_config",
    "Diagnosed PyYAML 6.x breaking API (Loader required)",
    "Self-corrected yaml.load → yaml.safe_load",
    "Re-ran 3 tests → all passing",
    "E2E: GET /api/health → 200 OK",
  ],
  signoff: {
    agent: "bob/compliance-remediator",
    pipeline: "arce/v1 · 9 steps · closed loop",
  },
};

/* ============================================================
 *  HOMEPAGE — HERO BOB ACTIVITY
 * ============================================================ */

export const BOB_ACTIVITY: { text: string; ago: string }[] = [
  { text: "patched pyyaml→6.0.2", ago: "2s" },
  { text: "self-corrected yaml.load", ago: "9s" },
  { text: "opened PR #2", ago: "14s" },
];

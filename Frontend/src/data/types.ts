/**
 * Shared types for ARCE UI data.
 *
 * These are the contracts the backend must satisfy. Every adapter in
 * `src/lib/api.ts` returns one of these shapes. UI components import
 * data through that adapter and never construct domain objects inline.
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type Tone = "ok" | "err" | "ai" | "info" | "warn";

/* ---------- Marketing site ---------- */

export interface PipelineStep {
  /** Two-digit ordinal, e.g. "01" */
  code: string;
  title: string;
  description: string;
}

export interface Feature {
  title: string;
  description: string;
  /** Single glyph used in the icon tile */
  icon: string;
}

export interface EcosystemCard {
  title: string;
  description: string;
  /** Short shell snippet shown beneath the description */
  code: string;
}

export interface NavItem {
  label: string;
  /** Either an in-page hash (#pipeline) or an app route (/docs) */
  href: string;
}

export interface FooterColumn {
  title: string;
  items: string[];
}

/* ---------- Terminal stream ---------- */

export type TerminalLineKind =
  | "info"
  | "warn"
  | "err"
  | "ok"
  | "ai"
  | "dim"
  | "cmd";

export interface TerminalLine {
  text: string;
  kind?: TerminalLineKind;
  /** Delay before the next line is appended, in ms */
  delay?: number;
}

/* ---------- Dashboard / Console ---------- */

export interface Kpi {
  label: string;
  value: string;
  /** Signed delta string, e.g. "+6.2" or "-3" */
  delta: string;
  /** 7-day sparkline series (numeric) */
  spark: number[];
  tone?: Tone;
}

export interface Repository {
  name: string;
  /** 0–100 security score */
  score: number;
  /** "critical / high / medium" counts as a display string */
  severityMix: string;
  status: string;
  tone: Tone;
}

export interface ActivityEvent {
  text: string;
  /** Human-readable relative time, e.g. "2s", "1m" */
  ago: string;
  tone: Tone;
}

export interface ReasoningLine {
  /** "[plan]", "[fail]", "[think]", "[gen]", "[ok]" */
  tag: string;
  text: string;
  tone: Tone;
}

export interface PullRequest {
  repo: string;
  number: number;
  title: string;
  author: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  testsPassed: string;
  regressions: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  diff: { sign: "+" | "-"; text: string; path?: string }[];
  url: string;
}

export interface AuditReport {
  cve: string;
  package: { name: string; from: string; to: string };
  severity: string;
  reachable: boolean;
  reasoning: string[];
  signoff: { agent: string; pipeline: string };
}

export interface HeroMetric {
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}

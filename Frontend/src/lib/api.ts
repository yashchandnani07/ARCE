/**
 * Backend adapter layer.
 *
 * This file is the ONLY place the frontend talks to data.
 * UI components import from here, never from `src/data/mock`.
 *
 * Today every function returns the mock fixture defined in
 * `src/data/mock.ts`. To connect a real backend, replace each
 * function body with a `fetch()` against your API and keep the
 * return type identical — the UI requires no further changes.
 *
 * Example backend replacement:
 *
 *   export async function getRepositories(): Promise<Repository[]> {
 *     const res = await fetch(`${API_BASE_URL}/repositories`);
 *     if (!res.ok) throw new Error(`repositories: ${res.status}`);
 *     return (await res.json()) as Repository[];
 *   }
 */

import { API_BASE_URL, HAS_BACKEND } from "@/config";
import {
  ACTIVITY_FEED,
  ACTIVITY_POOL,
  BOB_ACTIVITY,
  DEMO_AUDIT,
  ECOSYSTEM_CARDS,
  FEATURES,
  FOOTER_COLUMNS,
  HERO_METRICS,
  KPIS,
  LIVE_DEMO_STATS,
  NAV_ITEMS,
  OPEN_PR,
  PIPELINE_STEPS,
  REASONING_TRACE,
  REPOSITORIES,
  TERMINAL_SCRIPT,
} from "@/data/mock";
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
} from "@/data/types";

/* ---------- Static / config data (no backend roundtrip needed) ---------- */

export const getNavItems = (): NavItem[] => NAV_ITEMS;
export const getFooterColumns = (): FooterColumn[] => FOOTER_COLUMNS;
export const getPipelineSteps = (): PipelineStep[] => PIPELINE_STEPS;
export const getFeatures = (): Feature[] => FEATURES;
export const getEcosystemCards = (): EcosystemCard[] => ECOSYSTEM_CARDS;
export const getHeroMetrics = (): HeroMetric[] => HERO_METRICS;
export const getLiveDemoStats = (): HeroMetric[] => LIVE_DEMO_STATS;
export const getTerminalScript = (): TerminalLine[] => TERMINAL_SCRIPT;

/* ---------- Live data (backend will be wired here) ----------
 *
 * These are intentionally async so swapping in `fetch()` is a
 * non-breaking change. UI calls them inside effects / loaders.
 */

export async function getKpis(): Promise<Kpi[]> {
  if (!HAS_BACKEND) return KPIS;
  
  const res = await fetch(apiUrl("/api/kpis"));
  if (!res.ok) throw new Error(`kpis: ${res.status}`);
  return (await res.json()) as Kpi[];
}

export async function getRepositories(): Promise<Repository[]> {
  if (!HAS_BACKEND) return REPOSITORIES;
  
  const res = await fetch(apiUrl("/api/repositories"));
  if (!res.ok) throw new Error(`repositories: ${res.status}`);
  return (await res.json()) as Repository[];
}

export async function getActivityFeed(): Promise<ActivityEvent[]> {
  if (!HAS_BACKEND) return ACTIVITY_FEED;
  
  const res = await fetch(apiUrl("/api/activity?limit=10"));
  if (!res.ok) throw new Error(`activity: ${res.status}`);
  return (await res.json()) as ActivityEvent[];
}

export async function getReasoningTrace(prNumber?: number): Promise<ReasoningLine[]> {
  if (!HAS_BACKEND) return REASONING_TRACE;
  
  if (!prNumber) return REASONING_TRACE;
  
  const res = await fetch(apiUrl(`/api/pull-requests/${prNumber}/trace`));
  if (!res.ok) throw new Error(`reasoning trace: ${res.status}`);
  return (await res.json()) as ReasoningLine[];
}

export async function getOpenPullRequest(): Promise<PullRequest> {
  if (!HAS_BACKEND) return OPEN_PR;
  
  const res = await fetch(apiUrl("/api/pull-requests/open"));
  if (!res.ok) throw new Error(`open PR: ${res.status}`);
  return (await res.json()) as PullRequest;
}

export async function getDemoAuditReport(): Promise<AuditReport> {
  if (!HAS_BACKEND) return DEMO_AUDIT;
  
  const res = await fetch(apiUrl("/api/audits/demo"));
  if (!res.ok) throw new Error(`audit report: ${res.status}`);
  return (await res.json()) as AuditReport;
}

export async function getBobActivity(): Promise<{ text: string; ago: string }[]> {
  if (!HAS_BACKEND) return BOB_ACTIVITY;
  
  const res = await fetch(apiUrl("/api/bob/activity"));
  if (!res.ok) throw new Error(`bob activity: ${res.status}`);
  return (await res.json()) as { text: string; ago: string }[];
}

/* ---------- Live streams ---------- */

/**
 * Subscribes to the dashboard activity stream.
 *
 * Returns an unsubscribe function. The current implementation polls a
 * static event pool every 3.5s. Replace with WebSocket / SSE / Supabase
 * realtime subscription against your backend.
 */
export function subscribeActivityStream(
  onEvent: (e: ActivityEvent) => void,
  intervalMs = 3500,
): () => void {
  // TODO(backend): replace with WebSocket / SSE
  const id = setInterval(() => {
    const pick = ACTIVITY_POOL[Math.floor(Math.random() * ACTIVITY_POOL.length)];
    onEvent(pick);
  }, intervalMs);
  return () => clearInterval(id);
}

/* ---------- Helpers ---------- */

/** Returns `${API_BASE_URL}${path}`; throws if backend isn't configured. */
export function apiUrl(path: string): string {
  if (!HAS_BACKEND) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Configure it in .env.local before calling apiUrl().",
    );
  }
  return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

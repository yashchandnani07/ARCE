# ARCE — Frontend Integration Guide

A concise, AI-friendly reference for connecting this frontend to a real
backend. **The single seam you need to modify is `src/lib/api.ts`.** Every
other file consumes data through that adapter.

---

## 1. Project Overview

ARCE is a TanStack Start (React 19 + Vite 7) marketing site and operator
console for an autonomous DevSecOps remediation engine. It is fully static
today — all displayed data comes from typed mock fixtures. To make it live,
replace the bodies of the async functions in `src/lib/api.ts` with `fetch()`
calls against your backend; the UI requires no other changes.

- **Framework**: TanStack Start v1 (file-based routing under `src/routes/`)
- **Build/runtime**: Vite 7, Cloudflare Worker SSR target
- **Styling**: Tailwind v4 + design tokens in `src/styles.css`
- **State/data**: `@tanstack/react-query` is installed and ready to use

---

## 2. Folder Map (what matters)

```
src/
├── config.ts                # Env config + external links (LINKS, API_BASE_URL)
├── data/
│   ├── types.ts             # All domain types (Repository, PullRequest, ...)
│   └── mock.ts              # Mock fixtures — single source of UI data today
├── lib/
│   ├── api.ts               # ← THE BACKEND SEAM. Edit this file.
│   └── utils.ts             # cn() class-name helper
├── components/
│   ├── Nav.tsx, Footer.tsx, Terminal.tsx, MeshBackground.tsx
│   ├── sections/            # Landing-page sections (Hero, Pipeline, …)
│   └── ui/                  # shadcn primitives + splite/spotlight
├── routes/
│   ├── __root.tsx           # HTML shell, fonts, head tags
│   ├── index.tsx            # "/" landing page
│   ├── dashboard.tsx        # "/dashboard" operator console
│   └── docs.tsx             # "/docs" quick-start
├── start.ts, server.ts      # SSR entry + error middleware (do not edit)
└── styles.css               # Design tokens + global styles
```

Auto-generated, do not edit: `src/routeTree.gen.ts`.

---

## 3. Key Components

| Component                           | Role                                       | Reads from `api.ts`                       |
| ----------------------------------- | ------------------------------------------ | ----------------------------------------- |
| `Nav`, `Footer`                     | Site chrome                                | `getNavItems`, `getFooterColumns`         |
| `sections/Hero`                     | Landing hero + 3D Spline background        | `HERO_METRICS`, `BOB_ACTIVITY` (mock)     |
| `sections/Pipeline`                 | 9-step pipeline timeline                   | `getPipelineSteps`                        |
| `sections/Features`                 | 8-card capability grid                     | `getFeatures`                             |
| `sections/LiveDemo` + `Terminal`    | Animated terminal demo                     | `getLiveDemoStats`, `getTerminalScript`   |
| `sections/Ecosystem`                | Architecture diagram + tool cards          | `getEcosystemCards`                       |
| `sections/Governance`               | Audit-report viewer + PR preview           | `DEMO_AUDIT`, `OPEN_PR` (mock)            |
| `sections/DashboardPreview`         | Marketing preview of the console           | local mocks (cosmetic only)               |
| `sections/FinalCTA`                 | Closing call-to-action                     | `LINKS` from `@/config`                   |
| `routes/dashboard.tsx`              | Operator console (KPIs, repos, PR, feed)   | `KPIS`, `REPOSITORIES`, `OPEN_PR`, `getActivityFeed`, `subscribeActivityStream` |

---

## 4. Connection Instructions (for the LLM)

### 4.1 Configure the API base URL

Create `.env.local` at the repo root:

```env
VITE_API_BASE_URL=https://your-backend.example.com
```

`src/config.ts` reads this at build time and exposes:

- `API_BASE_URL: string`
- `HAS_BACKEND: boolean` (true when the env var is non-empty)
- `apiUrl("/repositories")` helper (throws if env var missing)

### 4.2 Replace adapter bodies in `src/lib/api.ts`

Every function returns a typed mock today. Swap each one for a real call.
Return shape must stay identical — UI components are typed against
`src/data/types.ts`.

**Pattern to follow:**

```ts
// BEFORE — returns mock
export async function getRepositories(): Promise<Repository[]> {
  return REPOSITORIES;
}

// AFTER — hits backend
export async function getRepositories(): Promise<Repository[]> {
  const res = await fetch(apiUrl("/repositories"));
  if (!res.ok) throw new Error(`repositories: ${res.status}`);
  return (await res.json()) as Repository[];
}
```

### 4.3 Expected backend endpoints

Suggested REST mapping (rename freely — only `api.ts` needs to know):

| Adapter                       | Suggested endpoint                 | Returns          |
| ----------------------------- | ---------------------------------- | ---------------- |
| `getKpis`                     | `GET /api/kpis`                    | `Kpi[]`          |
| `getRepositories`             | `GET /api/repositories`            | `Repository[]`   |
| `getActivityFeed`             | `GET /api/activity?limit=10`       | `ActivityEvent[]`|
| `getReasoningTrace(prNumber)` | `GET /api/pull-requests/:n/trace`  | `ReasoningLine[]`|
| `getOpenPullRequest`          | `GET /api/pull-requests/open`      | `PullRequest`    |
| `getDemoAuditReport`          | `GET /api/audits/demo`             | `AuditReport`    |
| `getBobActivity`              | `GET /api/bob/activity`            | `{text, ago}[]`  |
| `subscribeActivityStream(cb)` | `WSS /api/activity/stream` (or SSE)| streams `ActivityEvent`|

### 4.4 Replace the polling stream with real-time

`subscribeActivityStream` currently uses `setInterval` over a static event
pool. Replace with a WebSocket / SSE subscription:

```ts
export function subscribeActivityStream(onEvent: (e: ActivityEvent) => void) {
  const ws = new WebSocket(apiUrl("/activity/stream").replace(/^http/, "ws"));
  ws.onmessage = (msg) => onEvent(JSON.parse(msg.data) as ActivityEvent);
  return () => ws.close();
}
```

### 4.5 Auth (if the backend requires it)

The starter does not include auth. When you add it:

1. Persist the token however your backend prefers (httpOnly cookie preferred).
2. Add an `Authorization` header inside `apiUrl()` callers, or wrap fetches
   in a small `apiFetch()` helper that injects the header.
3. For SSR-safe server calls, prefer TanStack Start `createServerFn` — see
   the codebase guidelines.

---

## 5. Conventions

- **Imports use `@/` alias** for `src/` (configured in `vite.config.ts`).
- **Design tokens** live in `src/styles.css` (`--background`, `--neon`,
  `--foreground`, etc.). Never write raw hex/rgb in components.
- **No business logic in components.** Pull from `src/lib/api.ts`.
- **Types only in `src/data/types.ts`.** Don't redeclare locally.
- **shadcn UI** primitives live in `src/components/ui/`. Add new ones via
  the shadcn CLI; don't hand-roll buttons.

---

## 6. Dependencies & Setup

```bash
bun install      # or npm install / pnpm install
bun dev          # vite dev server on http://localhost:5173
bun run build    # production build
```

Key runtime deps: `@tanstack/react-router`, `@tanstack/react-start`,
`@tanstack/react-query`, `framer-motion`, `tailwindcss@4`, `lucide-react`,
`@splinetool/react-spline` (lazy-loaded, desktop only — see `ui/splite.tsx`).

Required env vars (`.env.local`):

| Name                | Required | Purpose                                |
| ------------------- | -------- | -------------------------------------- |
| `VITE_API_BASE_URL` | optional | Backend base URL. Empty → uses mocks.  |

---

## 7. Where NOT to make changes

- `src/routeTree.gen.ts` — auto-generated by `@tanstack/router-plugin`.
- `src/start.ts`, `src/server.ts` — SSR/edge entry, error middleware.
- `src/lib/error-capture.ts`, `src/lib/error-page.ts` — branded error page.
- Anything under `src/components/ui/` (shadcn primitives) — edit via the CLI.

---

## 8. Smoke test after wiring the backend

1. Set `VITE_API_BASE_URL` and restart `bun dev`.
2. Visit `/dashboard` → live activity feed should stream real events.
3. KPIs, repository table, and PR review should reflect backend payloads.
4. Network tab should show requests to your backend, no console errors.

If any UI breaks after wiring, the backend response shape doesn't match
`src/data/types.ts`. Fix the response — never widen the UI types to "any".

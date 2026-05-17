/**
 * Centralized runtime configuration.
 *
 * Single place to read environment-driven settings (API base URL,
 * feature flags) and constant external links shown in the UI.
 *
 * Backend integration: set `VITE_API_BASE_URL` in `.env.local` and
 * any `fetch()` in `src/lib/api.ts` will pick it up automatically.
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

/** Whether the live backend is configured. UI may fall back to mocks when false. */
export const HAS_BACKEND: boolean = API_BASE_URL.length > 0;

export const LINKS = {
  github: "https://github.com/yashchandnani07/ARCE",
  pr: "https://github.com/yashchandnani07/ARCE/pull/2",
  dashboard: "https://github.com/yashchandnani07/ARCE#-live-governance-dashboard",
  bobReport: "https://github.com/yashchandnani07/ARCE/tree/main/bob-report",
  quickStart: "/docs",
} as const;

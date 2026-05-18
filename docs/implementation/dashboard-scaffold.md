# Dashboard Scaffold Implementation

## State

Complete on branch `codex/dashboard-scaffold`.

This slice builds the browsable Phase 0 dashboard overview. It is intentionally placeholder-backed: no bot runtime, Mineflayer connection, backend API, image generation, persistent AI usage logging, OpenAI calls, or WebSocket updates are wired in.

## What is implemented

* Nuxt 3 app scaffold with Nuxt UI, Pinia, TypeScript, pnpm, and dark-mode defaults.
* Desktop-first dashboard shell at `/` with fixed sidebar, top status cards, AI usage strip, bot table, activity feed, active jobs table, SVG world overview, and footer diagnostics.
* Placeholder routes for `/bots`, `/jobs`, `/planner`, `/world`, `/chests`, `/projects`, `/logs`, and `/settings`.
* Pinia mock dashboard store with typed bot, job, event, AI usage, health, world, and diagnostics data.
* Live placeholder `blocksMined` counter initialized in the low thousands and incremented while the overview is open.
* Vue ECharts sparklines for mocked AI usage and cost panels.
* Custom SVG world overview panel with pixel-map styling, route overlays, landmarks, hazards, and survey summary.
* Playwright desktop smoke tests for dashboard regions, dark mode, chart/map rendering, live counter movement, placeholder routes, and narrow desktop sanity.

## Key files

* `pages/index.vue` - dashboard overview page.
* `components/dashboard/*` - dashboard panels and reusable placeholder route component.
* `stores/dashboard.ts` - typed mock state and live counter timer.
* `types/dashboard.ts` - dashboard data types.
* `playwright.config.ts` and `tests/dashboard.spec.ts` - committed smoke tests.
* `docs/design/references/dashboard-overview-ai-usage.png` - visual target used for proximity.

## Verification

Last verified with:

```powershell
corepack pnpm install
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:e2e
```

The Playwright suite captures `test-results/dashboard-overview-desktop.png` for visual review. `test-results/` is intentionally ignored because it is generated output.

## Build warning cleanup

Production build warning cleanup is tracked as maintenance work rather than ignored background noise:

* Nuxt/Vite production sourcemaps are disabled for this dashboard app to avoid upstream Tailwind transform sourcemap warnings.
* The ECharts plugin was removed from Nuxt's global plugin path; `DashboardAiUsagePanel` registers its chart dependencies locally and is lazy-loaded from the overview page.
* Rollup manual chunks split chart dependencies and Nuxt UI/Iconify-related vendor code so the scaffold does not warn on a single oversized client chunk.

If these warnings return, treat that as a maintenance regression and inspect the current Nuxt UI/Iconify/Tailwind dependency graph before marking them harmless.

Nuxt 3.21 still emits Node `DEP0155` trailing-slash package export deprecation warnings from upstream Nuxt/Iconify/Vue packages during the Nitro production build. The latest compatible package checks still show wildcard export maps in those upstream packages, so do not chase this as an app-level issue unless upgrading the Nuxt/UI/Iconify stack.

## Local Nuxt cache cleanup

If `nuxt dev` prints repeated `#app-manifest` pre-transform errors after dependency or generated-file churn, run:

```powershell
corepack pnpm exec nuxt cleanup
corepack pnpm dev --host 127.0.0.1 --port 3000
```

Playwright's configured web server already runs `corepack pnpm exec nuxt cleanup` before starting `pnpm dev`, so routine `corepack pnpm test:e2e` runs should not require a manual cleanup step.

## Deferred work

* Replace mock Pinia data with dashboard API payloads.
* Add real bot service health and status.
* Add real AI usage logging and cost aggregation.
* Add Maphew cartography persistence and generated map data.
* Add real-time updates with WebSockets or server-sent events after a backend service exists.
* Add focused detail pages behind the placeholder routes.

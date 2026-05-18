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

## Known warnings and local cleanup

Production build currently passes with upstream warnings about large chunks, Tailwind sourcemaps, and Node deprecation messages from Nuxt/Iconify dependencies. These are not app failures.

If `nuxt dev` prints repeated `#app-manifest` pre-transform errors after dependency or generated-file churn, run:

```powershell
corepack pnpm exec nuxt cleanup
corepack pnpm dev --host 127.0.0.1 --port 3000
```

## Deferred work

* Replace mock Pinia data with dashboard API payloads.
* Add real bot service health and status.
* Add real AI usage logging and cost aggregation.
* Add Maphew cartography persistence and generated map data.
* Add real-time updates with WebSockets or server-sent events after a backend service exists.
* Add focused detail pages behind the placeholder routes.

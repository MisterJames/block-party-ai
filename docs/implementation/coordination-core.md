# Phase 5 Coordination Core

Phase 5 adds the first working coordination layer for Block Party AI. It turns the Phase 4 lexicon into local state, APIs, dashboard wiring, a planning surface on `/planner`, and an execution queue surface on `/jobs` while keeping all non-Maphew execution simulated.

## What Changed

* Added shared coordination types in `types/coordination.ts` for crew bots, goals, reusable plans, jobs, steps, job requests, templates, greenlight rules, planner proposals, and coordination events.
* Added `server/utils/coordination.ts` as the first JSON/JSONL-backed coordination store.
* Added default Phase 5 seed state for Maphew, Snackwella, Chesterton, AnvilAnnie, Blocko, SpruceLee, CaptainCobble, and Doug.
* Added default job templates for `survey_area`, `fetch_item`, `craft_item`, `farm_food`, `stock_chest`, and `place_blocks`.
* Added conservative default greenlights for Maphew surveying/location-answer work and common simulated logistics work.
* Added seeded jobs for surveying spawn, preparing food for Maphew, fetching starter seeds, and crafting a hoe.
* Added a deterministic reusable "Build foundry" plan seed and deterministic planner proposal drafting. This phase does not call OpenAI to author plans.
* Wired coordination summary, crew queues, active jobs, requests, and recent events into `GET /api/dashboard` and the dashboard Pinia store.
* Replaced the `/planner` placeholder with tabs for deterministic proposal drafting, human goal creation, proposal approval, read-only greenlight policy review, and the existing free-form planner POC.
* Replaced the `/jobs` placeholder with an execution command center for bot queues, job details, steps, requests, concrete job approve/reject/cancel actions, and a compact planning-policy summary.
* Added Snackwella's `PROVISIONS_BOT_NAME` configuration and coordination state paths to environment defaults.

## State Files

By default, coordination state is stored locally under:

```text
state/coordination.json
state/coordination-events.jsonl
```

Tests override those paths with:

```text
test-results/coordination-test.json
test-results/coordination-events-test.jsonl
```

These files are local runtime state and should stay out of git.

## API Surface

Phase 5 adds these coordination endpoints:

```text
GET  /api/coordination
GET  /api/jobs
POST /api/goals
POST /api/planner/proposals
POST /api/proposals/:id/approve
POST /api/proposals/:id/reject
POST /api/jobs/:id/approve
POST /api/jobs/:id/reject
POST /api/jobs/:id/cancel
POST /api/jobs/:id/requests
GET  /api/greenlights
POST /api/greenlights
```

`GET /api/dashboard` now includes a `coordination` payload for overview panels and sidebar health stats.

## Current Behavior

The backend is authoritative for goals, plans, jobs, requests, approval state, greenlight rules, and event history. Minecraft chat remains a future visible announcement layer; it is not the source of truth.

Maphew remains the only real Mineflayer executor. Snackwella, Chesterton, AnvilAnnie, and Blocko now have simulated queues and capabilities so Phase 6 can exercise provisions, chests, tools, crafting, and safe setup before real adapters are added in Phase 7.

Planner proposal drafting is deterministic. The Phase 5 planner can draft known proposal shapes, such as foundry, hoe, and food flows, but it does not call the OpenAI API to invent reusable plans or job templates. Real AI plan authoring remains Phase 9.

The UI boundary is intentional:

* `/planner` owns goal creation, planner proposal drafting, proposal approval, and greenlight policy review.
* `/jobs` owns bot queues, job order visibility, concrete job approval, step progress, blockers, and job requests.
* `/jobs` links back to `/planner` for pending proposals and shows only a compact read-only greenlight summary.

## Verification

Run these commands after coordination changes:

```powershell
corepack pnpm typecheck
$env:NUXT_IGNORE_LOCK='1'; corepack pnpm build
corepack pnpm test:e2e
```

The Phase 5 e2e suite includes `/planner` coverage for drafting and approving a foundry proposal, plus `/jobs` coverage for seeded queues, job details, greenlight summary, and execution-only controls. It captures `test-results/planner-coordination-desktop.png` and `test-results/jobs-coordination-desktop.png`.

Nuxt 3.21 may still emit upstream `DEP0155` trailing-slash export-map warnings during build. Those warnings are tracked in `docs/implementation/dashboard-scaffold.md` and were not introduced by this phase.

During local e2e runs, the Nuxt dev server may also log transient Nuxt Fonts fetch timeouts if font files are not already cached. The Phase 5 test run still passed, and production build downloaded and cached the fonts successfully.

## Follow-Ups

* Phase 6 should add simulated chest and inventory state, item movement, dependency requests, and canned provisions/tooling flows.
* Phase 7 should add real non-digger Mineflayer adapters that consume this coordination state instead of bypassing it.
* Destructive dig, tunnel, chamber, and terrain mutation jobs remain out of scope until Phase 8.
* Real OpenAI reusable plan authoring and AI-drafted template review remain out of scope until Phase 9.

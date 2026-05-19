# Phase 6 Logistics Simulation

Phase 6 adds deterministic simulated logistics for Snackwella, Chesterton, AnvilAnnie, and Blocko while keeping Maphew as the only real Mineflayer executor. It upgrades coordination state to version 2 and keeps structured JSON/JSONL state authoritative.

## What Changed

* `state/coordination.json` now stores version 2 coordination state with nested logistics data: chest registry, bot inventories, reusable recipes, and item movement history.
* Existing version 1 coordination state is migrated on read. Goals, proposals, jobs, templates, greenlights, and events are preserved; missing Phase 6 seed data is merged in.
* Job steps can declare item effects: move, consume, produce, stock, and deliver. Effects are applied only through approved or greenlit simulated job advancement.
* `POST /api/jobs/:id/simulate-step` advances one simulated step, applies item effects, updates job progress, resolves spawned requests, and appends coordination events.
* `GET /api/chests` exposes the logistics command payload for `/chests`; `GET /api/inventories` exposes inventory snapshots.
* `/chests` is now the logistics command center with known chests, selected chest contents, low-stock warnings, bot inventories, recipes, and movement history.
* `/jobs` now shows logistics effects on concrete jobs and exposes a manual `Simulate Step` action for simulated bot jobs.

## Seeded Phase 6 Flows

* Snackwella prepares food for Maphew and depends on Chesterton's seed fetch request.
* Chesterton fetches starter seeds from the Seed Store and delivers them to Snackwella.
* AnvilAnnie can craft a wooden hoe after the concrete job is approved.
* Blocko prepares a safe setup crate with torches and a compass without placing or breaking blocks.

These workflows are simulations only. They prove coordination, queue ownership, item accounting, and request resolution before Phase 7 turns non-digger crew members into real Mineflayer adapters.

## Verification

Commands run for this slice:

```powershell
corepack pnpm typecheck
$env:NUXT_IGNORE_LOCK='1'; corepack pnpm build
corepack pnpm test:e2e
```

Playwright produced refreshed screenshots including:

* `test-results/jobs-coordination-desktop.png`
* `test-results/chests-logistics-desktop.png`
* `test-results/chests-logistics-mobile.png`

The production build completed without large-chunk or Tailwind sourcemap warnings. It still emits the known upstream Nuxt/Iconify/Vue `DEP0155` export-map warnings already tracked in `docs/implementation/dashboard-scaffold.md`.

## Deferred

* Real Snackwella, Chesterton, AnvilAnnie, and Blocko Mineflayer adapters wait for Phase 7.
* Diggers, clear-volume jobs, tunnels, chambers, and destructive terrain mutation wait for Phase 8.
* Real OpenAI reusable plan authoring waits for Phase 9.
* Logistics state is intentionally JSON-backed for now; no database migration is planned in this slice.

# Phase 7 Non-Digger Bot Adapters

Phase 7 adds the first shared real-bot adapter path for Snackwella, Chesterton, AnvilAnnie, and Blocko while keeping destructive work out of scope. The backend remains authoritative for job approval, greenlight enforcement, queue ownership, step state, requests, and item accounting.

## What Changed

* Added `server/utils/non-digger-bots.ts` as the shared adapter contract for the non-digger crew.
* Added real Mineflayer connection support for Snackwella, Chesterton, AnvilAnnie, and Blocko using the existing Minecraft host, port, and auth config.
* Loaded Mineflayer pathfinder with digging disabled for these adapters: no digging, no towers, no parkour, and no free-motion shortcuts.
* Added adapter status to `GET /api/dashboard` and `/api/bots/non-diggers`.
* Added connect/disconnect APIs for the whole non-digger crew and each bot.
* Added `POST /api/bots/non-diggers/:id/execute-step` to let a connected real adapter, or a fallback adapter when no server is available, advance one approved/greenlit non-digger job step through the coordination state machine.
* Added Minecraft chat announcements when real adapters are connected; fallback execution records the same announcements locally.
* Updated `/bots` with a Non-Digger Crew control panel for connection, disconnection, fallback execution, runtime state, and latest announcements.

## Execution Model

Adapters do not bypass the coordination core. They select the next approved or greenlit non-destructive job for their role, reject templates outside their allowed scope, announce the work, optionally path near the job location when connected, and then advance the authoritative job step through the backend.

Current allowed templates:

* Snackwella: `farm_food`
* Chesterton: `fetch_item`, `stock_chest`
* AnvilAnnie: `craft_item`
* Blocko: `safe_zone_setup`

`place_blocks`, digger templates, clear-volume jobs, tunnels, chambers, terrain mutation, and destructive mining remain blocked from this adapter path.

## API Surface

```text
GET  /api/bots/non-diggers
POST /api/bots/non-diggers/connect
POST /api/bots/non-diggers/disconnect
POST /api/bots/non-diggers/:id/connect
POST /api/bots/non-diggers/:id/disconnect
POST /api/bots/non-diggers/:id/execute-step
```

`GET /api/dashboard` now includes `nonDiggerCrew`.

## Verification

Commands run for this slice:

```powershell
corepack pnpm typecheck
$env:NUXT_IGNORE_LOCK='1'; corepack pnpm build
corepack pnpm test:e2e
```

The production build completed without large-chunk or Tailwind sourcemap warnings. It still emits the known upstream Nuxt/Iconify/Vue `DEP0155` export-map warnings already tracked in `docs/implementation/dashboard-scaffold.md`.

Playwright coverage includes:

* `/bots` renders non-digger adapter controls without auto-connecting.
* Fallback adapter execution advances Chesterton's seed job without a Minecraft server.
* `/jobs` and `/chests` still render authoritative coordination/logistics state.
* Mobile `/bots` stays within viewport width.
* The full e2e suite passed with 21 tests.

Screenshots include:

* `test-results/bots-non-digger-desktop.png`
* `test-results/bots-non-digger-mobile.png`

## Deferred

* Physical chest opening, item transfer, crafting-table interaction, planting, harvesting, and block placement are still conservative next steps. This slice proves the shared real-adapter lifecycle and safe authoritative step execution.
* Diggers, destructive mining, tunnel clearing, chamber clearing, and broad terrain mutation remain Phase 8 work.
* Real AI reusable plan authoring remains Phase 9 work.

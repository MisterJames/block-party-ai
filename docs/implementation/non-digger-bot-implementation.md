# Non-Digger Bot Implementation Plan

## State

Planned for Phase 7.

This phase turns the simulated non-digger crew from Phase 6 into real Mineflayer bot adapters while leaving diggers, clear-volume jobs, tunnel work, chamber work, and other destructive terrain mutation for Phase 8.

## Purpose

Phase 7 should prove that the coordination core can safely drive multiple real bots before the project adds destructive digging. The crew should be able to accept jobs, execute tracked steps, raise requests, emit events, and announce progress in Minecraft chat while the backend remains authoritative.

## Shared Bot Adapter Contract

Each real non-digger adapter should support:

* Polling or receiving assigned jobs from the coordination core.
* Accepting jobs it can perform.
* Blocking jobs it cannot perform, with a clear reason and optional job request.
* Executing one tracked step at a time.
* Emitting job events for accepted, running, blocked, completed, failed, and cancelled states.
* Creating job requests for missing food, tools, seeds, materials, locations, or planner support.
* Announcing accepted jobs, blockers, requests, and completions in Minecraft chat.

The backend remains authoritative for queue ownership, step state, greenlight rules, and approval decisions. Minecraft chat is visible flavor and status, not the coordination protocol.

## Role Scope

Phase 7 should implement real low-risk work only:

* Maphew: continue surveys and answer known location/resource questions from survey data.
* Snackwella: farming, food handling, seed requests, and tool requests.
* Chesterton: fetch and deliver items from known chests.
* AnvilAnnie: craft tools and workstations from available materials.
* Blocko: torches, compasses, and safe-zone utility setup within greenlit limits.

Do not implement digger roles, destructive mining, `clearVolume`, tunnel clearing, chamber clearing, large block removals, or broad terrain reshaping in Phase 7.

## Safety Boundaries

All real bot actions must still pass through approved jobs or greenlight rules. Greenlight limits should remain narrow and explicit.

Phase 7 should prefer small, inspectable actions with clear stop conditions. Bots should block and request help instead of improvising when inventory, pathing, recipe, chest, or location context is missing.

## Verification Expectations

Phase 7 should add:

* Bot adapter contract tests.
* Simulated fallback tests when no Minecraft server is configured.
* Real Mineflayer-safe integration checks when local server configuration exists.
* Playwright coverage for real bot state, step progress, requests, chat-announcement history, and blocked states.

Run:

```powershell
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:e2e
```

After meaningful frontend changes, capture desktop and mobile screenshots for `/bots`, `/jobs`, `/chests`, and the overview.

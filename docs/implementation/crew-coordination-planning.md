# Crew Coordination Planning Slice

## State

Complete on branch `feature/crew-coordination-planning`.

This is a docs-only Phase 4 slice. It reshapes the roadmap around crew coordination before adding more real bot execution, destructive digging, or planner automation.

## Lexicon

Use this vocabulary consistently in docs, UI copy, API names, and future implementation work:

* Goal: a desired outcome, such as "craft a hoe," "feed Maphew," or "build a foundry."
* Plan: a reusable collection of jobs that fulfills a goal. A saved "Build a foundry" plan can be reused in another location or world.
* Job: an assignable unit of work for one bot. Jobs always have steps, even when there is only one.
* Step: the smallest tracked action inside a job, such as "place chest," "add 48 iron ore," "craft hoe," or "walk to storage."
* Job Request: a bot-originated request for help, resources, location info, tools, food, or planner support.
* Job Template: a reusable approved job shape, such as `craft_item`, `fetch_item`, `survey_area`, `stock_chest`, or `place_blocks`.
* Greenlight Rule: a human-configured approval policy saying a template or plan can run without repeated approval under defined limits.

## Roadmap Shift

Phase 4 is now the coordination design phase. The next implementation phase should be the coordination core, not digger automation.

The updated order is:

1. Phase 5: Coordination core.
2. Phase 6: Provisions, chests, tools, and safe setup.
3. Phase 7: Non-digger bot implementation.
4. Phase 8: Digger crew.
5. Phase 9: AI planner.
6. Phase 10: Coaster prototype.

This order lets bots request and satisfy resources before they attempt larger destructive or build work.

## Crew Notes

Snackwella joins the planned crew as the Provisions / Farming bot. She is responsible for food, crops, seeds, and farming support. She should be able to request seeds, tools, location info, or item transport from other bots when blocked.

The coordination examples that should guide the next slice:

* Maphew can request food, report known resource locations, and keep surveying under a greenlight rule.
* Snackwella can request seeds from Chesterton and tools from AnvilAnnie or Blocko.
* Chesterton can fetch requested items from known chests or known locations.
* Blocko can support safe-zone setup and low-risk utility crafting such as torches and compasses.
* AnvilAnnie can handle tool and workstation crafting once recipes and resources are available.

## Approval Model

New goals and plans require human approval unless a greenlight rule applies. Bots should not invent major goals like "build a foundry" on their own.

Greenlight rules are intended for repeatable low-risk work with explicit limits. Useful limits include allowed templates, maximum item counts, allowed zones, source/destination chests, maximum block placement or break counts, whether rare materials may be spent, and whether planner/API calls are allowed.

Destructive or spatially risky jobs stay approval-gated unless the human explicitly greenlights a narrow version of that work.

## Planner Model

The planner may propose a plan made of jobs. For example, "Build a foundry" can become a reusable plan with jobs to place walls, place or label chests, stock coal, stock iron ore, and place a crafting table.

If a bot does not know how to fulfill a goal, it may create a planner-support job request. The human approves planner/API dispatch unless a greenlight rule already allows that planner path.

AI-drafted templates must be saved for review and reuse. They are data, not arbitrary generated Mineflayer code.

## Implementation Handoff

The next coding slice should build the coordination core with:

* Local state for goals, plans, jobs, steps, job requests, templates, events, and greenlight rules.
* Job queues grouped by bot.
* Human-created goals and planner-created proposal batches.
* Bot-originated requests that can spawn dependent proposed jobs.
* Greenlight enforcement in the backend, not only the UI.
* Minecraft chat announcements for accepted jobs, blockers, requests, and completions.

Keep Maphew as the only real connected executor until the coordination core exists. Planned crew rows can show queues and requests without pretending those bots can execute Mineflayer actions yet.

Phase 6 should still keep Snackwella, Chesterton, AnvilAnnie, and Blocko simulated. Phase 7 is the point where those non-digger roles become real Mineflayer bot adapters. Diggers and destructive mining remain out of scope until Phase 8.

## Verification

Docs-only verification for this slice:

```powershell
git diff --check
```

No Nuxt build, browser screenshots, or Playwright run are required because this slice does not change runtime code or UI.

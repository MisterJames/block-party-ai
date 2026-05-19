# Block Party AI Project Status

This page is the lightweight completion index for the repo. Update it when a task materially changes the app, workflow, verification surface, or docs.

## Current completed slices

| Slice | State | Branch | Notes |
| --- | --- | --- | --- |
| Phase 7 non-digger bot adapters | Complete | `feature/phase-7-non-digger-bots` | Adds shared real Mineflayer adapter lifecycle, fallback execution, `/bots` controls, and non-digger step execution through coordination state. See `docs/implementation/non-digger-bot-adapters.md`. |
| Phase 6 logistics simulation | Complete | `feature/phase-6-logistics-simulation` | Adds coordination state v2 logistics, simulated item effects, `/chests`, and manual simulated job advancement. See `docs/implementation/logistics-simulation.md`. |
| Planner/jobs boundary cleanup | Complete | `feature/planner-jobs-boundary` | Moves proposal planning and greenlight policy to `/planner`; keeps `/jobs` focused on execution queues and concrete job actions. |
| Phase 5 coordination core | Complete | `feature/coordination-core` | See `docs/implementation/coordination-core.md`. |
| Phase 5-10 non-digger bot roadmap update | Complete | `feature/non-digger-bot-roadmap` | Inserts Phase 7 real non-digger bot implementation before diggers and shifts later phases down. |
| Phase 4 crew coordination planning | Complete | `feature/crew-coordination-planning` | See `docs/implementation/crew-coordination-planning.md`. |
| Phase 3 Maphew site map | Complete | `feature/maphew-site-map` | See `docs/implementation/maphew-site-map.md`. |
| Phase 2 Maphew connection and survey data | Complete | `feature/maphew-survey-data` | See `docs/implementation/maphew-survey-data.md`. |
| Phase 1 AI usage dashboard and planner POC | Complete | `feature/ai-usage-dashboard` | See `docs/implementation/ai-usage-dashboard.md`. |
| Phase 0 dashboard scaffold | Complete | `codex/dashboard-scaffold` | See `docs/implementation/dashboard-scaffold.md`. |
| Builder head site icon | Complete | `feature/site-icon-builder-head` | See `docs/implementation/site-icon-builder-head.md`. |

## Roadmap phase table

| Phase | State | Notes |
| --- | --- | --- |
| Phase 0: Skeleton | Complete | Nuxt dashboard shell, placeholder routes, local UI foundation. |
| Phase 1: AI usage and dashboard framework | Complete | Local JSONL AI usage records, cost summaries, planner POC. |
| Phase 2: Maphew connection and survey data | Complete | Explicit local server controls, Maphew connection APIs, JSONL survey persistence. |
| Phase 3: Maphew site map | Complete | Render survey data as a rough pixelated map with layers and drill-downs. |
| Phase 4: Crew coordination design | Complete | Docs-only lexicon and roadmap shuffle for goals, plans, jobs, steps, requests, templates, greenlight rules, and Snackwella. |
| Phase 5: Coordination core | Complete | JSON/JSONL-backed coordination with `/planner` for goals/proposals/policy and `/jobs` for execution queues, concrete job approvals, steps, blockers, and requests. |
| Phase 6: Provisions, chests, tools, and safe setup | Complete | Simulated Snackwella, Chesterton, AnvilAnnie, and Blocko workflows with chest/inventory state, item effects, recipes, low-stock warnings, and `/chests`. |
| Phase 7: Non-digger bot implementation | Complete | Shared real Mineflayer adapter lifecycle and fallback step execution for Snackwella, Chesterton, AnvilAnnie, and Blocko; physical item/chest/crafting interactions remain conservative follow-up hardening. |
| Phase 8: Digger crew | Unstarted | Digger roles, zone reservations, tunnel jobs, destructive approval gates. |
| Phase 9: AI planner | Unstarted | Reusable plan authoring, AI-drafted template review, structured planning responses, job previews. |
| Phase 10: Coaster prototype | Unstarted | Short tunnel, track placement, detector trigger, tester ride log. |

## Active documentation links

* `docs/design/block-party-ui-guidelines.md` - dashboard visual and component rules.
* `docs/design/references/block-party-ai-dashboard-panels.md` - intended dashboard panels and future backend/API shape.
* `docs/implementation/non-digger-bot-adapters.md` - completed Phase 7 non-digger adapter lifecycle, APIs, UI controls, fallback execution, verification, and deferred physical interactions.
* `docs/implementation/logistics-simulation.md` - completed Phase 6 logistics simulation, state v2 migration, APIs, UI, screenshots, and deferred real-bot work.
* `docs/implementation/coordination-core.md` - completed Phase 5 coordination state, APIs, planner/jobs page boundary, verification, and follow-ups.
* `docs/implementation/crew-coordination-planning.md` - Phase 4 coordination lexicon, roadmap shuffle, approval model, and implementation handoff.
* `docs/implementation/non-digger-bot-implementation.md` - Phase 7 real non-digger bot adapter plan and safety boundaries.
* `docs/implementation/maphew-site-map.md` - completed Phase 3 pixelated survey map, findings sidebar, and interaction notes.
* `docs/implementation/maphew-survey-data.md` - completed Phase 2 Maphew connection, local server controls, survey persistence, and setup notes.
* `docs/implementation/ai-usage-dashboard.md` - completed Phase 1 AI usage persistence, endpoints, dashboard wiring, and pricing notes.
* `docs/implementation/dashboard-scaffold.md` - completed Phase 0 scaffold details, verification, and follow-ups.
* `docs/implementation/site-icon-builder-head.md` - generated builder-head logo and favicon asset notes.

## Documentation maintenance

When completing a task:

1. Update this status page if the task changes project completion state.
2. Add or update a focused implementation note for completed work that future agents need to understand.
3. Link new docs from the nearest existing design, implementation, or status page.
4. Record verification commands, generated screenshots, known warnings, and deferred integrations.

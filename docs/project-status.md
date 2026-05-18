# Block Party AI Project Status

This page is the lightweight completion index for the repo. Update it when a task materially changes the app, workflow, verification surface, or docs.

## Current completed slices

| Slice | State | Branch | Notes |
| --- | --- | --- | --- |
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
| Phase 5: Coordination core | Unstarted | Job manager, reusable plans/templates, bot queues, planner proposals, approval and greenlight enforcement. |
| Phase 6: Provisions, chests, tools, and safe setup | Unstarted | Snackwella provisions/farming, Chesterton stocking, AnvilAnnie tools, Blocko safe-zone and utility crafting workflows. |
| Phase 7: Non-digger bot implementation | Unstarted | Real Mineflayer adapters for Snackwella, Chesterton, AnvilAnnie, Blocko, and safe Maphew coordination; no diggers or destructive mining. |
| Phase 8: Digger crew | Unstarted | Digger roles, zone reservations, tunnel jobs, destructive approval gates. |
| Phase 9: AI planner | Unstarted | Reusable plan authoring, AI-drafted template review, structured planning responses, job previews. |
| Phase 10: Coaster prototype | Unstarted | Short tunnel, track placement, detector trigger, tester ride log. |

## Active documentation links

* `docs/design/block-party-ui-guidelines.md` - dashboard visual and component rules.
* `docs/design/references/block-party-ai-dashboard-panels.md` - intended dashboard panels and future backend/API shape.
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

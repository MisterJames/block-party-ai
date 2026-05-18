# Block Party AI Project Status

This page is the lightweight completion index for the repo. Update it when a task materially changes the app, workflow, verification surface, or docs.

## Current completed slices

| Slice | State | Branch | Notes |
| --- | --- | --- | --- |
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
| Phase 3: Maphew site map | Unstarted | Render survey data as a rough pixelated map with layers and drill-downs. |
| Phase 4: Digger crew | Unstarted | Digger roles, zone reservations, tunnel jobs, destructive approval gates. |
| Phase 5: Chests, tools, blacksmith, and stocker | Unstarted | Chest registry, inventory summaries, crafting, furnace and restocking jobs. |
| Phase 6: AI planner | Unstarted | Structured planning responses, job previews, and approval workflow. |
| Phase 7: Coaster prototype | Unstarted | Short tunnel, track placement, detector trigger, tester ride log. |

## Active documentation links

* `docs/design/block-party-ui-guidelines.md` - dashboard visual and component rules.
* `docs/design/references/block-party-ai-dashboard-panels.md` - intended dashboard panels and future backend/API shape.
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

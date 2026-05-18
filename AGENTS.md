# Block Party AI Agent Notes

## Frontend Defaults

- Use Nuxt with Nuxt UI for frontend work unless the user explicitly asks for another stack.
- Build dark-mode-first operational dashboards, not consumer landing pages.
- Keep typography compact: default to `text-xs` and `text-sm`; use restrained panel headings and avoid hero-scale type inside the app.
- Prefer Nuxt UI components for buttons, cards, badges, tables, progress, tooltips, modals, tabs, dropdowns, and forms.
- Keep UI dense, readable, status-heavy, and calm. The dashboard should feel like a practical Minecraft crew control room.

## Required Design Context

Before meaningful frontend edits, read:

- `docs/design/block-party-ui-guidelines.md`
- `docs/design/references/block-party-ai-dashboard-panels.md`

Use `docs/design/references/dashboard-overview-ai-usage.png` as a strong visual target, not a pixel-perfect contract.

## Work Planning and Git Flow

- Before implementing non-trivial work, create a short plan with logical slices.
- Move to a feature branch that represents the work before editing. Use the `feature/` prefix unless the user asks for another branch name.
- Build and verify one logical slice at a time.
- Commit after each completed slice with a clear message. Do not over-split tiny changes; a one-slice change can be one commit.
- Keep commits reviewable and focused. Do not mix unrelated refactors, formatting churn, or drive-by cleanup into feature commits.
- If the worktree already has user changes, preserve them and work around them. Never revert unrelated changes without explicit permission.

## Crew Coordination Roadmap

- Current roadmap priority is coordination before more destructive or specialized bot work.
- Treat Phase 4 as a docs/design phase for goals, reusable plans, jobs, steps, bot requests, templates, greenlight rules, and capability boundaries.
- Treat Phase 5 as the completed first implementation of the coordination core: JSON/JSONL-backed goals, reusable plans, jobs, steps, queues, requests, deterministic planner proposals, approvals, greenlight rules, events, and `/jobs` command center. See `docs/implementation/coordination-core.md`.
- Treat Phase 6 as simulated provisions, chests, tools, and safe setup so the crew economy can be exercised before additional Mineflayer bots connect.
- Treat Phase 7 as real non-digger bot implementation for Snackwella, Chesterton, AnvilAnnie, Blocko, and safe Maphew coordination. Do not implement diggers or destructive mining in Phase 7.
- Treat Phase 8 as the first digger/destructive-work phase, after coordination and non-digger bot adapters exist.
- Treat Phase 9 as real AI planner authoring, and Phase 10 as the coaster prototype.
- Snackwella is part of the named crew as the Provisions / Farming bot. Include her in future crew planning alongside Maphew, Chesterton, AnvilAnnie, Blocko, SpruceLee, CaptainCobble, and Doug.
- Use this lexicon consistently:
  - Goal: desired outcome.
  - Plan: reusable collection of jobs that fulfills a goal.
  - Job: assignable unit of work for one bot.
  - Step: smallest tracked action inside a job.
  - Job Request: bot-originated request for help, resources, location info, tools, food, or planner support.
  - Job Template: reusable approved job shape such as `craft_item`, `fetch_item`, `survey_area`, `stock_chest`, or `place_blocks`.
  - Greenlight Rule: human-configured approval policy allowing a template or plan to run without repeated approval inside defined limits.
- Bots may request help or planner support when blocked, but they should not invent major goals such as "build a foundry" on their own.
- Minecraft chat is the fun visible layer for announcements; structured local state is authoritative.
- Shared bot adapters should poll or receive assigned jobs, accept or block jobs, execute tracked steps, emit job events, create job requests, and announce status in Minecraft chat. The backend remains authoritative for queues, greenlight rules, and step state.

## Verification

After meaningful frontend changes, run the app and verify the UI with screenshots at desktop and mobile widths. Check dark mode, compact density, text overflow, responsive fit, placeholder states, and obvious visual regressions before finalizing.

If `nuxt dev` repeats a `#app-manifest` pre-transform error, run `corepack pnpm exec nuxt cleanup` once, then rerun the failed command. This is a Nuxt generated-cache issue after dependency or generated-file churn, not usually an app regression. Playwright's configured web server already runs this cleanup before `pnpm dev`.

Build output should stay free of large-chunk and Tailwind sourcemap warnings. If either returns, treat it as a maintenance regression and inspect `nuxt.config.ts` chunk/sourcemap settings before documenting it as harmless.

Nuxt 3.21 currently emits Node `DEP0155` trailing-slash export-map warnings from upstream Nuxt/Iconify/Vue packages during production build. Do not spend time chasing that as an app regression unless the Nuxt/UI/Iconify stack is being upgraded; it is tracked in `docs/implementation/dashboard-scaffold.md`.

## Documentation Completion

- At the end of each completed task, update the relevant docs to reflect the current completion state, not just the intended plan.
- Add or update links to any new implementation notes, screenshots, verification artifacts, routes, commands, or follow-up docs that help the next agent understand what changed.
- If a task changes architecture, workflow, dependencies, UI behavior, setup, verification, or known limitations, add a short note in the appropriate docs before finalizing.
- Keep docs honest about placeholder state. Mark mock data, deferred integrations, known warnings, and future work clearly.
- Include doc updates in the same feature branch and commit as the implementation whenever practical. If the docs update is discovered after the implementation commit, make a focused follow-up docs commit.

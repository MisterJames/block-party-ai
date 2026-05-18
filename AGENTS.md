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
- Move to a feature branch that represents the work before editing. Use the `codex/` prefix unless the user asks for another branch name.
- Build and verify one logical slice at a time.
- Commit after each completed slice with a clear message. Do not over-split tiny changes; a one-slice change can be one commit.
- Keep commits reviewable and focused. Do not mix unrelated refactors, formatting churn, or drive-by cleanup into feature commits.
- If the worktree already has user changes, preserve them and work around them. Never revert unrelated changes without explicit permission.

## Verification

After meaningful frontend changes, run the app and verify the UI with screenshots at desktop and mobile widths. Check dark mode, compact density, text overflow, responsive fit, placeholder states, and obvious visual regressions before finalizing.

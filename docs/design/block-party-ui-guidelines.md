# Block Party AI UI Guidelines

These guidelines make UI work feel almost mechanical. When building the local web app, aim for a compact Nuxt UI dashboard that feels like a trustworthy Minecraft crew control room.

## Visual target

Use `docs/design/references/dashboard-overview-ai-usage.png` as the north star. It is not a pixel-perfect spec, but it strongly captures the desired product feel:

* Dark neutral shell
* Left navigation plus system controls
* Dense top status row
* Compact dashboard grid
* Status-heavy cards, tables, logs, and map panels
* Pixelated Minecraft-flavored world map
* Practical, calm, slightly playful tone

Do not turn the app into a marketing page. The first screen should be the usable dashboard, not a hero section.

## Stack and components

Use Nuxt with Nuxt UI unless the user explicitly overrides the stack. Nuxt still uses Vite underneath, but the app guidance should speak in Nuxt/Nuxt UI terms.

Prefer Nuxt UI components before custom primitives:

* `UButton` for commands and icon actions
* `UCard` or simple bordered panels for individual dashboard modules
* `UBadge` for roles, statuses, severity, and approval state
* `UTable` for bot, job, log, and inventory lists
* `UProgress` for job, survey, tool, and resource progress
* `UTooltip` for compact icon controls
* `UModal`, `UTabs`, `UDropdownMenu`, and form components for secondary workflows

Use open-source Nuxt UI. Do not assume Nuxt UI Pro unless the user chooses it later.

## Layout

Default to an operational dashboard layout:

* Fixed or sticky left sidebar on desktop
* Compact top overview cards
* Main grid of panels for AI usage, Maphew status, jobs, activity, and world map
* Dense tables and lists instead of decorative cards
* Functional placeholders for future crew systems
* Mobile layout that stacks panels cleanly without hiding critical status

Cards and panels should have an 8px radius or less. Do not nest cards inside cards. Page sections should be unframed layouts or full-width app regions; reserve cards for actual repeated items, panels, and modals.

## Typography

Small fonts are the default.

* Body and table text: `text-xs` or `text-sm`
* Secondary metadata: `text-xs`
* Panel headings: `text-sm` or modest `text-base`
* Page title: restrained, usually `text-xl` or smaller
* Avoid hero-scale type, giant display headings, and marketing-style copy blocks

Use compact line heights and keep text scannable. Labels should be short, literal, and operational.

## Color and tone

Design dark-mode first. Use neutral dark backgrounds, subtle borders, and semantic status colors.

Good status language:

* Online
* Working
* Surveying
* Waiting for approval
* Paused
* Blocked
* Failed safely
* Needs inspection

Avoid one-note palettes. Do not let the UI become all purple, all slate-blue, all beige, or all brown. Use Minecraft-flavored color only where it helps orientation, such as map blocks, bot avatars, material badges, and status accents.

## Maphew and map UI

Maphew's cartography work should feel like a real first-class feature.

The map should be rough and pixelated, not a fake photorealistic renderer. It should help humans choose project sites and understand the spawn area.

Represent survey data with compact visual layers:

* Surface block or biome color
* Height changes
* Water, lava, cliffs, caves, and other hazards
* Walkable zones
* Landmarks and resource hints
* Current Maphew position and patrol progress

## Before finalizing UI work

Verify:

* Dark mode is the default experience
* Fonts stay small and dashboard-like
* Text does not overflow buttons, badges, cards, tables, or sidebars
* Desktop and mobile screenshots look coherent
* Placeholder panels are clearly useful, not decorative filler
* Nuxt UI components are used where practical
* The result still points toward the dashboard mockup

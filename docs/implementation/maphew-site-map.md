# Maphew Site Map Slice

## State

Complete on branch `feature/maphew-site-map`.

This slice turns `/world` from a placeholder into the first real cartography inspection surface. It reads Maphew's survey JSONL, renders a rough pixelated site map, and lets the user inspect hazards, landmarks, surface blocks, walkable zones, and sample errors.

## What is implemented

* `GET /api/world/survey-map` parses the configured survey JSONL and returns a sanitized map payload.
* Latest sample per `x,z` wins, so repeated samples update the map without rewriting the append-only log.
* The payload includes survey bounds, grid dimensions, route points, sampled tiles, grouped findings, walkable stats, height range, last survey time, parsing health, and current Maphew position when available.
* `/world` now includes:
  * Pixelated canvas terrain map.
  * Layer controls for hazards, landmarks, walkable overlay, route progress, and height shading.
  * Grouped findings sidebar for hazards, landmarks, surface blocks, and sample errors.
  * Hover preview from finding rows to the map.
  * Click-to-pin finding selection with a map label and detail panel.
* The overview map keeps its compact summary role and links to `/world`; full map interaction lives only on `/world`.

## Map Rendering

The map is intentionally rough and operational:

* Unsampled tiles are muted dark cells.
* Surface block names choose the base color family.
* Sampled height subtly adjusts brightness.
* Hazards draw amber markers, landmarks draw cyan markers, and sample errors draw red markers.
* Walkable tiles can be overlaid in green.
* Maphew's live position is shown when the status payload includes one.

The canvas is backed by regular DOM overlays for hover and pinned labels, keeping the high-density map fast while making inspection controls easy to test and iterate.

## Test Data

Playwright writes a deterministic survey fixture to:

```text
test-results/survey-map-test.jsonl
```

That path is ignored and does not commit local world data. Runtime survey data remains under:

```text
state/surveys/spawn-256.samples.jsonl
```

## Verification

Last verified with:

```powershell
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:e2e
```

Playwright captures:

* `test-results/world-map-desktop.png`
* `test-results/world-map-mobile.png`
* Existing overview and planner screenshots.

## Deferred Work

* Add direct map click selection and pan/zoom controls if surveys grow beyond the current 256 x 256 view.
* Add richer labels for resource categories instead of raw block names.
* Add `/world` filters for walkable-only, hazards-only, and route-completion views.
* Add a persisted user annotation layer for chosen build sites.

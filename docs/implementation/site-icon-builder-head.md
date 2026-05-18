# Site Icon Builder Head

## State

Complete on branch `feature/site-icon-builder-head`.

This slice replaces the sidebar `BP` placeholder with an original generated pixel-art builder head and wires the same asset family into the Nuxt favicon metadata.

## What is implemented

* Original generated voxel/pixel builder head mark with transparent background.
* Static PNG assets under `public/brand/`:
  * `builder-head-logo.png` for the dashboard sidebar.
  * `favicon-32x32.png` and `favicon-48x48.png` for browser tab icons.
  * `apple-touch-icon.png`, `icon-192x192.png`, and `icon-512x512.png` for larger app-icon surfaces.
* Sidebar logo image in `components/dashboard/Sidebar.vue`, preserving the compact 40px logo frame.
* Nuxt head icon links in `nuxt.config.ts`.

## Asset notes

The mark was generated as an original builder-head concept on a flat chroma-key background, then processed locally into transparent PNG derivatives. It is not intended to copy a specific Minecraft character, skin, or trademarked asset.

The original generated source remains in Codex's generated image store. The app only references transparent production derivatives in `public/brand/`.

## Verification

Last verified with:

```powershell
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:e2e
```

Desktop and mobile screenshots were captured for visual review:

* `test-results/site-icon-desktop.png`
* `test-results/site-icon-mobile.png`

`test-results/` remains ignored because it is generated output.

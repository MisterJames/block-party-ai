# Maphew Survey Data Slice

## State

Complete on branch `feature/maphew-survey-data`.

This slice adds the first real Minecraft automation surface while keeping startup safe: opening the Nuxt app does not start the Minecraft server, connect Maphew, or begin surveying. All runtime actions are explicit UI/API commands.

## What is implemented

* Mineflayer runtime dependencies for Maphew and pathfinding.
* Local server status and process-control APIs:
  * `GET /api/local-server/status`
  * `POST /api/local-server/start`
  * `POST /api/local-server/stop`
  * `GET /api/world/connection`
* Maphew control APIs:
  * `GET /api/bots/maphew/status`
  * `POST /api/bots/maphew/connect`
  * `POST /api/bots/maphew/disconnect`
  * `POST /api/bots/maphew/survey/start`
  * `POST /api/bots/maphew/survey/stop`
* `GET /api/dashboard` returns the consolidated local server, world connection, and Maphew status payload used by the overview.
* Local World sidebar dropdown controls only the Minecraft server.
* `/bots` now owns Maphew connect/disconnect and survey start/stop controls.
* Maphew survey samples append to JSONL and include surface height, surface block, hazards, landmarks, walkable state, bot position, and sample errors.
* The overview, Bot table, System Status, Active Jobs, Activity Feed, and World Overview summary read real operational status instead of fixed Maphew mock data.
* The fake live blocks-mined counter is removed; it stays at `0` until real mining jobs exist.

## Local Server Setup

Keep the server jar and world files outside the repo. Configure ignored `.env` values:

```text
MINECRAFT_SERVER_DIR=
MINECRAFT_SERVER_JAR=
MINECRAFT_JAVA_BIN=
MINECRAFT_EULA_ACCEPTED=false
MINECRAFT_SERVER_MEMORY_MB=2048
MINECRAFT_SERVER_ONLINE_MODE=false
```

`MINECRAFT_JAVA_BIN` may be blank if `java` is already available on `PATH`. The app refuses to start the server until the server jar exists and `MINECRAFT_EULA_ACCEPTED=true` is set. When that gate is true, it writes `eula.txt` and `server.properties` only inside `MINECRAFT_SERVER_DIR`.

Do not commit local absolute paths, Minecraft binaries, server jars, world files, or generated server state.

## Survey Persistence

Default path:

```text
state/surveys/spawn-256.samples.jsonl
```

Each line is one sample record. `state/` is gitignored, so local world survey history stays local. The dashboard derives the latest survey summary from the JSONL log.

Default survey area:

```text
MAPHEW_SURVEY_ID=spawn-256
MAPHEW_SURVEY_CENTER_X=0
MAPHEW_SURVEY_CENTER_Z=0
MAPHEW_SURVEY_SIZE=256
MAPHEW_SURVEY_SAMPLE_INTERVAL=8
```

That produces 1024 planned samples in a serpentine patrol route. The survey is observational only: Maphew does not dig, place blocks, mutate inventory, or run Minecraft commands.

## Verification

Last verified with:

```powershell
corepack pnpm typecheck
```

Full final verification for this branch should also run:

```powershell
corepack pnpm build
corepack pnpm test:e2e
```

Playwright covers the idle startup contract, blocked local server setup state, Maphew controls on `/bots`, and responsive overview layout.

Manual verification with a configured server:

1. Start the local server from the Local World dropdown.
2. Connect Maphew from `/bots`.
3. Start the spawn survey.
4. Confirm JSONL samples append under `state/surveys/`.
5. Stop the survey, disconnect Maphew, and stop the local server.

## Deferred Work

* Phase 3 should replace the placeholder SVG map with a rendered pixelated map from survey JSONL.
* Add deeper `/world` inspection for sample records, hazards, landmarks, and walkable zones.
* Add structured event logs for bot/server lifecycle transitions instead of deriving all activity-feed text from current status.
* Consider replacing `minecraft-server-util` later; it is currently deprecated upstream but was included for this phase's server ping surface.

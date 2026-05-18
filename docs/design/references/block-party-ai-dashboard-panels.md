# Dashboard Panels and Implementation Notes

This document outlines the major local web UI panels for Block Party AI, what each panel or panel group is meant to do, and a simple approach for building it without overcomplicating the first version.

The dashboard should feel like a practical control room for a tiny Minecraft construction crew. It should help a human quickly understand what the bots are doing, what needs approval, what failed, what is safe, and how much the AI planner is costing.

For visual and component guidance, read `docs/design/block-party-ui-guidelines.md` before implementing UI. Use Nuxt with Nuxt UI in dark mode by default, with compact dashboard typography and the existing dashboard mockup as a strong visual target rather than a pixel-perfect requirement.

## Current implementation status

The Phase 0 dashboard scaffold is complete on `codex/dashboard-scaffold`. It implements the overview shell, placeholder routes, mock Pinia state, live blocks-mined counter, ECharts AI usage sparklines, custom SVG world overview, and Playwright smoke tests.

See `docs/implementation/dashboard-scaffold.md` for the completed scaffold notes, verification commands, known warnings, and deferred integrations. See `docs/project-status.md` for the repo-level completion index.

The Phase 1 AI usage dashboard slice is complete on `feature/ai-usage-dashboard`. It adds append-only local JSONL records, token/cost summary endpoints, dashboard AI usage summaries, a small `/planner` free-form API-call POC, and honest planned-crew placeholders while keeping the rest of the overview placeholder-backed. See `docs/implementation/ai-usage-dashboard.md`.

The Phase 2 Maphew connection and survey data slice is complete on `feature/maphew-survey-data`. It adds explicit local server controls, Maphew connection/survey APIs, JSONL survey persistence, and real dashboard status summaries. The full rendered survey map remains Phase 3 work. See `docs/implementation/maphew-survey-data.md`.

The Phase 3 Maphew site map slice is complete on `feature/maphew-site-map`. It adds `GET /api/world/survey-map`, a pixelated canvas survey map on `/world`, grouped findings for hazards/landmarks/surface blocks/errors, and hover/click-to-pin inspection. See `docs/implementation/maphew-site-map.md`.

The Phase 4 crew coordination planning slice is complete on `feature/crew-coordination-planning`. It reshapes the roadmap around goals, reusable plans, jobs, steps, bot requests, templates, greenlight rules, and Snackwella before more real bot execution is added. See `docs/implementation/crew-coordination-planning.md`.

## Crew coordination lexicon

Use these terms consistently across the dashboard, API, docs, and future bot code:

* Goal: a desired outcome, such as "craft a hoe," "feed Maphew," or "build a foundry."
* Plan: a reusable collection of jobs that fulfills a goal. Plans can be saved and reused in new locations or worlds.
* Job: an assignable unit of work for one bot.
* Step: the smallest tracked action inside a job. Every job has at least one step.
* Job Request: a bot-originated request for help, resources, location info, tools, food, or planner support.
* Job Template: a reusable approved job shape, such as `craft_item`, `fetch_item`, `survey_area`, `stock_chest`, or `place_blocks`.
* Greenlight Rule: a human-configured approval policy allowing a template or plan to run without repeated approval inside defined limits.

The dashboard should make these layers visible without turning routine work into noise. The human approves goals and plans, the job manager tracks jobs and steps, bots can raise requests, and greenlight rules control which repeatable jobs may proceed without another approval click.

## Overall dashboard layout

The main dashboard can be organized into a few stable regions:

* Left navigation and system controls
* Top overview cards
* AI usage and cost summary
* Bot status table
* Activity feed
* Active jobs table
* World overview
* Footer diagnostics

The first version does not need to be live perfect. It should show useful state, refresh often enough to feel alive, and make destructive actions hard to trigger by accident. Most overview panels can start as placeholders; the first functional areas should be AI usage and token costs, Maphew's bot status, and Maphew's rough site map.

### How we might approach this

Start with a single overview page backed by local JSON state and polling. Use mock data for future crew panels until those systems exist, but wire the AI usage and Maphew cartography panels as the first real dashboard slice.

The web UI can request a consolidated dashboard payload from the bot service:

    GET /api/dashboard

That response can include bots, jobs, costs, recent events, world summary, cartography survey state, server status, and project info.

The first version can poll every 2 to 5 seconds. Later, server sent events or WebSockets can make it feel more real time.

## Left navigation

The left navigation gives the app structure and keeps the overview from becoming the only place everything lives.

Possible sections:

* Overview
* Bots
* Jobs
* Planner
* World
* Chests and Items
* Projects
* Logs
* Settings

The navigation should make it clear that the Overview is a command centre, while deeper pages are for inspection, configuration, and troubleshooting.

### How we might approach this

Use Nuxt pages/routes from the beginning, even if most pages are placeholders at first.

Suggested routes:

    /
    /bots
    /jobs
    /planner
    /world
    /chests
    /projects
    /logs
    /settings

In the first milestone, only the Overview page needs to be fully functional. The other routes can show friendly placeholder pages that describe what will eventually live there.

## Emergency control panel

The emergency control area should include a prominent Pause All Bots button.

This is one of the most important controls in the interface. It should be visually distinct, easy to reach, and always available from the main dashboard.

It should not necessarily disconnect the bots. Instead, it should stop new job execution, cancel active pathfinding goals where possible, and put the system into a paused state.

### How we might approach this

Create a global bot control endpoint:

    POST /api/control/pause-all
    POST /api/control/resume-all

The job manager should respect a global pause flag.

When paused:

* No new jobs start
* Active jobs are asked to stop at the next safe checkpoint
* Bot statuses change to Paused or Pausing
* The dashboard shows a clear paused state

For truly dangerous behaviour, a later version could add a Disconnect All Bots action, but Pause All Bots should come first.

## Local world selector

The local world panel shows which Minecraft server or project world the crew is connected to.

It might display:

* World name
* Server host and port
* Online or offline mode
* Current project
* Bot connection count
* Server status

For early local development, this can be simple and read only.

### How we might approach this

Store local connection settings in `.env` and expose a sanitized version through:

    GET /api/world/connection

Do not expose secrets or authentication tokens.

The panel can show:

    Local World
    127.0.0.1:25565
    Offline Mode

Later, this could support switching between saved local profiles, but that is not needed for the first version.

## System status panel

The system status panel shows the health of the local service and bot crew.

Useful fields:

* Server online status
* Bots connected
* Jobs running
* CPU usage
* Memory usage
* OpenAI API status
* Minecraft server ping

This panel helps distinguish between a bot problem, a Minecraft server problem, and a local app problem.

### How we might approach this

Expose a health endpoint:

    GET /api/health

Start with simple values:

* API service running
* bot count
* connected bot count
* active job count
* Node process memory usage
* uptime

CPU usage can come later. Do not block the first version on perfect machine diagnostics.

## Top overview cards

The top cards provide a quick status snapshot.

Possible cards:

* Bots Online
* Active Jobs
* Blocks Mined
* Items Crafted
* Uptime

These cards are not for deep troubleshooting. They are for instant orientation.

### How we might approach this

Calculate these values from the job manager and event log.

For example:

* Bots Online: count connected bots
* Active Jobs: count jobs with Running status
* Blocks Mined: aggregate from completed dig jobs for today
* Items Crafted: aggregate from crafting job results for today
* Uptime: Node service start time or crew session start time

The first version can track these totals in memory and write periodic snapshots to local state.

## AI usage and cost panel

The AI usage panel shows API token usage and estimated costs.

It should include:

* API tokens today
* World total tokens
* AI cost today
* World total cost
* Current model
* Last planner call time
* Optional comparison to yesterday

This panel is important because the project is meant to teach AI agent workflows. Token usage should be visible, not hidden.

This should be one of the first real dashboard panels, even while the rest of the crew overview is still placeholder-backed.

### How we might approach this

Every OpenAI call should write a usage record.

Example record:

    {
      "timestamp": "2026-05-18T10:42:00.000Z",
      "model": "gpt-5.4-mini",
      "purpose": "plan_tunnel_jobs",
      "inputTokens": 5400,
      "outputTokens": 1200,
      "totalTokens": 6600,
      "estimatedCostUsd": 0.00945
    }

Store these records in a local JSONL file or SQLite table.

Suggested file for the first version:

    state/ai-usage.jsonl

The dashboard can aggregate:

* today by local date
* all time for the current project or world
* optionally all time across all projects

For accuracy, store the model pricing used at the time of the call, not only the token count.

## Bot status table

The bot table is the core crew view.

It should show each bot with:

* Display name
* Role
* Connection status
* Current job
* Location
* Inventory or tool status
* Progress
* Last activity time

Example bots:

* Maphew, Cartographer
* CaptainCobble, Digger Leader
* Doug, Digger Worker
* AnvilAnnie, Blacksmith
* Chesterton, Stocker
* Snackwella, Provisions / Farming
* SpruceLee, Gatherer
* Blocko, Builder

This panel should make it obvious who is working, who is idle, who is stuck, and who needs help.

For the first real bot milestone, Maphew can be the only connected bot while the rest of the crew appears as planned or placeholder rows.

### How we might approach this

Each bot adapter should publish a small status object.

Example:

    {
      "name": "Maphew",
      "role": "cartographer",
      "connected": true,
      "status": "working",
      "currentJobId": "survey-spawn-001",
      "currentJobLabel": "Surveying spawn area",
      "position": { "x": 64, "y": 72, "z": -32 },
      "inventorySummary": {
        "tool": null,
        "toolDurabilityPercent": null,
        "freeSlots": 36
      },
      "lastActivityAt": "2026-05-18T10:41:00.000Z"
    }

The UI should not need direct Mineflayer access. It should render what the bot service publishes.

## Cartographer status panel

The cartographer status panel is the first bot-specific dashboard panel.

It should show Maphew's survey progress and make the mapping work legible before the larger crew exists.

Useful fields:

* Current survey area
* Patrol progress
* Sample interval
* Sampled tiles
* Hazards found
* Landmarks found
* Walkable area estimate
* Current position
* Last survey time

### How we might approach this

Expose a small cartography summary through the dashboard payload:

    {
      "bot": "Maphew",
      "surveyId": "spawn-256",
      "status": "surveying",
      "area": {
        "center": { "x": 0, "z": 0 },
        "size": { "x": 256, "z": 256 }
      },
      "sampleInterval": 8,
      "sampledTiles": 427,
      "totalTiles": 1024,
      "hazardsFound": 9,
      "landmarksFound": 4,
      "lastSurveyAt": "2026-05-18T10:41:00.000Z"
    }

Keep this observational and non-destructive. Maphew should collect world context, not modify terrain.

## Bot detail pages

Clicking a bot should open a deeper view.

Useful details:

* Full inventory
* Current pathfinding goal
* Current job step
* Recent bot logs
* Known issues
* Job history
* Manual controls, if enabled
* Return to base button
* Pause this bot button

This is where troubleshooting happens.

### How we might approach this

Add a route:

    /bots/:botName

Expose:

    GET /api/bots/:botName
    POST /api/bots/:botName/pause
    POST /api/bots/:botName/resume
    POST /api/bots/:botName/return-to-base

Keep manual controls limited at first. The bot detail page should inspect more than command.

## Activity feed

The activity feed is the human readable event stream.

It should show things like:

* CaptainCobble started job
* Doug reached checkpoint
* AnvilAnnie crafted iron pickaxe x1
* Chesterton moved cobblestone to build chest
* SpruceLee collected oak logs
* Job completed
* New job queued
* Blocko paused

This panel gives the dashboard life and helps contributors understand what the system is doing.

### How we might approach this

Use a central event log.

Example event:

    {
      "timestamp": "2026-05-18T10:40:00.000Z",
      "type": "item_crafted",
      "severity": "info",
      "bot": "AnvilAnnie",
      "title": "AnvilAnnie crafted",
      "message": "Iron Pickaxe x1",
      "jobId": "craft-tools-001"
    }

Store recent events in memory and append to:

    state/events.jsonl

The dashboard can show the most recent 8 to 12 events, with a View All link to the Logs page.

## Active jobs panel

The active jobs panel shows work currently running or queued.

Fields might include:

* Goal or plan name, when the job came from a larger reusable plan
* Job name
* Assigned bot
* Current step
* Open job requests
* Location or source and destination
* Progress
* Status
* Cancel or pause action
* Approval state

This should be the main place to see whether the crew is making progress.

For the Maphew milestone, active jobs will mostly be observational survey work. Destructive dig/build jobs come later and should keep their approval fields.

### How we might approach this

Define a consistent job model.

Example:

    {
      "jobId": "survey-spawn-001",
      "goalId": "goal-map-spawn",
      "planId": null,
      "type": "surveyArea",
      "label": "Survey spawn area",
      "assignedBot": "Maphew",
      "status": "running",
      "progressPercent": 42,
      "destructive": false,
      "requiresApproval": false,
      "greenlightRuleId": "maphew-routine-survey",
      "currentStep": {
        "stepId": "sample-route",
        "label": "Sample survey route",
        "status": "running"
      },
      "area": {
        "center": { "x": 0, "z": 0 },
        "size": { "x": 256, "z": 256 }
      }
    }

The job manager should be the source of truth. The UI should not infer job state from bot text logs or Minecraft chat. Chat announcements are useful and fun, but structured local state is authoritative.

## Pending approvals panel

The mockup does not need to show this on the main overview all the time, but the product needs it.

Pending approvals are especially important for destructive work.

Examples:

* New goal
* New reusable plan
* New AI-drafted job template
* Clear volume
* Run command
* Place large block list
* Remove or overwrite structures
* Start multi bot dig
* Spend rare materials

The approval panel should show exactly what will happen before the human allows it.

### How we might approach this

Add approval states to jobs:

    proposed
    waiting_for_approval
    greenlit
    approved
    queued
    accepted
    running
    blocked
    completed
    failed
    cancelled
    rejected

Expose:

    GET /api/jobs/pending-approval
    POST /api/jobs/:jobId/approve
    POST /api/jobs/:jobId/reject
    GET /api/greenlights
    POST /api/greenlights

For destructive jobs, show:

* affected volume
* estimated block count
* bot assigned
* safety scan result
* stop conditions
* generated by AI or user requested

Greenlight rules let the human say "you do not need my approval for this again" for repeatable low-risk templates or plans. Examples include Maphew continuing a survey, Chesterton fetching common requested items, Snackwella farming routine crops, or Blocko crafting compasses. Rules should include limits such as allowed template, maximum item count, allowed zone, source chest, rare-material policy, and whether blocks may be placed or broken.

The backend must enforce approval and greenlight rules. Do not rely on the UI alone.

## Planner panel

The planner panel is the chat and planning interface.

It should let the human ask for work in natural language:

    Split the next 60 blocks of tunnel between the digger leader and worker.
    Stock the build chest for a 32 wide pixel art wall.
    Plan the next cave reveal section but do not execute.
    Build a foundry at the marked workshop site.

The planner should return structured proposals, not just prose. It can propose a goal, a reusable plan, and a batch of jobs and steps. It should not execute the proposal.

### How we might approach this

Build the planner around structured responses.

The AI can propose plans and jobs using only approved job types and templates.

The planner request should include:

* user request
* project summary
* current bot state
* active jobs
* recent events
* available job types
* available plans and templates
* greenlight rules
* safety rules
* relevant world map or zone data

The response should be stored as a proposal before it becomes executable jobs. Approved plans should be saved for reuse in new locations or worlds.

If a bot does not know how to fulfill a goal, it can create a planner-support job request. The human approves the planner/API call unless a greenlight rule allows that exact planner path. AI-drafted templates are saved for review and reuse; they are not arbitrary generated Mineflayer code.

Do not let the AI run arbitrary code.

## World overview panel

The world overview gives spatial context.

In the mockup, this appears as a map style image with labelled locations such as Base Camp, Workshop, Storage, Forest, and Active Dig Site.

For the first version, this does not need to be a real Minecraft renderer. It should be a rough, pixelated site map generated from Maphew's survey data. Mock survey data is fine until Maphew is connected, but the intended source of truth is the cartographer bot rather than a permanently manual map.

### How we might approach this

Start with Maphew-generated survey data for a 256 by 256 block area centered near spawn. A practical default sample interval is 8 blocks, which produces a useful coarse map without trying to inspect every block.

Example survey record:

    {
      "surveyId": "spawn-256",
      "center": { "x": 0, "z": 0 },
      "size": { "x": 256, "z": 256 },
      "sampleInterval": 8,
      "samples": [
        {
          "x": -128,
          "z": -128,
          "surfaceY": 68,
          "surfaceBlock": "grass_block",
          "biome": "plains",
          "hazards": [],
          "walkable": true,
          "landmark": null
        },
        {
          "x": -120,
          "z": -128,
          "surfaceY": 63,
          "surfaceBlock": "water",
          "biome": "river",
          "hazards": ["water"],
          "walkable": false,
          "landmark": "river"
        }
      ]
    }

Persist initial data locally as JSON or JSONL. A database is not needed for the first version.

Render the survey as a simple SVG or canvas based pixel map. Color by surface block or biome, overlay hazards and landmarks, and make the map useful for choosing project sites.

Later, this could evolve into a richer top down Minecraft map renderer, but that is not needed for the first dashboard.

## Chests and items panel

The chests and items section tracks known storage points and material availability.

Useful information:

* Known chests
* Chest locations
* Chest purpose
* Current inventory
* Low stock warnings
* Resource requests
* Source and destination for stocker jobs
* Provisioning requests for food, seeds, and farming tools
* Greenlit fetch, stock, and craft templates

Example chests:

* Tool Chest
* Dump Chest
* Build Chest
* Ore Chest
* Fuel Chest
* Redstone Chest
* Pixel Art Chest

### How we might approach this

Create a chest registry.

Example:

    {
      "id": "tool_chest",
      "label": "Tool Chest",
      "location": { "x": 90, "y": 64, "z": 195 },
      "purpose": "Tools for diggers and builders",
      "minimums": {
        "stone_pickaxe": 4,
        "iron_pickaxe": 2,
        "torches": 64
      }
    }

Bots can scan known chests and update local state.

The dashboard can show low stock warnings and suggest restocking jobs. Chesterton should be the default stocker/fetcher, Snackwella should own provisions and farming needs, AnvilAnnie should own tool crafting when the workflow exists, and Blocko can help with safe-zone setup and low-risk utility crafting.

## Logs page

The logs page is for deeper troubleshooting.

It should show:

* Event log
* Bot logs
* Job logs
* Planner requests and responses
* AI token usage records
* Errors and stack traces, if safe
* Filter by bot, job, severity, date, or event type

The overview activity feed should stay clean. The logs page can be messier and more detailed.

### How we might approach this

Use JSONL logs for the first version:

    state/events.jsonl
    state/jobs.jsonl
    state/ai-usage.jsonl
    state/errors.jsonl

The UI can read them through API endpoints that support simple filters.

Examples:

    GET /api/logs/events
    GET /api/logs/jobs
    GET /api/logs/ai-usage
    GET /api/logs/errors

Avoid exposing secrets in logs.

## Settings page

The settings page contains project and safety configuration.

Possible settings:

* Minecraft host and port display
* Bot names
* Bot roles
* Approval requirements
* Maximum destructive volume
* Stop on lava or water
* Stop on chests or spawners
* AI model selection
* Token pricing configuration
* Theme
* Time zone display

### How we might approach this

Start with mostly read only settings loaded from `.env` and local project config.

Editable settings can come later.

Keep secrets out of the UI. Show whether an API key is configured, not the key itself.

## Footer diagnostics

The footer can show small, useful diagnostics:

* App version
* Mineflayer version
* Node version
* OpenAI API status
* Current time zone
* Local time mode

This is helpful for screenshots, bug reports, and community support.

### How we might approach this

Expose a small metadata endpoint:

    GET /api/meta

Example:

    {
      "appVersion": "0.1.0-alpha.1",
      "mineflayerVersion": "4.x",
      "nodeVersion": "20.x",
      "openAiConfigured": true,
      "timezone": "America/Winnipeg"
    }

Do not overinvest here. It is a small polish feature.

## Suggested dashboard API shape

A single dashboard endpoint can keep the first version simple.

Example:

    GET /api/dashboard

Response shape:

    {
      "meta": {},
      "health": {},
      "overview": {},
      "aiUsage": {},
      "bots": [],
      "jobs": {
        "active": [],
        "queued": [],
        "pendingApproval": [],
        "requests": []
      },
      "goals": [],
      "plans": [],
      "templates": [],
      "greenlights": [],
      "events": [],
      "world": {},
      "cartography": {},
      "chests": []
    }

This avoids the Nuxt app needing to coordinate many endpoints at first.

Later, each section can get its own endpoint if needed.

## Suggested first implementation order

A sensible implementation order:

1. Static Nuxt UI dashboard layout with mock data
2. AI usage logging and cost aggregation
3. Bot service health endpoint
4. Maphew bot connection status
5. Cartographer status panel
6. Mock survey data for the world overview
7. Maphew patrol planning for a 256 by 256 spawn-area survey
8. Real terrain sampling and local survey persistence
9. Pixelated site map rendered from survey data
10. Event log
11. Crew coordination design docs for goals, plans, jobs, steps, requests, templates, greenlight rules, and Snackwella
12. Coordination core with job manager, bot queues, job requests, planner proposals, approvals, and greenlight enforcement
13. Provisions, chests, tools, and safe setup workflows
14. Bot detail pages with queues, current step, requests, inventory, and job history
15. Digger crew and destructive approval gates
16. Reusable AI plan authoring and AI-drafted template review
17. Logs and settings pages

This order lets the UI become useful before the full AI planner or destructive digger jobs exist, and it lets the crew request and satisfy food, tools, resources, and location context before larger builds.

## Notes for contributors

The dashboard should avoid pretending the AI is magical.

Good UI language should make the system understandable:

* Proposed job
* Waiting for approval
* Running
* Paused
* Blocked
* Failed safely
* Needs inspection

The interface should make it easy to see the difference between:

* what the human asked for
* what the AI proposed
* what the system approved
* what the bot actually did

That separation is the heart of the project.

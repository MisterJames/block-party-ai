
# Block Party AI

A playful open source Minecraft AI crew experiment for learning AI agents, where local Mineflayer bots work together as a construction crew to map, dig, gather, craft, build, and test ambitious projects while humans guide the creative vision.

## What is this?

The idea is simple: instead of asking an AI to “play Minecraft” directly, we give it a small crew of specialized Mineflayer bots and a safe set of structured jobs. The human stays in charge of the creative direction, while the bots handle repeatable work like surveying terrain, digging tunnels, stocking chests, crafting tools, placing blocks, and testing minecart rides.

This project is meant to be fun, educational, and hackable.

## Direction of the UI

The local web UI should feel like a practical control room for a tiny Minecraft construction crew: clear, readable, slightly playful, and calm enough to trust when bots are about to dig a hole through a mountain.

The dashboard should use Nuxt and Nuxt UI in dark mode unless there is a clear reason not to. It should be compact and operational, with small dashboard typography, dense panels, restrained headings, and no consumer landing-page treatment.

The dashboard should prioritize bot status, active jobs, approvals, safety warnings, world state, and AI token usage. The first functional dashboard slice should focus on API usage and token costs, Maphew's survey status, and a rough generated site map. The rest of the overview can begin as placeholders while the crew grows into it.

Design references may include AI generated mockups. They are used as inspiration, not as exact implementation requirements. See `docs/design/references/dashboard-overview-ai-usage.png` for the initial local web UI direction. That mockup is a strong target for density, tone, and layout, even though it is not a pixel-perfect spec.

Core UI guidance lives in `docs/design/block-party-ui-guidelines.md`. Dashboard panel planning lives in `docs/design/references/block-party-ai-dashboard-panels.md`.

## Use of AI

Yes, this project uses AI.

That is, in fact, the point.

Some of the code will be written with AI assistance. Some of the screenshots, mockups, names, plans, docs, diagrams, and questionable little jokes may also be AI assisted. If you spot something and think, “Hmm, was this made with AI?” the answer is probably, “bruh, yes.”

Block Party AI exists as a playground for learning how AI agents work in the real world, including all the useful, weird, brittle, impressive, and occasionally cursed parts. The goal is not to pretend the AI is magic. The goal is to make the moving pieces visible enough that people can learn from them.

Humans still steer the project. Humans review the code. Humans decide what gets merged. Humans decide when the bots are being helpful and when they are about to dig confidently into lava.

So yes, AI is used here.

Obviously.

## Project goals

Block Party AI is designed to explore:

* AI assisted planning for Minecraft builds
* Local Mineflayer bots with specialized roles
* Structured job queues instead of freeform bot chaos
* Local terrain surveying and rough project mapping
* Human approval for destructive actions
* Multi bot coordination, including zones, chests, tools, and tasks
* Practical agent design using small, understandable building blocks
* Community learning around AI, automation, and creative coding

The first dream build is a minecart rollercoaster through a mountain, with a dark cave opening into a reveal chamber, note block music, pixel art, redstone scenes, and bots helping prepare the space.

But, before we get there, we need to get a LOT of bits in place.

## First real bot: Maphew the Cartographer

The first real crew member is Maphew the Cartographer.

Maphew is the crew's cheerful little survey bot. His job is to turn the local world around spawn into a useful project map before the rest of the crew starts digging or building.

The first target is a rough 256 by 256 block survey area centered near spawn. Maphew should patrol the area, sample terrain at practical intervals, and report back enough information for the app to draw a pixelated site map.

Early survey records should capture:

* Surface height
* Surface block type
* Biome, if available
* Hazards such as lava, water, cliffs, caves, or hostile areas
* Walkable or blocked zones
* Useful landmarks and resource hints

The goal is not a perfect Minecraft renderer. The goal is a readable local project map that helps humans understand the build area, choose future sites, and plan the crew's work.

## How it works

The project is built around a simple idea:

    Human creative direction
            ↓
    Local web control panel
            ↓
    AI planner
            ↓
    Structured job manager
            ↓
    Mineflayer bot crew
            ↓
    Minecraft Java server

The AI does not directly control Minecraft.

Instead, the app and planner work through structured jobs. Early jobs can be observational, like Maphew surveying the area around spawn:

    {
      "bot": "Maphew",
      "type": "surveyArea",
      "area": {
        "center": { "x": 0, "z": 0 },
        "size": { "x": 256, "z": 256 }
      },
      "sampleInterval": 8,
      "destructive": false
    }

Later, destructive jobs can use the same structured approach:

    {
      "bot": "CaptainCobble",
      "type": "clearVolume",
      "zone": {
        "from": { "x": 98, "y": 64, "z": 200 },
        "to": { "x": 102, "y": 67, "z": 227 }
      },
      "destructive": true
    }

The local app previews and validates jobs. Destructive work requires human approval before a Mineflayer bot executes it.

## Planned bot roles

### Cartographer bot

The cartographer bot surveys the local world and produces rough map data.

Maphew should patrol a bounded area around spawn, sample terrain, identify hazards and landmarks, estimate walkable zones, and save survey data that the dashboard can render as a simple site map.

Example role:

* Maphew

The cartographer is the first real bot feature. The other crew roles below are planned for later phases.

### Digger bots

Digger bots clear tunnels, chambers, and build areas.

They should work in assigned zones, stop when they detect hazards, return mined blocks to dump chests, and avoid overlapping with other diggers.

Example roles:

* CaptainCobble
* Doug

### Blacksmith bot

The blacksmith bot manages tools and smelting.

It should watch tool chest levels, craft pickaxes and shovels, smelt ore, manage fuel, and keep the digger crew supplied.

Example role:

* AnvilAnnie

### Resource bots

Resource bots gather and move materials.

One bot may collect raw resources, while another stocks build chests and moves items between storage, staging, and work areas.

Example roles:

* SpruceLee
* Chesterton

### Tester bot

The tester bot helps verify the build.

For a rollercoaster project, this bot could ride the track, log timing, report where the cart slows down, and confirm which detector rails fired.

## Planned features

Early project features include:

* Local Minecraft Java server support
* Offline mode bot accounts for local development
* Mineflayer bot crew
* Node service for bot orchestration
* Nuxt and Nuxt UI based local control panel
* API usage and token cost logging
* Maphew cartographer bot
* Rough generated world overview map
* Chat interface for planning
* Job preview and approval workflow
* Pause all bots button
* Zone reservations to prevent collisions
* Chest and inventory tracking
* Later digger jobs for rectangular tunnel and chamber clearing
* Tool crafting and chest stocking workflows
* Project state stored locally as JSON
* Ride testing logs for minecart builds

## Safety model

This project should be safe by design.

Bots should not be given unlimited freedom. The system should prefer small, inspectable jobs and require human approval before destructive actions.

Important safety principles:

* Destructive jobs require preview and approval
* Bots work from approved job types only
* Bots do not run arbitrary AI generated code
* Bots reserve zones before working
* Bots stop when they detect lava, water, chests, spawners, or unexpected structures
* Project state is saved locally
* Worlds should be backed up before major automated build passes
* Local offline servers should not be exposed to the public internet

## Suggested local setup

For early development, use a local Minecraft Java server in offline mode.

This allows multiple local bot usernames without buying additional Minecraft accounts.

Example server setting:

    online-mode=false

This is intended for local development only. Do not expose an offline mode server to the public internet unless you understand the risks and have added appropriate access controls.

## Tech stack

Planned stack:

* Node.js
* TypeScript
* Mineflayer
* Nuxt
* Nuxt UI
* Vite, through Nuxt's build tooling
* OpenAI API
* Local JSON project state to start
* Playwright or similar browser testing later

## Tech prerequisites

Before running the project locally, you will need:

* Node.js, preferably the current LTS version
* npm, pnpm, or another Node package manager
* Git
* Minecraft Java Edition
* A local Minecraft Java server for development
* A code editor such as VS Code
* An OpenAI API key, once AI planning features are enabled

For the recommended local development setup, run the Minecraft server in offline mode so local bot usernames can join without separate paid Minecraft accounts.

    online-mode=false

Offline mode is intended for local development only. Do not expose an offline mode server to the public internet.

Once the project has an installable skeleton, local startup instructions will be added here.

## Local development

This section will be updated as the project takes shape.

You will need a local Minecraft Java server running and reachable by the bot service.

Example environment values:

    OPENAI_API_KEY=
    OPENAI_MODEL=gpt-5.2
    AI_USAGE_LOG_PATH=state/ai-usage.jsonl
    AI_USAGE_PRICES_JSON={"gpt-5.2":{"inputUsdPerMillion":1.75,"outputUsdPerMillion":14,"cachedInputUsdPerMillion":0.175}}
    AI_CONVERT_PRICING_TO=CAD
    AI_CONVERSION_PRICES_JSON={"CAD":1.3751}
    MINECRAFT_HOST=localhost
    MINECRAFT_PORT=25565
    MINECRAFT_AUTH=offline
    MINECRAFT_SERVER_DIR=
    MINECRAFT_SERVER_JAR=
    MINECRAFT_JAVA_BIN=
    MINECRAFT_EULA_ACCEPTED=false
    MINECRAFT_SERVER_MEMORY_MB=2048
    MINECRAFT_SERVER_ONLINE_MODE=false
    CARTOGRAPHER_BOT_NAME=Maphew
    MAPHEW_SURVEY_ID=spawn-256
    MAPHEW_SURVEY_CENTER_X=0
    MAPHEW_SURVEY_CENTER_Z=0
    MAPHEW_SURVEY_SIZE=256
    MAPHEW_SURVEY_SAMPLE_INTERVAL=8
    MAPHEW_SURVEY_LOG_PATH=state/surveys/spawn-256.samples.jsonl
    BUILDER_BOT_NAME=Blocko
    DIGGER_LEADER_BOT_NAME=CaptainCobble
    DIGGER_WORKER_BOT_NAME=Doug
    BLACKSMITH_BOT_NAME=AnvilAnnie
    STOCKER_BOT_NAME=Chesterton
    GATHERER_BOT_NAME=SpruceLee

AI usage records store estimated costs in USD using the pricing snapshot available when the API call was made. `AI_CONVERT_PRICING_TO` only changes dashboard display totals; provide a USD conversion rate in `AI_CONVERSION_PRICES_JSON`, such as `{"CAD":1.3751}`, if you want costs shown in another currency. If OpenAI returns a dated snapshot model like `gpt-5.2-2025-12-11`, the app can use pricing configured for the base key `gpt-5.2`.

For Phase 2, keep the Minecraft server jar and world files outside this repo in a managed local server folder. Set `MINECRAFT_SERVER_DIR`, `MINECRAFT_SERVER_JAR`, and optionally `MINECRAFT_JAVA_BIN` in your ignored `.env`. The committed `.env.example` intentionally leaves machine-specific paths blank.

The app will not start the server unless `MINECRAFT_EULA_ACCEPTED=true` is set. Only set that after reviewing the Minecraft EULA for the Java Edition server. When the gate is true, the app may write `eula.txt` and `server.properties` inside `MINECRAFT_SERVER_DIR`; it will not copy server binaries into the repo.

The dashboard starts idle. Use the Local World dropdown to start or stop the configured local server. Use `/bots` to connect/disconnect Maphew and start/stop the spawn survey.

## Development roadmap

### Phase 0: Skeleton

* Create Node and Nuxt project structure
* Add local configuration
* Add the local dashboard shell
* Add placeholder overview panels for future crew features

### Phase 1: AI usage and dashboard framework

* Add API usage records for AI calls
* Add token and estimated cost summaries
* Show AI usage in the dashboard
* Add bot status placeholders for the planned crew
* Keep the rest of the overview mostly mocked or placeholder-backed

### Phase 2: Maphew connection and survey data

* Add one Mineflayer bot connection for Maphew
* Add Maphew status reporting
* Add a bounded 256 by 256 spawn-area survey target
* Add patrol planning and practical terrain sampling
* Record surface height, surface block, hazards, landmarks, and walkable zones
* Persist survey data locally as JSON or JSONL
* Completed implementation notes: `docs/implementation/maphew-survey-data.md`

### Phase 3: Maphew site map

* Render Maphew's survey data as a rough pixelated site map
* Show patrol progress, sampled tiles, hazards, landmarks, and last survey time
* Keep non-cartography dashboard panels as placeholders until their systems exist

### Phase 4: Digger crew

* Add a digger role
* Add zone reservations
* Create concepts like tunnelling, allowing multiple bots to work from opposite ends
* Add safe join buffer between diggers
* Add human approval before destructive clearVolume jobs

### Phase 5: Chests, tools, blacksmith, and stocker

* Add known chest registry
* Add inventory summaries
* Add dump chest deposits
* Add tool chest withdrawals
* Add basic crafting jobs
* Add furnace support
* Add tool restocking
* Add item transfer jobs between chests

### Phase 6: AI planner

* Add chat interface
* Add structured AI planning response
* Add job previews
* Add approval workflow

### Phase 7: Coaster prototype

* Clear a short tunnel
* Place a small track section
* Add a detector rail trigger
* Add a simple note block or redstone event
* Add a tester bot ride log

## Contributing

This project is intended to be a friendly learning space.

Good contributions might include:

* Small bot job types
* Safer planning workflows
* Better Mineflayer helpers
* Nuxt UI control panel improvements
* Documentation
* Example builds
* Diagrams
* Teaching materials
* Bug reports with clear reproduction steps

Please keep the project approachable. The goal is not to hide everything behind a magical AI agent. The goal is to make the pieces understandable enough that people can learn from them.

## What this is not

This is not intended to be:

* A griefing tool
* A public server botting framework
* A way to bypass server rules
* A fully autonomous Minecraft player
* A system that runs arbitrary AI generated code without review

Use this on your own local worlds or servers where you have permission.

## License

MIT

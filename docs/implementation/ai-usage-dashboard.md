# AI Usage Dashboard Slice

## State

Complete on branch `feature/ai-usage-dashboard`.

This slice turns the AI usage strip from static mock values into a local, append-only usage accounting surface. Bot runtime, real OpenAI planner calls, Mineflayer services, and most overview panels are still placeholder-backed.

## What is implemented

* Server-side AI usage recorder in `server/utils/ai-usage.ts`.
* Append-only JSONL persistence at `state/ai-usage.jsonl` by default.
* `state/` is ignored by git so contributor usage history and local cost data stay local.
* Nuxt API endpoints:
  * `GET /api/ai-usage/summary`
  * `GET /api/ai-usage/records?limit=50`
  * `POST /api/ai-usage/records`
  * `POST /api/planner/freeform`
* Dashboard AI cards now load token and estimated-cost summaries from the local usage log.
* The AI panel shows current model, last planner call, usage store path, record health, and pricing-needed state.
* `/planner` now includes a small free-form chat POC that makes one server-side OpenAI Responses API call and records its token usage.
* Dashboard layout now stacks at mobile widths; wide data tables scroll inside their panels instead of forcing page-level horizontal overflow.
* Planned crew rows are now honest placeholders: Maphew is the only active bot row, and the rest of the crew is marked planned until services exist.
* Playwright uses `test-results/ai-usage-test.jsonl` so tests do not write to a contributor's real local usage log.

## Usage Record Shape

Future OpenAI call sites should call `recordAiUsage(...)` after receiving an API response. The recorder accepts direct token fields or OpenAI-style usage fields:

```ts
await recordAiUsage({
  model: 'planner-model',
  purpose: 'plan_spawn_survey',
  inputTokens: 1200,
  cachedInputTokens: 200,
  outputTokens: 300
})
```

Each stored record includes timestamp, model, purpose, token counts, estimated cost, and the pricing snapshot used for that estimate. Records are appended as JSONL and are not rewritten during summaries, builds, or Nuxt cleanup.

## Planner POC

The planner page is intentionally free-form for this slice. It posts user text to:

```text
POST /api/planner/freeform
```

The endpoint calls the OpenAI Responses API with `OPENAI_MODEL` or `gpt-5.2`, returns plain text, and records usage with purpose `planner_freeform_poc`. It does not create jobs, approve work, move bots, or change the Minecraft world.

For tests and demos that must not spend API credits, set:

```text
PLANNER_POC_FAKE_AI=1
```

## Pricing

Costs are estimates. The recorder does not hardcode provider pricing because pricing changes and the app should preserve the price table used at the time of each call.

Configure pricing with one of these local environment options:

```powershell
AI_USAGE_PRICES_JSON={"planner-model":{"inputUsdPerMillion":1,"outputUsdPerMillion":2,"cachedInputUsdPerMillion":0.25}}
AI_USAGE_DEFAULT_INPUT_USD_PER_MILLION=1
AI_USAGE_DEFAULT_OUTPUT_USD_PER_MILLION=2
AI_USAGE_DEFAULT_CACHED_INPUT_USD_PER_MILLION=0.25
```

If pricing is missing, token summaries still work and the dashboard marks cost cards as unpriced instead of inventing an estimate.

## Persistence Contract

Default path:

```text
state/ai-usage.jsonl
```

The path can be overridden with:

```text
AI_USAGE_LOG_PATH=state/ai-usage.jsonl
```

Keep this file outside `.nuxt`, `.output`, `dist`, and other generated build directories. The default `state/` path survives `nuxt cleanup`, production builds, and generated-cache churn.

## Verification

Last verified with:

```powershell
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:e2e
```

Playwright captures:

* `test-results/dashboard-overview-desktop.png`
* `test-results/dashboard-overview-mobile.png`
* `test-results/planner-poc-desktop.png`

The test usage log is generated at `test-results/ai-usage-test.jsonl` and intentionally ignored.

## Deferred Work

* Add a logs/settings view for detailed usage inspection and pricing configuration.
* Add budget thresholds and warnings before expensive planner runs.
* Replace the planner POC with structured job proposals and approval previews.
* Move remaining overview panels from mock Pinia state to real dashboard service payloads as their systems come online.

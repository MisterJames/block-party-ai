import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'corepack pnpm exec nuxt cleanup && corepack pnpm dev --host 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    env: {
      NUXT_IGNORE_LOCK: '1',
      AI_USAGE_LOG_PATH: 'test-results/ai-usage-test.jsonl',
      AI_USAGE_PRICES_JSON: JSON.stringify({
        'test-planner-model': {
          inputUsdPerMillion: 1,
          outputUsdPerMillion: 2,
          cachedInputUsdPerMillion: 0.25
        }
      }),
      AI_CONVERT_PRICING_TO: 'CAD',
      AI_CONVERSION_PRICES_JSON: JSON.stringify({ CAD: 1.3751 }),
      OPENAI_MODEL: 'test-planner-model',
      PLANNER_POC_FAKE_AI: '1'
    },
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
    timeout: 120_000
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 950 }
      }
    }
  ]
})

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { expect, test } from '@playwright/test'

const placeholderRoutes = [
  ['/jobs', 'Jobs'],
  ['/chests', 'Chests / Items'],
  ['/projects', 'Projects'],
  ['/logs', 'Logs'],
  ['/settings', 'Settings']
] as const

const surveyFixturePath = 'test-results/survey-map-test.jsonl'
const surveyFixtureRecords = [
  {
    id: 'sample-grass',
    surveyId: 'spawn-256',
    timestamp: '2026-05-18T20:00:00.000Z',
    x: -128,
    z: -128,
    surfaceY: 68,
    surfaceBlock: 'grass_block',
    hazards: [],
    landmarks: ['oak_log'],
    walkable: true,
    botPosition: { x: -128, y: 69, z: -128 },
    error: null
  },
  {
    id: 'sample-water',
    surveyId: 'spawn-256',
    timestamp: '2026-05-18T20:01:00.000Z',
    x: -120,
    z: -128,
    surfaceY: 62,
    surfaceBlock: 'water',
    hazards: ['water'],
    landmarks: ['coal_ore'],
    walkable: false,
    botPosition: { x: -120, y: 63, z: -128 },
    error: null
  },
  {
    id: 'sample-sand',
    surveyId: 'spawn-256',
    timestamp: '2026-05-18T20:02:00.000Z',
    x: -112,
    z: -128,
    surfaceY: 65,
    surfaceBlock: 'sand',
    hazards: [],
    landmarks: [],
    walkable: true,
    botPosition: { x: -112, y: 66, z: -128 },
    error: null
  },
  {
    id: 'sample-error',
    surveyId: 'spawn-256',
    timestamp: '2026-05-18T20:03:00.000Z',
    x: -104,
    z: -128,
    surfaceY: null,
    surfaceBlock: null,
    hazards: ['unreachable'],
    landmarks: [],
    walkable: false,
    botPosition: { x: -104, y: 66, z: -128 },
    error: 'Path was stopped before it could be completed!'
  }
] as const

test.beforeEach(async ({}, testInfo) => {
  if (testInfo.title.includes('empty survey file')) {
    return
  }

  await mkdir(dirname(surveyFixturePath), { recursive: true })
  await writeFile(surveyFixturePath, `${surveyFixtureRecords.map((record) => JSON.stringify(record)).join('\n')}\n`, 'utf8')
})

function parseCounter(value: string | null) {
  return Number((value ?? '').replace(/[^0-9]/g, ''))
}

test('overview renders the desktop dashboard shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible()
  await expect(page.getByText('Block Party AI', { exact: true })).toBeVisible()
  await expect(page.getByText('Setup Needed')).toBeVisible()
  await expect(page.getByText('No bots auto-connected')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Local server controls' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Usage' })).toBeVisible()
  await expect(page.getByText('Local JSONL')).toBeVisible()
  await expect(page.getByText('test-results/ai-usage-test.jsonl', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bots' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Activity Feed' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Active Jobs' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World Overview' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(4)
  await expect(page.locator('svg[aria-label="Maphew survey world overview map"]')).toBeVisible()
  await expect(page.getByTestId('blocks-mined')).toHaveText('0')

  const bodyBackground = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)
  expect(bodyBackground).toMatch(/^(oklch\(0\.129|rgb\(2, 6, 23\))/)

  await page.screenshot({ path: 'test-results/dashboard-overview-desktop.png', fullPage: true })
})

test('AI usage records are appended and summarized', async ({ request, page }) => {
  const response = await request.post('/api/ai-usage/records', {
    data: {
      model: 'test-planner-model-2025-12-11',
      purpose: 'plan_spawn_survey',
      inputTokens: 1200,
      cachedInputTokens: 200,
      outputTokens: 300
    }
  })

  expect(response.ok()).toBeTruthy()

  const summaryResponse = await request.get('/api/ai-usage/summary')
  const summary = await summaryResponse.json()

  expect(summary.totalTokensAllTime).toBeGreaterThanOrEqual(1500)
  expect(summary.totalCostAllTimeUsd).not.toBeNull()
  expect(summary.displayCurrency.code).toBe('CAD')
  expect(summary.displayCurrency.rateFromUsd).toBe(1.3751)
  expect(summary.storage.gitIgnored).toBe(true)
  expect(summary.storage.survivesNuxtCleanup).toBe(true)

  await page.goto('/')
  await expect(page.getByText('test-planner-model-2025-12-11').first()).toBeVisible()
  await expect(page.getByText('AI Cost Today (CAD)')).toBeVisible()
  await expect(page.getByText(/USD x 1\.3751 -> CAD/)).toBeVisible()
  await expect(page.getByText('plan_spawn_survey')).not.toBeVisible()
})

test('planner POC submits a free-form call and refreshes AI usage', async ({ request, page }) => {
  const beforeSummaryResponse = await request.get('/api/ai-usage/summary')
  const beforeSummary = await beforeSummaryResponse.json()

  await page.goto('/planner')

  await expect(page.getByRole('heading', { name: 'Planner', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Usage' })).toBeVisible()
  await expect(page.getByText('Free-form Planner Chat')).toBeVisible()

  await page.getByPlaceholder(/Ask the planner something exploratory/).fill('Sketch a safe first Maphew survey note.')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText(/POC response:/)).toBeVisible()
  await expect(page.getByText('test-planner-model').first()).toBeVisible()

  await expect
    .poll(async () => {
      const response = await request.get('/api/ai-usage/summary')
      const summary = await response.json()
      return summary.totalTokensAllTime
    })
    .toBeGreaterThan(beforeSummary.totalTokensAllTime)

  await page.screenshot({ path: 'test-results/planner-poc-desktop.png', fullPage: true })
})

test('overview does not auto-start bot or mining activity', async ({ page }) => {
  await page.goto('/')
  const counter = page.getByTestId('blocks-mined')

  await expect(counter).toHaveText('0')
  await expect(page.getByText('No mining jobs running')).toBeVisible()
  await expect(page.getByTestId('bots-online')).toHaveText('0 / 7')

  await expect
    .poll(async () => parseCounter(await counter.textContent()), {
      timeout: 2_000,
      intervals: [500, 500, 750, 1000]
    })
    .toBe(0)
})

test('/bots exposes Maphew controls without auto-connecting', async ({ page }) => {
  await page.goto('/bots')

  await expect(page.getByRole('heading', { name: 'Bots', level: 1 })).toBeVisible()
  await expect(page.getByText('Maphew controls are explicit')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connect', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Start Survey', exact: true })).toBeDisabled()
  await expect(page.getByText('Start or connect a local Minecraft server')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bots', level: 2 })).toBeVisible()
  await expect(page.getByText('CaptainCobble')).toBeVisible()
})

test('/world renders the Maphew survey map and pins findings', async ({ page }) => {
  await page.goto('/world')

  await expect(page.getByRole('heading', { name: 'World' })).toBeVisible()
  await expect(page.getByText('Placeholder route')).not.toBeVisible()
  await expect(page.locator('canvas[aria-label="Maphew survey pixel map"]')).toBeVisible()
  await expect(page.getByText('4/1024')).toBeVisible()
  await expect(page.getByText('water').first()).toBeVisible()
  await expect(page.getByText('oak_log').first()).toBeVisible()

  const waterFinding = page.getByTestId('finding-point-hazard').first()

  await waterFinding.hover()
  await expect(page.getByTestId('world-map-hover')).toBeVisible()
  await waterFinding.click()
  await expect(page.getByTestId('world-map-pin')).toBeVisible()
  await expect(page.getByTestId('world-map-selected')).toContainText('water')

  await page.screenshot({ path: 'test-results/world-map-desktop.png', fullPage: true })
})

test('/world handles an empty survey file', async ({ page }) => {
  await rm(surveyFixturePath, { force: true })
  await mkdir(dirname(surveyFixturePath), { recursive: true })
  await page.goto('/world')

  await expect(page.locator('canvas[aria-label="Maphew survey pixel map"]')).toBeVisible()
  await expect(page.getByText('0/1024')).toBeVisible()
  await expect(page.getByText('No matching findings.').first()).toBeVisible()
})

for (const [route, heading] of placeholderRoutes) {
  test(`${route} placeholder route is browsable`, async ({ page }) => {
    await page.goto(route)

    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.getByText('Placeholder route')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Overview' }).last()).toHaveAttribute('href', '/')
  })
}

test('narrow desktop viewport keeps primary shell visible', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible()
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Usage' })).toBeVisible()
})

test('mobile viewport stacks dashboard without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Usage' })).toBeVisible()
  await expect(page.getByText('Local JSONL')).toBeVisible()

  const scrollWidth = await page.locator('body').evaluate(() => document.documentElement.scrollWidth)
  const viewportWidth = await page.locator('body').evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1)

  await page.screenshot({ path: 'test-results/dashboard-overview-mobile.png', fullPage: true })
})

test('mobile world map stacks without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/world')

  await expect(page.getByRole('heading', { name: 'World' })).toBeVisible()
  await expect(page.locator('canvas[aria-label="Maphew survey pixel map"]')).toBeVisible()

  const scrollWidth = await page.locator('body').evaluate(() => document.documentElement.scrollWidth)
  const viewportWidth = await page.locator('body').evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1)

  await page.screenshot({ path: 'test-results/world-map-mobile.png', fullPage: true })
})

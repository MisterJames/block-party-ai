import { expect, test } from '@playwright/test'

const placeholderRoutes = [
  ['/bots', 'Bots'],
  ['/jobs', 'Jobs'],
  ['/world', 'World'],
  ['/chests', 'Chests / Items'],
  ['/projects', 'Projects'],
  ['/logs', 'Logs'],
  ['/settings', 'Settings']
] as const

function parseCounter(value: string | null) {
  return Number((value ?? '').replace(/[^0-9]/g, ''))
}

test('overview renders the desktop dashboard shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible()
  await expect(page.getByText('Block Party AI', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AI Usage' })).toBeVisible()
  await expect(page.getByText('Local JSONL')).toBeVisible()
  await expect(page.getByText('test-results/ai-usage-test.jsonl', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bots' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Activity Feed' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Active Jobs' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World Overview' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(4)
  await expect(page.locator('svg[aria-label="Placeholder pixelated world overview map"]')).toBeVisible()

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

test('blocks mined counter moves while overview is open', async ({ page }) => {
  await page.goto('/')
  const counter = page.getByTestId('blocks-mined')

  await expect.poll(async () => parseCounter(await counter.textContent())).not.toBe(1800)
  const startingValue = parseCounter(await counter.textContent())
  expect(startingValue).toBeGreaterThanOrEqual(1200)

  await expect
    .poll(async () => parseCounter(await counter.textContent()), {
      timeout: 4_000,
      intervals: [500, 500, 750, 1000]
    })
    .toBeGreaterThan(startingValue)
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

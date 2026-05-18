import { expect, test } from '@playwright/test'

const placeholderRoutes = [
  ['/bots', 'Bots'],
  ['/jobs', 'Jobs'],
  ['/planner', 'Planner'],
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

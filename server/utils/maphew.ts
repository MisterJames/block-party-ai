import { randomUUID } from 'node:crypto'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import mineflayer from 'mineflayer'
import type { Bot } from 'mineflayer'
import pathfinderModule from 'mineflayer-pathfinder'
import { Vec3 } from 'vec3'
import type { MaphewPosition, MaphewStatus, SurveySampleRecord, SurveySummary } from '../../types/dashboard'
import { formatLocalPath, getBotNames, getMinecraftConnectionConfig, getSurveyConfig } from './minecraft-config'

const { createBot } = mineflayer as typeof import('mineflayer')
const { Movements, goals, pathfinder } = pathfinderModule as unknown as typeof import('mineflayer-pathfinder')

type MaphewRuntime = {
  bot: Bot | null
  state: MaphewStatus['state']
  currentJob: string
  lastActivityAt: string | null
  lastError: string | null
  surveyStatus: SurveySummary['status']
  surveyAbort: boolean
  surveyPromise: Promise<void> | null
}

const runtimeKey = '__blockPartyMaphewRuntime'
const airBlocks = new Set(['air', 'cave_air', 'void_air'])
const liquidBlocks = new Set(['water', 'lava'])
const hazardBlocks = new Set(['water', 'lava', 'fire', 'magma_block', 'cactus', 'sweet_berry_bush', 'powder_snow'])
const landmarkTerms = ['chest', 'barrel', 'spawner', 'bell', 'bed', 'crafting_table', 'furnace', 'ore', 'log', 'leaves']

function getRuntime(): MaphewRuntime {
  const globalRuntime = globalThis as typeof globalThis & {
    [runtimeKey]?: MaphewRuntime
  }

  if (!globalRuntime[runtimeKey]) {
    globalRuntime[runtimeKey] = {
      bot: null,
      state: 'disconnected',
      currentJob: 'Idle',
      lastActivityAt: null,
      lastError: null,
      surveyStatus: 'idle',
      surveyAbort: false,
      surveyPromise: null
    }
  }

  return globalRuntime[runtimeKey]
}

function touch(runtime: MaphewRuntime) {
  runtime.lastActivityAt = new Date().toISOString()
}

function position(bot: Bot | null): MaphewPosition | null {
  const pos = bot?.entity?.position

  if (!pos) {
    return null
  }

  return {
    x: Number(pos.x.toFixed(1)),
    y: Number(pos.y.toFixed(1)),
    z: Number(pos.z.toFixed(1))
  }
}

function plannedSurveyTotal() {
  const { area } = getSurveyConfig()
  const columns = Math.ceil(area.size.x / area.sampleInterval)
  const rows = Math.ceil(area.size.z / area.sampleInterval)

  return columns * rows
}

function surveyRoute() {
  const { area } = getSurveyConfig()
  const startX = area.center.x - Math.floor(area.size.x / 2)
  const startZ = area.center.z - Math.floor(area.size.z / 2)
  const columns = Math.ceil(area.size.x / area.sampleInterval)
  const rows = Math.ceil(area.size.z / area.sampleInterval)
  const route: Array<{ x: number, z: number }> = []

  for (let row = 0; row < rows; row += 1) {
    const z = startZ + row * area.sampleInterval
    const xs = Array.from({ length: columns }, (_, column) => startX + column * area.sampleInterval)

    if (row % 2 === 1) {
      xs.reverse()
    }

    for (const x of xs) {
      route.push({ x, z })
    }
  }

  return route
}

async function readSurveySamples(): Promise<SurveySampleRecord[]> {
  const { logPath, surveyId } = getSurveyConfig()

  try {
    const rawLog = await readFile(logPath, 'utf8')

    return rawLog
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as SurveySampleRecord
        } catch {
          return null
        }
      })
      .filter((record): record is SurveySampleRecord => Boolean(record?.id && record.surveyId === surveyId))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function appendSurveySample(record: SurveySampleRecord) {
  const { logPath } = getSurveyConfig()

  await mkdir(dirname(logPath), { recursive: true })
  await appendFile(logPath, `${JSON.stringify(record)}\n`, 'utf8')
}

function walkableFrom(surfaceBlock: string | null, aboveBlock: string | null, secondAboveBlock: string | null, hazards: string[]) {
  return Boolean(
    surfaceBlock &&
    !liquidBlocks.has(surfaceBlock) &&
    !hazards.includes('lava') &&
    !hazards.includes('water') &&
    aboveBlock &&
    secondAboveBlock &&
    airBlocks.has(aboveBlock) &&
    airBlocks.has(secondAboveBlock)
  )
}

function classifyHazards(surfaceBlock: string | null, belowBlock: string | null) {
  const hazards = new Set<string>()

  for (const blockName of [surfaceBlock, belowBlock]) {
    if (!blockName) {
      continue
    }

    if (hazardBlocks.has(blockName)) {
      hazards.add(blockName === 'magma_block' ? 'magma' : blockName)
    }
  }

  return Array.from(hazards)
}

function classifyLandmarks(bot: Bot, x: number, y: number, z: number, surfaceBlock: string | null) {
  const landmarks = new Set<string>()

  if (surfaceBlock?.includes('log') || surfaceBlock?.includes('leaves')) {
    landmarks.add('trees')
  }

  const found = bot.findBlocks({
    point: new Vec3(x, y, z),
    maxDistance: 8,
    count: 8,
    matching: (block) => landmarkTerms.some((term) => block.name.includes(term))
  })

  for (const point of found) {
    const block = bot.blockAt(point)

    if (block?.name) {
      landmarks.add(block.name)
    }
  }

  return Array.from(landmarks).slice(0, 8)
}

function findSurface(bot: Bot, x: number, z: number) {
  const gameBounds = bot.game as Bot['game'] & { minY?: number, height?: number }
  const minY = typeof gameBounds.minY === 'number' ? gameBounds.minY : -64
  const maxY = minY + (typeof gameBounds.height === 'number' ? gameBounds.height : 384) - 1

  for (let y = maxY; y >= minY; y -= 1) {
    const block = bot.blockAt(new Vec3(x, y, z))

    if (!block) {
      continue
    }

    if (!airBlocks.has(block.name)) {
      const above = bot.blockAt(new Vec3(x, y + 1, z))
      const secondAbove = bot.blockAt(new Vec3(x, y + 2, z))
      const below = bot.blockAt(new Vec3(x, y - 1, z))
      const hazards = classifyHazards(block.name, below?.name ?? null)

      return {
        surfaceY: y,
        surfaceBlock: block.name,
        hazards,
        landmarks: classifyLandmarks(bot, x, y, z, block.name),
        walkable: walkableFrom(block.name, above?.name ?? null, secondAbove?.name ?? null, hazards)
      }
    }
  }

  return {
    surfaceY: null,
    surfaceBlock: null,
    hazards: ['unloaded'],
    landmarks: [],
    walkable: false
  }
}

async function samplePoint(bot: Bot, x: number, z: number): Promise<SurveySampleRecord> {
  const { surveyId } = getSurveyConfig()

  try {
    await bot.pathfinder.goto(new goals.GoalNearXZ(x, z, 2))
    await bot.waitForChunksToLoad()

    const surface = findSurface(bot, x, z)

    return {
      id: randomUUID(),
      surveyId,
      timestamp: new Date().toISOString(),
      x,
      z,
      ...surface,
      botPosition: position(bot),
      error: null
    }
  } catch (error) {
    return {
      id: randomUUID(),
      surveyId,
      timestamp: new Date().toISOString(),
      x,
      z,
      surfaceY: null,
      surfaceBlock: null,
      hazards: ['unreachable'],
      landmarks: [],
      walkable: false,
      botPosition: position(bot),
      error: error instanceof Error ? error.message : 'Unable to sample point'
    }
  }
}

async function runSurvey(runtime: MaphewRuntime) {
  const bot = runtime.bot

  if (!bot) {
    return
  }

  runtime.state = 'surveying'
  runtime.surveyStatus = 'surveying'
  runtime.currentJob = 'Surveying spawn area'
  runtime.surveyAbort = false
  touch(runtime)

  const samples = await readSurveySamples()
  const sampledKeys = new Set(samples.map((sample) => `${sample.x},${sample.z}`))

  for (const point of surveyRoute()) {
    if (runtime.surveyAbort || runtime.bot !== bot) {
      runtime.surveyStatus = 'paused'
      runtime.currentJob = 'Idle'
      runtime.state = bot ? 'connected' : 'disconnected'
      touch(runtime)
      return
    }

    if (sampledKeys.has(`${point.x},${point.z}`)) {
      continue
    }

    const sample = await samplePoint(bot, point.x, point.z)
    await appendSurveySample(sample)
    sampledKeys.add(`${point.x},${point.z}`)
    touch(runtime)
  }

  runtime.surveyStatus = 'complete'
  runtime.currentJob = 'Idle'
  runtime.state = 'connected'
  touch(runtime)
}

export async function getSurveySummary(): Promise<SurveySummary> {
  const runtime = getRuntime()
  const config = getSurveyConfig()
  const samples = await readSurveySamples()
  const sampledTiles = samples.length
  const totalTiles = plannedSurveyTotal()
  const samplesWithHazards = samples.filter((sample) => sample.hazards.length > 0)
  const samplesWithLandmarks = samples.filter((sample) => sample.landmarks.length > 0)
  const walkableSamples = samples.filter((sample) => sample.walkable)
  const lastSample = samples.at(-1) ?? null
  const status = runtime.surveyStatus === 'surveying' && sampledTiles >= totalTiles ? 'complete' : runtime.surveyStatus

  return {
    surveyId: config.surveyId,
    status,
    area: config.area,
    sampledTiles,
    totalTiles,
    progressPercent: totalTiles ? Math.min(100, Math.round((sampledTiles / totalTiles) * 100)) : 0,
    hazardsFound: samplesWithHazards.length,
    landmarksFound: samplesWithLandmarks.length,
    walkablePercent: sampledTiles ? Math.round((walkableSamples.length / sampledTiles) * 100) : 0,
    lastSurveyAt: lastSample?.timestamp ?? null,
    lastSample,
    storage: {
      path: formatLocalPath(config.logPath),
      gitIgnored: relative(process.cwd(), config.logPath).startsWith('state'),
      appendOnly: true
    }
  }
}

export async function getMaphewStatus(): Promise<MaphewStatus> {
  const runtime = getRuntime()
  const bot = runtime.bot

  return {
    name: getBotNames().cartographer,
    role: 'Cartographer',
    state: runtime.state,
    connected: Boolean(bot),
    currentJob: runtime.currentJob,
    position: position(bot),
    health: bot?.health ?? null,
    food: bot?.food ?? null,
    dimension: bot?.game?.dimension ?? null,
    version: bot?.version ?? null,
    lastActivityAt: runtime.lastActivityAt,
    lastError: runtime.lastError,
    survey: await getSurveySummary()
  }
}

export async function connectMaphew() {
  const runtime = getRuntime()

  if (runtime.bot) {
    return getMaphewStatus()
  }

  const connection = getMinecraftConnectionConfig()
  runtime.state = 'connecting'
  runtime.currentJob = 'Connecting'
  runtime.lastError = null
  touch(runtime)

  const bot = createBot({
    host: connection.host,
    port: connection.port,
    username: getBotNames().cartographer,
    auth: connection.auth as 'offline' | 'microsoft',
    hideErrors: false
  })

  runtime.bot = bot

  bot.once('spawn', () => {
    bot.loadPlugin(pathfinder)
    const movements = new Movements(bot)
    movements.canDig = false
    movements.allow1by1towers = false
    movements.allowFreeMotion = false
    movements.allowParkour = true
    movements.canOpenDoors = true
    bot.pathfinder.setMovements(movements)
    runtime.state = 'connected'
    runtime.currentJob = 'Idle'
    touch(runtime)
  })

  bot.on('move', () => touch(runtime))
  bot.on('health', () => touch(runtime))
  bot.on('kicked', (reason) => {
    runtime.lastError = typeof reason === 'string' ? reason : JSON.stringify(reason)
    runtime.state = 'failed'
    runtime.currentJob = 'Kicked'
    touch(runtime)
  })
  bot.on('error', (error) => {
    runtime.lastError = error.message
    runtime.state = 'failed'
    runtime.currentJob = 'Connection error'
    touch(runtime)
  })
  bot.on('end', (reason) => {
    runtime.bot = null
    runtime.state = runtime.state === 'failed' ? 'failed' : 'disconnected'
    runtime.currentJob = 'Idle'
    runtime.lastError = reason ? String(reason) : runtime.lastError
    touch(runtime)
  })

  return getMaphewStatus()
}

export async function disconnectMaphew() {
  const runtime = getRuntime()

  runtime.surveyAbort = true
  runtime.surveyStatus = runtime.surveyStatus === 'surveying' ? 'paused' : runtime.surveyStatus

  if (runtime.bot) {
    runtime.bot.pathfinder?.stop()
    runtime.bot.end('Disconnected from Block Party AI')
  }

  runtime.bot = null
  runtime.state = 'disconnected'
  runtime.currentJob = 'Idle'
  touch(runtime)

  return getMaphewStatus()
}

export async function startMaphewSurvey() {
  const runtime = getRuntime()

  if (!runtime.bot) {
    runtime.state = 'blocked'
    runtime.lastError = 'Connect Maphew before starting a survey.'
    throw new Error(runtime.lastError)
  }

  if (runtime.surveyPromise) {
    return getMaphewStatus()
  }

  runtime.surveyPromise = runSurvey(runtime)
    .catch((error) => {
      runtime.state = 'failed'
      runtime.surveyStatus = 'failed'
      runtime.currentJob = 'Survey failed'
      runtime.lastError = error instanceof Error ? error.message : 'Survey failed'
      touch(runtime)
    })
    .finally(() => {
      runtime.surveyPromise = null
    })

  return getMaphewStatus()
}

export async function stopMaphewSurvey() {
  const runtime = getRuntime()

  runtime.surveyAbort = true

  if (runtime.bot?.pathfinder) {
    runtime.bot.pathfinder.stop()
  }

  if (runtime.surveyStatus === 'surveying') {
    runtime.surveyStatus = 'paused'
  }

  if (runtime.state === 'surveying') {
    runtime.state = runtime.bot ? 'connected' : 'disconnected'
  }

  runtime.currentJob = 'Idle'
  touch(runtime)

  return getMaphewStatus()
}

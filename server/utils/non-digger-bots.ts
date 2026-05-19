import { randomUUID } from 'node:crypto'
import mineflayer from 'mineflayer'
import type { Bot } from 'mineflayer'
import pathfinderModule from 'mineflayer-pathfinder'
import type { MaphewPosition, NonDiggerCrewBotId, NonDiggerCrewStatus } from '../../types/dashboard'
import { getBotNames, getMinecraftConnectionConfig } from './minecraft-config'
import { getCoordinationDashboard, recordCoordinationEvent, simulateJobStep, updateCrewBotRuntime } from './coordination'

const { createBot } = mineflayer as typeof import('mineflayer')
const { Movements, goals, pathfinder } = pathfinderModule as unknown as typeof import('mineflayer-pathfinder')

type NonDiggerRuntime = {
  bot: Bot | null
  state: NonDiggerCrewStatus['state']
  mode: NonDiggerCrewStatus['mode']
  currentJobId: string | null
  lastActivityAt: string | null
  lastError: string | null
  announcements: NonDiggerCrewStatus['announcements']
}

type AdapterConfig = {
  id: NonDiggerCrewBotId
  name: string
  role: string
  allowedTemplates: string[]
}

const runtimeKey = '__blockPartyNonDiggerRuntime'
const adapterIds: NonDiggerCrewBotId[] = ['snackwella', 'chesterton', 'anvilannie', 'blocko']

function adapterConfigs(): Record<NonDiggerCrewBotId, AdapterConfig> {
  const names = getBotNames()

  return {
    snackwella: {
      id: 'snackwella',
      name: names.provisions,
      role: 'Provisions / Farming',
      allowedTemplates: ['farm_food']
    },
    chesterton: {
      id: 'chesterton',
      name: names.stocker,
      role: 'Stocker',
      allowedTemplates: ['fetch_item', 'stock_chest']
    },
    anvilannie: {
      id: 'anvilannie',
      name: names.blacksmith,
      role: 'Blacksmith',
      allowedTemplates: ['craft_item']
    },
    blocko: {
      id: 'blocko',
      name: names.builder,
      role: 'Builder',
      allowedTemplates: ['safe_zone_setup']
    }
  }
}

function getRuntimeStore() {
  const globalRuntime = globalThis as typeof globalThis & {
    [runtimeKey]?: Record<NonDiggerCrewBotId, NonDiggerRuntime>
  }

  if (!globalRuntime[runtimeKey]) {
    globalRuntime[runtimeKey] = Object.fromEntries(adapterIds.map((id) => [
      id,
      {
        bot: null,
        state: 'disconnected',
        mode: 'fallback',
        currentJobId: null,
        lastActivityAt: null,
        lastError: null,
        announcements: []
      } satisfies NonDiggerRuntime
    ])) as unknown as Record<NonDiggerCrewBotId, NonDiggerRuntime>
  }

  return globalRuntime[runtimeKey]
}

function runtimeFor(id: NonDiggerCrewBotId) {
  return getRuntimeStore()[id]
}

function touch(runtime: NonDiggerRuntime) {
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

function pushAnnouncement(runtime: NonDiggerRuntime, message: string) {
  runtime.announcements.unshift({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    message
  })
  runtime.announcements = runtime.announcements.slice(0, 8)
  touch(runtime)
}

function safeChat(runtime: NonDiggerRuntime, message: string) {
  pushAnnouncement(runtime, message)

  if (runtime.bot) {
    runtime.bot.chat(message)
  }
}

function statusFor(id: NonDiggerCrewBotId): NonDiggerCrewStatus {
  const config = adapterConfigs()[id]
  const runtime = runtimeFor(id)
  const bot = runtime.bot

  return {
    id,
    name: config.name,
    role: config.role,
    connected: Boolean(bot),
    state: runtime.state,
    mode: runtime.mode,
    currentJobId: runtime.currentJobId,
    currentJobLabel: runtime.currentJobId ? 'Assigned coordination job' : 'Idle',
    position: position(bot),
    health: bot?.health ?? null,
    food: bot?.food ?? null,
    lastActivityAt: runtime.lastActivityAt,
    lastError: runtime.lastError,
    announcements: runtime.announcements
  }
}

function nextRunnableJob(status: Awaited<ReturnType<typeof getCoordinationDashboard>>, id: NonDiggerCrewBotId) {
  return status.jobs.find((job) => (
    job.assignedBotId === id &&
    !job.destructive &&
    ['approved', 'greenlit', 'not_required'].includes(job.approval) &&
    !['completed', 'cancelled', 'rejected', 'failed'].includes(job.status)
  )) ?? null
}

async function syncCrewRecord(id: NonDiggerCrewBotId, runtime: NonDiggerRuntime, status: NonDiggerCrewStatus['state']) {
  await updateCrewBotRuntime({
    botId: id,
    runtime: runtime.bot ? 'real' : 'simulated',
    status: status === 'executing' ? 'working' : status === 'blocked' || status === 'failed' ? 'blocked' : runtime.bot ? 'idle' : 'offline',
    currentJobId: runtime.currentJobId,
    locationLabel: runtime.bot ? 'Minecraft world' : 'Fallback adapter',
    inventorySummary: runtime.bot ? 'Real Mineflayer adapter' : 'Fallback adapter ready'
  })
}

export function nonDiggerIds() {
  return adapterIds
}

export async function getNonDiggerCrewStatus() {
  return adapterIds.map(statusFor)
}

export async function connectNonDiggerBot(id: NonDiggerCrewBotId) {
  const config = adapterConfigs()[id]
  const runtime = runtimeFor(id)

  if (runtime.bot) {
    return statusFor(id)
  }

  const connection = getMinecraftConnectionConfig()
  runtime.state = 'connecting'
  runtime.mode = 'real'
  runtime.currentJobId = null
  runtime.lastError = null
  touch(runtime)
  await syncCrewRecord(id, runtime, 'connecting')

  const bot = createBot({
    host: connection.host,
    port: connection.port,
    username: config.name,
    auth: connection.auth as 'offline' | 'microsoft',
    hideErrors: false
  })

  runtime.bot = bot

  bot.once('spawn', async () => {
    bot.loadPlugin(pathfinder)
    const movements = new Movements(bot)
    movements.canDig = false
    movements.allow1by1towers = false
    movements.allowFreeMotion = false
    movements.allowParkour = false
    movements.canOpenDoors = true
    bot.pathfinder.setMovements(movements)
    runtime.state = 'connected'
    runtime.lastError = null
    safeChat(runtime, `${config.name} online. Non-digger adapter ready.`)
    await syncCrewRecord(id, runtime, 'connected')
    await recordCoordinationEvent({
      type: 'bot_connected',
      severity: 'success',
      botId: id,
      jobId: null,
      title: `${config.name} connected`,
      message: 'Real non-digger Mineflayer adapter is online.'
    })
  })

  bot.on('move', () => touch(runtime))
  bot.on('health', () => touch(runtime))
  bot.on('kicked', async (reason) => {
    runtime.lastError = typeof reason === 'string' ? reason : JSON.stringify(reason)
    runtime.state = 'failed'
    runtime.bot = null
    touch(runtime)
    await syncCrewRecord(id, runtime, 'failed')
  })
  bot.on('error', async (error) => {
    runtime.lastError = error.message
    runtime.state = 'failed'
    runtime.bot = null
    touch(runtime)
    await syncCrewRecord(id, runtime, 'failed')
  })
  bot.on('end', async (reason) => {
    runtime.bot = null
    runtime.state = runtime.state === 'failed' ? 'failed' : 'disconnected'
    runtime.lastError = reason ? String(reason) : runtime.lastError
    runtime.currentJobId = null
    touch(runtime)
    await syncCrewRecord(id, runtime, runtime.state)
  })

  return statusFor(id)
}

export async function disconnectNonDiggerBot(id: NonDiggerCrewBotId) {
  const runtime = runtimeFor(id)

  if (runtime.bot?.pathfinder) {
    runtime.bot.pathfinder.stop()
  }

  if (runtime.bot) {
    runtime.bot.end('Disconnected from Block Party AI')
  }

  runtime.bot = null
  runtime.state = 'disconnected'
  runtime.mode = 'fallback'
  runtime.currentJobId = null
  touch(runtime)
  await syncCrewRecord(id, runtime, 'disconnected')

  return statusFor(id)
}

export async function connectNonDiggerCrew() {
  const statuses: NonDiggerCrewStatus[] = []

  for (const id of adapterIds) {
    statuses.push(await connectNonDiggerBot(id))
  }

  return statuses
}

export async function disconnectNonDiggerCrew() {
  const statuses: NonDiggerCrewStatus[] = []

  for (const id of adapterIds) {
    statuses.push(await disconnectNonDiggerBot(id))
  }

  return statuses
}

export async function executeNextNonDiggerStep(id: NonDiggerCrewBotId) {
  const config = adapterConfigs()[id]
  const runtime = runtimeFor(id)
  const coordination = await getCoordinationDashboard()
  const job = nextRunnableJob(coordination, id)

  if (!job) {
    runtime.state = runtime.bot ? 'connected' : 'blocked'
    runtime.lastError = 'No approved or greenlit non-digger job is ready.'
    safeChat(runtime, `${config.name} has no ready job.`)
    await syncCrewRecord(id, runtime, runtime.state)
    throw new Error(runtime.lastError)
  }

  if (!config.allowedTemplates.includes(job.templateId)) {
    runtime.state = 'blocked'
    runtime.currentJobId = job.id
    runtime.lastError = `${config.name} cannot run template ${job.templateId}.`
    safeChat(runtime, runtime.lastError)
    await syncCrewRecord(id, runtime, 'blocked')
    await recordCoordinationEvent({
      type: 'bot_job_blocked',
      severity: 'warning',
      botId: id,
      jobId: job.id,
      title: `${config.name} blocked`,
      message: runtime.lastError
    })
    throw new Error(runtime.lastError)
  }

  const nextStep = [...job.steps].sort((a, b) => a.order - b.order).find((step) => !['completed', 'skipped'].includes(step.status))

  runtime.state = 'executing'
  runtime.mode = runtime.bot ? 'real' : 'fallback'
  runtime.currentJobId = job.id
  runtime.lastError = null
  safeChat(runtime, `${config.name} ${runtime.bot ? 'executing' : 'fallback executing'}: ${job.label}${nextStep ? ` / ${nextStep.label}` : ''}`)
  await syncCrewRecord(id, runtime, 'executing')

  if (runtime.bot && job.location?.x !== undefined && job.location?.z !== undefined) {
    try {
      await runtime.bot.pathfinder.goto(new goals.GoalNearXZ(job.location.x, job.location.z, 3))
    } catch (error) {
      runtime.lastError = error instanceof Error ? error.message : 'Unable to reach job location.'
      pushAnnouncement(runtime, `${config.name} could not reach location; applying safe backend step if allowed.`)
    }
  }

  const result = await simulateJobStep(job.id)
  const updatedJob = result.jobs.find((item) => item.id === job.id)

  runtime.state = runtime.bot ? 'connected' : 'disconnected'
  runtime.currentJobId = updatedJob && !['completed', 'cancelled', 'rejected', 'failed'].includes(updatedJob.status) ? job.id : null
  safeChat(runtime, `${config.name} finished step for ${job.label}.`)
  await syncCrewRecord(id, runtime, runtime.state)
  await recordCoordinationEvent({
    type: 'bot_step_executed',
    severity: updatedJob?.status === 'completed' ? 'success' : 'info',
    botId: id,
    jobId: job.id,
    title: `${config.name} executed step`,
    message: `${job.label} advanced through the non-digger adapter.`
  })

  return {
    bot: statusFor(id),
    coordination: result
  }
}

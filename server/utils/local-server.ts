import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { status as pingJavaServer } from 'minecraft-server-util'
import type { LocalServerStatus } from '../../types/dashboard'
import { configuredFileExists, getLocalServerConfig, getMinecraftConnectionConfig } from './minecraft-config'

type LocalServerRuntime = {
  process: ChildProcessWithoutNullStreams | null
  state: LocalServerStatus['state']
  outputTail: string[]
  lastStartedAt: string | null
  lastStoppedAt: string | null
  lastExitCode: number | null
  lastError: string | null
}

const runtimeKey = '__blockPartyLocalServerRuntime'
const maxOutputLines = 24

function getRuntime(): LocalServerRuntime {
  const globalRuntime = globalThis as typeof globalThis & {
    [runtimeKey]?: LocalServerRuntime
  }

  if (!globalRuntime[runtimeKey]) {
    globalRuntime[runtimeKey] = {
      process: null,
      state: 'stopped',
      outputTail: [],
      lastStartedAt: null,
      lastStoppedAt: null,
      lastExitCode: null,
      lastError: null
    }
  }

  return globalRuntime[runtimeKey]
}

function pushOutput(runtime: LocalServerRuntime, chunk: Buffer | string) {
  const lines = chunk
    .toString()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  runtime.outputTail.push(...lines)
  runtime.outputTail = runtime.outputTail.slice(-maxOutputLines)
}

function javaLooksConfigured() {
  const config = getLocalServerConfig()

  if (config.javaBinConfigured) {
    return existsSync(config.javaBin)
  }

  return true
}

function startBlockers() {
  const config = getLocalServerConfig()
  const blockers: string[] = []

  if (!config.serverDir) {
    blockers.push('Set MINECRAFT_SERVER_DIR to a managed server folder outside the repo.')
  }

  if (!configuredFileExists(config.serverJar)) {
    blockers.push('Set MINECRAFT_SERVER_JAR to an existing Java Edition server jar.')
  }

  if (!javaLooksConfigured()) {
    blockers.push('Set MINECRAFT_JAVA_BIN to an existing java.exe, or make java available on PATH.')
  }

  if (!config.eulaAccepted) {
    blockers.push('Set MINECRAFT_EULA_ACCEPTED=true after reviewing the Minecraft EULA.')
  }

  return blockers
}

async function pingServer() {
  const { host, port } = getMinecraftConnectionConfig()

  try {
    const started = Date.now()
    const response = await pingJavaServer(host, port, {
      timeout: 1200,
      enableSRV: false
    })

    return {
      online: true,
      latencyMs: Date.now() - started,
      version: response.version.name,
      playersOnline: response.players.online,
      playersMax: response.players.max
    }
  } catch {
    return {
      online: false,
      latencyMs: null,
      version: null,
      playersOnline: null,
      playersMax: null
    }
  }
}

async function writeEulaAndProperties() {
  const config = getLocalServerConfig()

  if (!config.serverDir) {
    return
  }

  await mkdir(config.serverDir, { recursive: true })
  await writeFile(join(config.serverDir, 'eula.txt'), 'eula=true\n', 'utf8')

  const propertiesPath = join(config.serverDir, 'server.properties')
  let existing = ''

  try {
    existing = await readFile(propertiesPath, 'utf8')
  } catch {
    existing = ''
  }

  const values = new Map<string, string>()

  for (const line of existing.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) {
      continue
    }

    const [key, ...rest] = line.split('=')
    values.set(key.trim(), rest.join('=').trim())
  }

  values.set('server-port', String(config.port))
  values.set('online-mode', String(config.onlineMode))
  values.set('motd', 'Block Party AI local development server')
  values.set('enable-command-block', 'false')
  values.set('spawn-protection', '0')

  const content = [
    '# Block Party AI managed local development server',
    '# Generated from local environment settings.',
    ...Array.from(values.entries()).map(([key, value]) => `${key}=${value}`),
    ''
  ].join('\n')

  await writeFile(propertiesPath, content, 'utf8')
}

export async function getLocalServerStatus(): Promise<LocalServerStatus> {
  const runtime = getRuntime()
  const config = getLocalServerConfig()
  const blockers = startBlockers()
  const ping = await pingServer()

  if (runtime.process && ping.online && runtime.state === 'starting') {
    runtime.state = 'running'
  }

  const state = blockers.length && !runtime.process && !ping.online ? 'blocked' : runtime.state

  return {
    state,
    host: config.host,
    port: config.port,
    auth: config.auth,
    onlineMode: config.onlineMode,
    pid: runtime.process?.pid ?? null,
    ready: ping.online,
    canStart: blockers.length === 0 && !runtime.process,
    configured: {
      serverDir: Boolean(config.serverDir),
      serverJar: configuredFileExists(config.serverJar),
      java: javaLooksConfigured(),
      eulaAccepted: config.eulaAccepted
    },
    blockers,
    lastStartedAt: runtime.lastStartedAt,
    lastStoppedAt: runtime.lastStoppedAt,
    lastExitCode: runtime.lastExitCode,
    outputTail: runtime.outputTail,
    ping
  }
}

export async function startLocalServer() {
  const runtime = getRuntime()
  const config = getLocalServerConfig()
  const blockers = startBlockers()

  if (runtime.process) {
    return getLocalServerStatus()
  }

  if (blockers.length) {
    runtime.state = 'blocked'
    throw new Error(blockers.join(' '))
  }

  await writeEulaAndProperties()

  runtime.state = 'starting'
  runtime.lastStartedAt = new Date().toISOString()
  runtime.lastExitCode = null
  runtime.lastError = null
  runtime.outputTail = []

  const args = [
    `-Xmx${config.memoryMb}M`,
    `-Xms${Math.min(1024, config.memoryMb)}M`,
    '-jar',
    config.serverJar!,
    'nogui'
  ]

  const child = spawn(config.javaBin, args, {
    cwd: config.serverDir!,
    windowsHide: true
  })

  runtime.process = child

  child.stdout.on('data', (chunk) => pushOutput(runtime, chunk))
  child.stderr.on('data', (chunk) => pushOutput(runtime, chunk))
  child.on('error', (error) => {
    runtime.lastError = error.message
    runtime.state = 'failed'
    pushOutput(runtime, error.message)
  })
  child.on('exit', (code) => {
    runtime.process = null
    runtime.lastExitCode = code
    runtime.lastStoppedAt = new Date().toISOString()
    runtime.state = code === 0 ? 'stopped' : 'failed'
  })

  return getLocalServerStatus()
}

export async function stopLocalServer() {
  const runtime = getRuntime()

  if (!runtime.process) {
    runtime.state = 'stopped'
    runtime.lastStoppedAt = new Date().toISOString()
    return getLocalServerStatus()
  }

  runtime.state = 'stopping'
  runtime.process.stdin.write('stop\n')

  setTimeout(() => {
    if (runtime.process && runtime.state === 'stopping') {
      runtime.process.kill()
    }
  }, 10_000).unref()

  return getLocalServerStatus()
}

export async function getWorldConnectionStatus() {
  const config = getMinecraftConnectionConfig()
  const server = await getLocalServerStatus()

  return {
    label: 'Local World',
    host: config.host,
    port: config.port,
    auth: config.auth,
    onlineMode: config.onlineMode,
    server
  }
}

import { existsSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import type { SurveyArea } from '../../types/dashboard'

const defaultMinecraftPort = 25565
const defaultSurveySize = 256
const defaultSurveyInterval = 8
const defaultMemoryMb = 2048

function envFlag(name: string, fallback = false) {
  const value = process.env[name]?.trim().toLowerCase()

  if (!value) {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(value)
}

function envNumber(name: string, fallback: number, minimum = Number.NEGATIVE_INFINITY) {
  const value = Number(process.env[name])

  return Number.isFinite(value) && value >= minimum ? Math.round(value) : fallback
}

function absolutePath(value: string | undefined) {
  if (!value?.trim()) {
    return null
  }

  return isAbsolute(value) ? value : resolve(process.cwd(), value)
}

export function formatLocalPath(path: string) {
  const localPath = relative(process.cwd(), path)

  return localPath && !localPath.startsWith('..') ? localPath.replaceAll('\\', '/') : '[configured outside repo]'
}

export function getMinecraftConnectionConfig() {
  return {
    host: process.env.MINECRAFT_HOST?.trim() || 'localhost',
    port: envNumber('MINECRAFT_PORT', defaultMinecraftPort, 1),
    auth: process.env.MINECRAFT_AUTH?.trim() || 'offline',
    onlineMode: envFlag('MINECRAFT_SERVER_ONLINE_MODE', false)
  }
}

export function getLocalServerConfig() {
  const serverDir = absolutePath(process.env.MINECRAFT_SERVER_DIR)
  const serverJar = absolutePath(process.env.MINECRAFT_SERVER_JAR) ?? (serverDir ? join(serverDir, 'server.jar') : null)

  return {
    ...getMinecraftConnectionConfig(),
    serverDir: serverDir ?? (serverJar ? dirname(serverJar) : null),
    serverJar,
    javaBin: process.env.MINECRAFT_JAVA_BIN?.trim() || 'java',
    javaBinConfigured: Boolean(process.env.MINECRAFT_JAVA_BIN?.trim()),
    eulaAccepted: envFlag('MINECRAFT_EULA_ACCEPTED', false),
    memoryMb: envNumber('MINECRAFT_SERVER_MEMORY_MB', defaultMemoryMb, 256)
  }
}

export function getSurveyConfig() {
  const size = envNumber('MAPHEW_SURVEY_SIZE', defaultSurveySize, 1)
  const sampleInterval = envNumber('MAPHEW_SURVEY_SAMPLE_INTERVAL', defaultSurveyInterval, 1)
  const area: SurveyArea = {
    center: {
      x: envNumber('MAPHEW_SURVEY_CENTER_X', 0),
      z: envNumber('MAPHEW_SURVEY_CENTER_Z', 0)
    },
    size: {
      x: size,
      z: size
    },
    sampleInterval
  }

  return {
    surveyId: process.env.MAPHEW_SURVEY_ID?.trim() || 'spawn-256',
    area,
    logPath: absolutePath(process.env.MAPHEW_SURVEY_LOG_PATH) ?? join(process.cwd(), 'state', 'surveys', 'spawn-256.samples.jsonl')
  }
}

export function getBotNames() {
  return {
    cartographer: process.env.CARTOGRAPHER_BOT_NAME?.trim() || 'Maphew',
    builder: process.env.BUILDER_BOT_NAME?.trim() || 'Blocko',
    diggerLeader: process.env.DIGGER_LEADER_BOT_NAME?.trim() || 'CaptainCobble',
    diggerWorker: process.env.DIGGER_WORKER_BOT_NAME?.trim() || 'Doug',
    blacksmith: process.env.BLACKSMITH_BOT_NAME?.trim() || 'AnvilAnnie',
    stocker: process.env.STOCKER_BOT_NAME?.trim() || 'Chesterton',
    gatherer: process.env.GATHERER_BOT_NAME?.trim() || 'SpruceLee'
  }
}

export function configuredFileExists(path: string | null) {
  return Boolean(path && existsSync(path))
}

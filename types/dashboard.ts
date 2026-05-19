import type { CoordinationDashboardPayload, CrewBotId } from './coordination'

export type Severity = 'info' | 'success' | 'warning' | 'danger'

export type BotStatus = 'Working' | 'Surveying' | 'Connecting' | 'Going To' | 'Paused' | 'Planned' | 'Waiting' | 'Offline' | 'Blocked' | 'Failed'

export interface DashboardMetric {
  id: string
  label: string
  value: string
  helper: string
  icon: string
  accent: 'green' | 'blue' | 'violet' | 'amber' | 'cyan'
}

export interface SparklineMetric {
  id: string
  label: string
  value: string
  helper: string
  trend: string
  color: string
  data: number[]
  tone?: 'neutral' | 'success' | 'warning'
}

export interface AiUsageDisplayCurrency {
  code: string
  rateFromUsd: number
  converted: boolean
  source: string
}

export interface BotRow {
  id: string
  name: string
  role: string
  avatar: string
  status: BotStatus
  statusTone: 'green' | 'blue' | 'amber' | 'neutral'
  currentJob: string
  jobDetail: string
  location: string
  tool: string
  inventoryPercent: number | null
}

export interface JobRow {
  id: string
  label: string
  icon: string
  detail: string
  assigned: string
  progress: number
  status: 'Running' | 'Queued' | 'Waiting' | 'Proposed' | 'Blocked' | 'Completed'
  approval: 'Approved' | 'Not required' | 'Pending' | 'Greenlit' | 'Rejected'
}

export interface ActivityEvent {
  id: string
  title: string
  message: string
  time: string
  severity: Severity
  icon: string
}

export interface HealthStat {
  label: string
  value: string
  tone: 'green' | 'amber' | 'blue' | 'neutral'
  percent?: number
}

export interface WorldSummary {
  day: number
  time: string
  surveyProgress: number
  hazards: number
  landmarks: number
  walkablePercent: number
}

export interface AiUsagePricingSnapshot {
  inputUsdPerMillion: number | null
  outputUsdPerMillion: number | null
  cachedInputUsdPerMillion?: number | null
  currency: 'USD'
  source: string
}

export interface AiUsageRecord {
  id: string
  timestamp: string
  provider: 'openai'
  model: string
  purpose: string
  projectId: string
  worldId: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number | null
  pricing: AiUsagePricingSnapshot
}

export interface AiUsageRecordPreview {
  id: string
  timestamp: string
  model: string
  purpose: string
  totalTokens: number
  estimatedCostUsd: number | null
}

export interface AiUsageDashboardSummary {
  metrics: SparklineMetric[]
  displayCurrency: AiUsageDisplayCurrency
  currentModel: string
  lastCallAt: string | null
  recordsToday: number
  recordsTotal: number
  totalTokensToday: number
  totalTokensAllTime: number
  totalCostTodayUsd: number | null
  totalCostAllTimeUsd: number | null
  unpricedRecords: number
  skippedLines: number
  recentRecords: AiUsageRecordPreview[]
  storage: {
    path: string
    gitIgnored: boolean
    appendOnly: boolean
    survivesNuxtCleanup: boolean
  }
}

export type LocalServerState = 'stopped' | 'starting' | 'running' | 'stopping' | 'blocked' | 'failed'

export interface LocalServerStatus {
  state: LocalServerState
  host: string
  port: number
  auth: string
  onlineMode: boolean
  pid: number | null
  ready: boolean
  canStart: boolean
  configured: {
    serverDir: boolean
    serverJar: boolean
    java: boolean
    eulaAccepted: boolean
  }
  blockers: string[]
  lastStartedAt: string | null
  lastStoppedAt: string | null
  lastExitCode: number | null
  outputTail: string[]
  ping: {
    online: boolean
    latencyMs: number | null
    version: string | null
    playersOnline: number | null
    playersMax: number | null
  }
}

export interface WorldConnectionStatus {
  label: string
  host: string
  port: number
  auth: string
  onlineMode: boolean
  server: LocalServerStatus
}

export type MaphewRuntimeState = 'disconnected' | 'connecting' | 'connected' | 'surveying' | 'blocked' | 'failed'

export interface MaphewPosition {
  x: number
  y: number
  z: number
}

export interface SurveyArea {
  center: {
    x: number
    z: number
  }
  size: {
    x: number
    z: number
  }
  sampleInterval: number
}

export interface SurveySampleRecord {
  id: string
  surveyId: string
  timestamp: string
  x: number
  z: number
  surfaceY: number | null
  surfaceBlock: string | null
  hazards: string[]
  landmarks: string[]
  walkable: boolean
  botPosition: MaphewPosition | null
  error: string | null
}

export interface SurveySummary {
  surveyId: string
  status: 'idle' | 'surveying' | 'paused' | 'complete' | 'blocked' | 'failed'
  area: SurveyArea
  sampledTiles: number
  totalTiles: number
  progressPercent: number
  hazardsFound: number
  landmarksFound: number
  walkablePercent: number
  lastSurveyAt: string | null
  lastSample: SurveySampleRecord | null
  storage: {
    path: string
    gitIgnored: boolean
    appendOnly: boolean
  }
}

export interface MaphewStatus {
  name: string
  role: 'Cartographer'
  state: MaphewRuntimeState
  connected: boolean
  currentJob: string
  position: MaphewPosition | null
  health: number | null
  food: number | null
  dimension: string | null
  version: string | null
  lastActivityAt: string | null
  lastError: string | null
  survey: SurveySummary
}

export interface DashboardOperationalStatus {
  localServer: LocalServerStatus
  worldConnection: WorldConnectionStatus
  maphew: MaphewStatus
  nonDiggerCrew: NonDiggerCrewStatus[]
  coordination: CoordinationDashboardPayload
}

export type NonDiggerCrewBotId = Extract<CrewBotId, 'snackwella' | 'chesterton' | 'anvilannie' | 'blocko'>

export type NonDiggerBotRuntimeState = 'disconnected' | 'connecting' | 'connected' | 'executing' | 'blocked' | 'failed'

export interface NonDiggerChatAnnouncement {
  id: string
  timestamp: string
  message: string
}

export interface NonDiggerCrewStatus {
  id: NonDiggerCrewBotId
  name: string
  role: string
  connected: boolean
  state: NonDiggerBotRuntimeState
  mode: 'real' | 'fallback'
  currentJobId: string | null
  currentJobLabel: string
  position: MaphewPosition | null
  health: number | null
  food: number | null
  lastActivityAt: string | null
  lastError: string | null
  announcements: NonDiggerChatAnnouncement[]
}

export interface SurveyMapTile extends SurveySampleRecord {
  gridX: number
  gridZ: number
  routeIndex: number
  latestForCoordinate: boolean
}

export interface SurveyFindingPoint {
  id: string
  type: string
  category: 'hazard' | 'landmark' | 'surface' | 'error'
  x: number
  z: number
  gridX: number
  gridZ: number
  surfaceY: number | null
  surfaceBlock: string | null
  walkable: boolean
  timestamp: string
  error: string | null
}

export interface SurveyFindingGroup {
  id: string
  type: string
  category: SurveyFindingPoint['category']
  count: number
  points: SurveyFindingPoint[]
}

export interface SurveyMapLayerState {
  hazards: boolean
  landmarks: boolean
  walkable: boolean
  route: boolean
  height: boolean
}

export interface SelectedSurveyFinding {
  id: string
  source: 'map' | 'sidebar'
  point: SurveyFindingPoint
}

export interface SurveyMapPayload {
  surveyId: string
  status: SurveySummary['status']
  area: SurveyArea
  bounds: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
  grid: {
    columns: number
    rows: number
    totalTiles: number
    sampledTiles: number
    sampleInterval: number
  }
  progressPercent: number
  lastSurveyAt: string | null
  maphewPosition: MaphewPosition | null
  route: Array<{
    x: number
    z: number
    gridX: number
    gridZ: number
    routeIndex: number
    sampled: boolean
  }>
  tiles: SurveyMapTile[]
  findings: {
    hazards: SurveyFindingGroup[]
    landmarks: SurveyFindingGroup[]
    surfaceBlocks: SurveyFindingGroup[]
    errors: SurveyFindingGroup[]
  }
  stats: {
    hazardsFound: number
    landmarksFound: number
    walkableTiles: number
    walkablePercent: number
    minSurfaceY: number | null
    maxSurfaceY: number | null
  }
  parsing: {
    skippedLines: number
    duplicateCoordinates: number
    storagePath: string
    gitIgnored: boolean
  }
}

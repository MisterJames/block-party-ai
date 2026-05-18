export type Severity = 'info' | 'success' | 'warning' | 'danger'

export type BotStatus = 'Working' | 'Surveying' | 'Going To' | 'Paused' | 'Planned' | 'Waiting' | 'Offline'

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
  status: 'Running' | 'Queued' | 'Waiting'
  approval: 'Approved' | 'Not required' | 'Pending'
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

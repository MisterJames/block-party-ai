export type Severity = 'info' | 'success' | 'warning' | 'danger'

export type BotStatus = 'Working' | 'Surveying' | 'Going To' | 'Paused' | 'Planned' | 'Waiting'

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

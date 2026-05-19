export type CrewBotId = 'maphew' | 'snackwella' | 'chesterton' | 'anvilannie' | 'blocko' | 'sprucelee' | 'captain-cobble' | 'doug'

export type CoordinationSeverity = 'info' | 'success' | 'warning' | 'danger'

export type CoordinationJobStatus =
  | 'proposed'
  | 'waiting_for_approval'
  | 'greenlit'
  | 'approved'
  | 'queued'
  | 'accepted'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rejected'

export type CoordinationStepStatus = 'pending' | 'running' | 'blocked' | 'completed' | 'failed' | 'skipped'

export type CoordinationApprovalState = 'not_required' | 'pending' | 'approved' | 'greenlit' | 'rejected'

export type CoordinationRequestStatus = 'open' | 'proposed' | 'resolved' | 'cancelled'

export interface CoordinationLocation {
  x: number
  y?: number | null
  z: number
  label?: string
}

export interface CrewBot {
  id: CrewBotId
  name: string
  role: string
  avatar: string
  runtime: 'real' | 'simulated' | 'planned'
  status: 'offline' | 'idle' | 'queued' | 'working' | 'blocked' | 'planned'
  capabilities: string[]
  currentJobId: string | null
  queueLength: number
  inventorySummary: string
  locationLabel: string
  lastActivityAt: string | null
}

export interface JobStep {
  id: string
  label: string
  status: CoordinationStepStatus
  detail: string
  order: number
  startedAt: string | null
  completedAt: string | null
}

export interface CrewJob {
  id: string
  goalId: string | null
  planId: string | null
  templateId: string
  label: string
  detail: string
  assignedBotId: CrewBotId
  status: CoordinationJobStatus
  approval: CoordinationApprovalState
  destructive: boolean
  progressPercent: number
  steps: JobStep[]
  requests: JobRequest[]
  dependencies: string[]
  greenlightRuleId: string | null
  location: CoordinationLocation | null
  createdBy: 'human' | 'planner' | 'bot' | 'seed'
  createdAt: string
  updatedAt: string
}

export interface CrewGoal {
  id: string
  label: string
  detail: string
  status: 'proposed' | 'approved' | 'active' | 'completed' | 'blocked' | 'rejected'
  source: 'human' | 'planner' | 'bot' | 'seed'
  planId: string | null
  createdAt: string
  updatedAt: string
}

export interface CrewPlan {
  id: string
  label: string
  detail: string
  reusable: boolean
  templateIds: string[]
  defaultJobLabels: string[]
  approval: CoordinationApprovalState
  createdAt: string
  updatedAt: string
}

export interface JobTemplate {
  id: string
  label: string
  category: 'survey' | 'fetch' | 'craft' | 'farm' | 'stock' | 'build' | 'planner'
  defaultBotId: CrewBotId
  destructive: boolean
  stepLabels: string[]
  enabled: boolean
}

export interface GreenlightRule {
  id: string
  label: string
  enabled: boolean
  templateIds: string[]
  botIds: CrewBotId[]
  maxItemCount: number | null
  allowBlockPlacement: boolean
  allowBlockBreaking: boolean
  allowPlannerCalls: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface JobRequest {
  id: string
  jobId: string | null
  fromBotId: CrewBotId
  targetBotId: CrewBotId | null
  type: 'food' | 'item' | 'tool' | 'location' | 'planner_support' | 'materials'
  label: string
  detail: string
  status: CoordinationRequestStatus
  spawnedJobId: string | null
  createdAt: string
  updatedAt: string
}

export interface PlannerProposal {
  id: string
  prompt: string
  label: string
  detail: string
  status: 'proposed' | 'approved' | 'rejected'
  goal: CrewGoal
  plan: CrewPlan | null
  jobs: CrewJob[]
  createdAt: string
  updatedAt: string
}

export interface CoordinationEvent {
  id: string
  timestamp: string
  type: string
  severity: CoordinationSeverity
  botId: CrewBotId | null
  jobId: string | null
  title: string
  message: string
}

export interface CoordinationState {
  version: 1
  updatedAt: string
  crew: CrewBot[]
  goals: CrewGoal[]
  plans: CrewPlan[]
  jobs: CrewJob[]
  templates: JobTemplate[]
  greenlights: GreenlightRule[]
  proposals: PlannerProposal[]
}

export interface CoordinationDashboardPayload extends CoordinationState {
  requests: JobRequest[]
  events: CoordinationEvent[]
  summary: {
    goalsOpen: number
    jobsActive: number
    jobsPendingApproval: number
    requestsOpen: number
    greenlightsEnabled: number
    storagePath: string
    eventLogPath: string
  }
}

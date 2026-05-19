import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import type { ActivityEvent, AiUsageDashboardSummary, BotRow, BotStatus, DashboardMetric, DashboardOperationalStatus, HealthStat, JobRow, LocalServerStatus, MaphewStatus, NonDiggerCrewBotId, NonDiggerCrewStatus, SparklineMetric, WorldConnectionStatus, WorldSummary } from '~/types/dashboard'
import type { CoordinationDashboardPayload, CoordinationJobStatus, CoordinationApprovalState, CrewBot } from '~/types/coordination'

const plannedCrew: BotRow[] = [
  {
    id: 'snackwella',
    name: 'Snackwella',
    role: 'Provisions / Farming',
    avatar: 'S',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Food and farming workflows planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  },
  {
    id: 'captain-cobble',
    name: 'CaptainCobble',
    role: 'Digger Leader',
    avatar: 'C',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Digger orchestration planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  },
  {
    id: 'doug',
    name: 'Doug',
    role: 'Digger Worker',
    avatar: 'D',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Worker dig jobs planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  },
  {
    id: 'anvilannie',
    name: 'AnvilAnnie',
    role: 'Blacksmith',
    avatar: 'A',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Tool crafting planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  },
  {
    id: 'chesterton',
    name: 'Chesterton',
    role: 'Stocker',
    avatar: 'H',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Chest logistics planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  },
  {
    id: 'sprucelee',
    name: 'SpruceLee',
    role: 'Gatherer',
    avatar: 'S',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Resource gathering planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  },
  {
    id: 'blocko',
    name: 'Blocko',
    role: 'Builder',
    avatar: 'B',
    status: 'Planned',
    statusTone: 'neutral',
    currentJob: 'Placeholder crew role',
    jobDetail: 'Builder jobs planned',
    location: 'Not connected',
    tool: 'Pending',
    inventoryPercent: null
  }
]

export const useDashboardStore = defineStore('dashboard', () => {
  const blocksMined = ref(0)
  const startedAt = ref(Date.now() - 2 * 60 * 60 * 1000 - 17 * 60 * 1000)
  const aiUsageSummary = ref<AiUsageDashboardSummary | null>(null)
  const aiUsageError = ref('')
  const operationalStatus = ref<DashboardOperationalStatus | null>(null)
  const operationalError = ref('')
  const localServerActionError = ref('')
  const maphewActionError = ref('')
  const nonDiggerActionError = ref('')
  const operationalTimer = ref<ReturnType<typeof setInterval> | null>(null)

  const aiUsage = ref<SparklineMetric[]>([
    {
      id: 'tokens-today',
      label: 'API Tokens Today',
      value: '0',
      helper: 'No calls today',
      trend: 'neutral',
      color: '#4ade80',
      data: Array.from({ length: 12 }, () => 0)
    },
    {
      id: 'world-tokens',
      label: 'World Total Tokens',
      value: '0',
      helper: 'No records yet',
      trend: 'steady',
      color: '#38bdf8',
      data: Array.from({ length: 12 }, () => 0)
    },
    {
      id: 'cost-today',
      label: 'AI Cost Today',
      value: '$0.00',
      helper: 'Configure pricing before calls',
      trend: 'neutral',
      color: '#fbbf24',
      data: Array.from({ length: 12 }, () => 0)
    },
    {
      id: 'world-cost',
      label: 'World Total Cost',
      value: '$0.00',
      helper: 'All time',
      trend: 'steady',
      color: '#a78bfa',
      data: Array.from({ length: 12 }, () => 0)
    }
  ])

  const uptime = computed(() => {
    const elapsed = Date.now() - startedAt.value
    const hours = Math.floor(elapsed / 3_600_000)
    const minutes = Math.floor((elapsed % 3_600_000) / 60_000)
    return `${hours}h ${minutes}m`
  })

  const maphewStatus = computed<MaphewStatus | null>(() => operationalStatus.value?.maphew ?? null)
  const nonDiggerCrew = computed<NonDiggerCrewStatus[]>(() => operationalStatus.value?.nonDiggerCrew ?? [])
  const coordination = computed<CoordinationDashboardPayload | null>(() => operationalStatus.value?.coordination ?? null)
  const localServer = computed<LocalServerStatus | null>(() => operationalStatus.value?.localServer ?? null)
  const worldConnection = computed<WorldConnectionStatus | null>(() => operationalStatus.value?.worldConnection ?? null)
  const survey = computed(() => maphewStatus.value?.survey ?? null)

  const botsOnline = computed(() => (maphewStatus.value?.connected ? 1 : 0) + nonDiggerCrew.value.filter((bot) => bot.connected).length)
  const crewTotal = computed(() => coordination.value?.crew.length ?? 8)
  const surveyRunning = computed(() => maphewStatus.value?.state === 'surveying')

  const bots = computed<BotRow[]>(() => {
    const crew = coordination.value?.crew

    if (!crew?.length) {
      return [
        maphewRow(maphewStatus.value),
        ...plannedCrew
      ]
    }

    return [
      maphewRow(maphewStatus.value, crew.find((bot) => bot.id === 'maphew')),
      ...crew.filter((bot) => bot.id !== 'maphew').map((bot) => coordinationBotRow(bot, nonDiggerCrew.value.find((runtime) => runtime.id === bot.id)))
    ]
  })

  const activeJobs = computed<JobRow[]>(() => {
    const jobs = coordination.value?.jobs

    if (!jobs?.length) {
      return []
    }

    return jobs
      .filter((job) => !['cancelled', 'rejected'].includes(job.status))
      .slice(0, 6)
      .map((job) => {
        const bot = coordination.value?.crew.find((crewBot) => crewBot.id === job.assignedBotId)
        const currentStep = job.steps.find((step) => ['running', 'blocked', 'pending'].includes(step.status)) ?? job.steps.at(-1)

        return {
          id: job.id,
          label: job.label,
          icon: templateIcon(job.templateId),
          detail: currentStep ? `${currentStep.label} · ${job.detail}` : job.detail,
          assigned: bot?.name ?? job.assignedBotId,
          progress: job.progressPercent,
          status: jobRowStatus(job.status),
          approval: jobRowApproval(job.approval)
        }
      })
  })

  const healthStats = computed<HealthStat[]>(() => [
    {
      label: 'Server',
      value: serverLabel(localServer.value),
      tone: localServer.value?.ready ? 'green' : localServer.value?.state === 'blocked' ? 'amber' : 'neutral'
    },
    { label: 'Bots', value: `${botsOnline.value} / ${crewTotal.value}`, tone: botsOnline.value ? 'green' : 'amber' },
    { label: 'Jobs', value: `${coordination.value?.summary.jobsActive ?? 0} Active`, tone: coordination.value?.summary.jobsActive ? 'blue' : 'neutral' },
    { label: 'Survey', value: `${survey.value?.progressPercent ?? 0}%`, tone: surveyRunning.value ? 'blue' : 'neutral', percent: survey.value?.progressPercent ?? 0 },
    { label: 'Requests', value: `${coordination.value?.summary.requestsOpen ?? 0} Open`, tone: coordination.value?.summary.requestsOpen ? 'amber' : 'neutral' }
  ])

  const worldSummary = computed<WorldSummary>(() => ({
    day: 0,
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date()),
    surveyProgress: survey.value?.progressPercent ?? 0,
    hazards: survey.value?.hazardsFound ?? 0,
    landmarks: survey.value?.landmarksFound ?? 0,
    walkablePercent: survey.value?.walkablePercent ?? 0
  }))

  const events = computed<ActivityEvent[]>(() => {
    const coordinationEvents = coordination.value?.events.map((event) => ({
      id: event.id,
      title: event.title,
      message: event.message,
      time: shortTime(event.timestamp),
      severity: event.severity,
      icon: eventIcon(event.type)
    } satisfies ActivityEvent)) ?? []
    const localEvents: ActivityEvent[] = [
      {
        id: 'evt-server',
        title: `Local server ${serverLabel(localServer.value).toLowerCase()}`,
        message: localServer.value?.blockers[0] ?? `${worldConnection.value?.host ?? 'localhost'}:${worldConnection.value?.port ?? 25565}`,
        time: shortTime(localServer.value?.lastStartedAt),
        severity: localServer.value?.ready ? 'success' : localServer.value?.state === 'blocked' ? 'warning' : 'info',
        icon: 'i-lucide-server'
      },
      {
        id: 'evt-maphew',
        title: `Maphew ${maphewLabel(maphewStatus.value).toLowerCase()}`,
        message: maphewStatus.value?.lastError ?? maphewStatus.value?.currentJob ?? 'Waiting for explicit connect',
        time: shortTime(maphewStatus.value?.lastActivityAt),
        severity: maphewStatus.value?.state === 'failed' || maphewStatus.value?.state === 'blocked' ? 'warning' : maphewStatus.value?.connected ? 'success' : 'info',
        icon: 'i-lucide-bot'
      },
      {
        id: 'evt-survey',
        title: 'Survey data store',
        message: survey.value ? `${survey.value.sampledTiles} samples in ${survey.value.storage.path}` : 'No survey samples recorded',
        time: shortTime(survey.value?.lastSurveyAt),
        severity: survey.value?.sampledTiles ? 'success' : 'info',
        icon: 'i-lucide-map'
      },
      {
        id: 'evt-ai',
        title: 'AI usage logging ready',
        message: aiUsageSummary.value ? `Appending records to ${aiUsageSummary.value.storage.path}` : 'AI usage summary loading',
        time: 'Now',
        severity: 'info',
        icon: 'i-lucide-receipt-text'
      }
    ]

    return [
      ...coordinationEvents,
      ...localEvents
    ].slice(0, 8)
  })

  const metrics = computed<DashboardMetric[]>(() => [
    {
      id: 'bots-online',
      label: 'Bots Online',
      value: `${botsOnline.value} / ${crewTotal.value}`,
      helper: botsOnline.value ? 'Connected crew adapters online' : 'No bots auto-connected',
      icon: 'i-lucide-bot',
      accent: 'green'
    },
    {
      id: 'active-jobs',
      label: 'Active Jobs',
      value: `${coordination.value?.summary.jobsActive ?? 0}`,
      helper: `${coordination.value?.summary.jobsPendingApproval ?? 0} waiting for approval`,
      icon: 'i-lucide-clipboard-list',
      accent: 'blue'
    },
    {
      id: 'blocks-mined',
      label: 'Blocks Mined',
      value: blocksMined.value.toLocaleString(),
      helper: 'No mining jobs running',
      icon: 'i-lucide-box',
      accent: 'violet'
    },
    {
      id: 'items-crafted',
      label: 'Items Crafted',
      value: '0',
      helper: `${coordination.value?.summary.greenlightsEnabled ?? 0} greenlights enabled`,
      icon: 'i-lucide-hammer',
      accent: 'amber'
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: uptime.value,
      helper: 'Since 8:25 AM',
      icon: 'i-lucide-clock-3',
      accent: 'cyan'
    }
  ])

  const footerDiagnostics = computed(() => [
    'Block Party AI v0.1.0-alpha.1',
    maphewStatus.value?.version ? `Minecraft ${maphewStatus.value.version}` : 'Maphew disconnected',
    localServer.value?.ready ? 'Local server reachable' : 'Local server stopped',
    coordination.value ? `Coordination ${coordination.value.summary.storagePath}` : 'Coordination loading',
    aiUsageSummary.value ? `AI usage ${aiUsageSummary.value.storage.path}` : 'AI usage loading',
    'America/Winnipeg'
  ])

  async function refreshAiUsage() {
    try {
      const summary = await $fetch<AiUsageDashboardSummary>('/api/ai-usage/summary')

      aiUsage.value = summary.metrics
      aiUsageSummary.value = summary
      aiUsageError.value = ''
    } catch (error) {
      aiUsageError.value = error instanceof Error ? error.message : 'Unable to load AI usage'
    }
  }

  async function refreshOperationalStatus() {
    try {
      operationalStatus.value = await $fetch<DashboardOperationalStatus>('/api/dashboard')
      operationalError.value = ''
    } catch (error) {
      operationalError.value = error instanceof Error ? error.message : 'Unable to load dashboard status'
    }
  }

  function startOperationalPolling() {
    if (!import.meta.client || operationalTimer.value) {
      return
    }

    operationalTimer.value = setInterval(() => {
      refreshOperationalStatus()
    }, 5000)
  }

  function stopOperationalPolling() {
    if (!operationalTimer.value) {
      return
    }

    clearInterval(operationalTimer.value)
    operationalTimer.value = null
  }

  async function startLocalServer() {
    try {
      await $fetch('/api/local-server/start', { method: 'POST' })
      localServerActionError.value = ''
      await refreshOperationalStatus()
    } catch (error) {
      localServerActionError.value = error instanceof Error ? error.message : 'Unable to start local server'
      await refreshOperationalStatus()
    }
  }

  async function stopLocalServer() {
    try {
      await $fetch('/api/local-server/stop', { method: 'POST' })
      localServerActionError.value = ''
      await refreshOperationalStatus()
    } catch (error) {
      localServerActionError.value = error instanceof Error ? error.message : 'Unable to stop local server'
    }
  }

  async function connectMaphew() {
    await maphewAction('/api/bots/maphew/connect')
  }

  async function disconnectMaphew() {
    await maphewAction('/api/bots/maphew/disconnect')
  }

  async function startMaphewSurvey() {
    await maphewAction('/api/bots/maphew/survey/start')
  }

  async function stopMaphewSurvey() {
    await maphewAction('/api/bots/maphew/survey/stop')
  }

  async function connectNonDiggerBot(id: NonDiggerCrewBotId) {
    await nonDiggerAction(`/api/bots/non-diggers/${id}/connect`)
  }

  async function disconnectNonDiggerBot(id: NonDiggerCrewBotId) {
    await nonDiggerAction(`/api/bots/non-diggers/${id}/disconnect`)
  }

  async function connectNonDiggerCrew() {
    await nonDiggerAction('/api/bots/non-diggers/connect')
  }

  async function disconnectNonDiggerCrew() {
    await nonDiggerAction('/api/bots/non-diggers/disconnect')
  }

  async function executeNonDiggerStep(id: NonDiggerCrewBotId) {
    await nonDiggerAction(`/api/bots/non-diggers/${id}/execute-step`)
  }

  async function maphewAction(path: string) {
    try {
      await $fetch(path, { method: 'POST' })
      maphewActionError.value = ''
      await refreshOperationalStatus()
    } catch (error) {
      maphewActionError.value = error instanceof Error ? error.message : 'Unable to update Maphew'
      await refreshOperationalStatus()
    }
  }

  async function nonDiggerAction(path: string) {
    try {
      await $fetch(path, { method: 'POST' })
      nonDiggerActionError.value = ''
      await refreshOperationalStatus()
    } catch (error) {
      nonDiggerActionError.value = error instanceof Error ? error.message : 'Unable to update non-digger crew'
      await refreshOperationalStatus()
    }
  }

  return {
    activeJobs,
    aiUsage,
    aiUsageError,
    aiUsageSummary,
    bots,
    events,
    footerDiagnostics,
    healthStats,
    localServer,
    localServerActionError,
    maphewActionError,
    maphewStatus,
    metrics,
    operationalError,
    operationalStatus,
    coordination,
    nonDiggerCrew,
    nonDiggerActionError,
    survey,
    worldConnection,
    worldSummary,
    connectNonDiggerBot,
    connectNonDiggerCrew,
    connectMaphew,
    disconnectNonDiggerBot,
    disconnectNonDiggerCrew,
    disconnectMaphew,
    executeNonDiggerStep,
    refreshAiUsage,
    refreshOperationalStatus,
    startLocalServer,
    startMaphewSurvey,
    startOperationalPolling,
    stopLocalServer,
    stopMaphewSurvey,
    stopOperationalPolling
  }
})

function maphewRow(status: MaphewStatus | null, crewBot?: CrewBot): BotRow {
  const survey = status?.survey

  return {
    id: 'maphew',
    name: status?.name ?? crewBot?.name ?? 'Maphew',
    role: 'Cartographer',
    avatar: 'M',
    status: maphewLabel(status),
    statusTone: maphewTone(status),
    currentJob: status?.currentJob ?? crewBot?.currentJobId ?? 'Idle',
    jobDetail: survey ? `${survey.surveyId}: ${survey.sampledTiles}/${survey.totalTiles} samples` : crewBot?.inventorySummary ?? 'Survey not started',
    location: status?.position ? `${status.position.x}, ${status.position.y}, ${status.position.z}` : 'Not connected',
    tool: 'Survey kit',
    inventoryPercent: status?.connected ? survey?.progressPercent ?? 0 : null
  }
}

function coordinationBotRow(bot: CrewBot, runtime?: NonDiggerCrewStatus): BotRow {
  const status = runtime ? nonDiggerBotStatus(runtime) : coordinationBotStatus(bot)

  const currentJobId = runtime?.currentJobId ?? bot.currentJobId

  return {
    id: bot.id,
    name: bot.name,
    role: bot.role,
    avatar: bot.avatar,
    status,
    statusTone: coordinationBotTone(status),
    currentJob: currentJobId ? 'Queued coordination job' : bot.runtime === 'planned' ? 'Placeholder crew role' : 'Ready for work',
    jobDetail: runtime ? `${runtime.mode} adapter · ${runtime.currentJobLabel}` : bot.queueLength ? `${bot.queueLength} queued · ${bot.inventorySummary}` : bot.inventorySummary,
    location: runtime?.position ? `${runtime.position.x}, ${runtime.position.y}, ${runtime.position.z}` : bot.locationLabel,
    tool: runtime?.connected ? 'Real' : bot.runtime === 'real' ? 'Runtime' : bot.runtime === 'simulated' ? 'Fallback' : 'Pending',
    inventoryPercent: bot.queueLength ? Math.min(100, bot.queueLength * 25) : null
  }
}

function nonDiggerBotStatus(status: NonDiggerCrewStatus): BotStatus {
  if (status.state === 'executing') return 'Working'
  if (status.state === 'connected') return 'Waiting'
  if (status.state === 'connecting') return 'Connecting'
  if (status.state === 'blocked') return 'Blocked'
  if (status.state === 'failed') return 'Failed'
  return 'Offline'
}

function maphewLabel(status: MaphewStatus | null): BotStatus {
  if (!status) return 'Offline'

  return {
    disconnected: 'Offline',
    connecting: 'Connecting',
    connected: 'Waiting',
    surveying: 'Surveying',
    blocked: 'Blocked',
    failed: 'Failed'
  }[status.state] as BotStatus
}

function maphewTone(status: MaphewStatus | null): BotRow['statusTone'] {
  if (!status) return 'neutral'
  if (status.state === 'surveying') return 'blue'
  if (status.state === 'connected') return 'green'
  if (status.state === 'connecting' || status.state === 'blocked' || status.state === 'failed') return 'amber'
  return 'neutral'
}

function coordinationBotStatus(bot: CrewBot): BotStatus {
  if (bot.status === 'planned') return 'Planned'
  if (bot.status === 'blocked') return 'Blocked'
  if (bot.status === 'working') return 'Working'
  if (bot.status === 'queued') return 'Waiting'
  if (bot.status === 'offline') return 'Offline'
  return 'Waiting'
}

function coordinationBotTone(status: BotStatus): BotRow['statusTone'] {
  if (status === 'Working') return 'blue'
  if (status === 'Waiting') return 'green'
  if (status === 'Blocked' || status === 'Failed') return 'amber'
  return 'neutral'
}

function jobRowStatus(status: CoordinationJobStatus): JobRow['status'] {
  if (status === 'running' || status === 'accepted') return 'Running'
  if (status === 'queued' || status === 'approved' || status === 'greenlit') return 'Queued'
  if (status === 'proposed' || status === 'waiting_for_approval') return 'Proposed'
  if (status === 'blocked' || status === 'failed') return 'Blocked'
  if (status === 'completed') return 'Completed'
  return 'Waiting'
}

function jobRowApproval(approval: CoordinationApprovalState): JobRow['approval'] {
  if (approval === 'approved') return 'Approved'
  if (approval === 'greenlit') return 'Greenlit'
  if (approval === 'pending') return 'Pending'
  if (approval === 'rejected') return 'Rejected'
  return 'Not required'
}

function templateIcon(templateId: string) {
  if (templateId.includes('survey')) return 'i-lucide-map'
  if (templateId.includes('fetch') || templateId.includes('stock')) return 'i-lucide-package'
  if (templateId.includes('craft')) return 'i-lucide-hammer'
  if (templateId.includes('farm')) return 'i-lucide-wheat'
  if (templateId.includes('place')) return 'i-lucide-blocks'
  return 'i-lucide-clipboard-list'
}

function eventIcon(type: string) {
  if (type.includes('greenlight')) return 'i-lucide-badge-check'
  if (type.includes('request')) return 'i-lucide-message-square-warning'
  if (type.includes('proposal')) return 'i-lucide-sparkles'
  if (type.includes('job')) return 'i-lucide-clipboard-list'
  return 'i-lucide-radio'
}

function serverLabel(status: LocalServerStatus | null) {
  if (!status) return 'Loading'
  if (status.ready) return 'Online'
  if (status.state === 'blocked') return 'Blocked'
  if (status.state === 'starting') return 'Starting'
  if (status.state === 'stopping') return 'Stopping'
  if (status.state === 'failed') return 'Failed'
  return 'Stopped'
}

function shortTime(timestamp: string | null | undefined) {
  if (!timestamp) return 'Now'

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import type { ActivityEvent, AiUsageDashboardSummary, BotRow, BotStatus, DashboardMetric, DashboardOperationalStatus, HealthStat, JobRow, LocalServerStatus, MaphewStatus, SparklineMetric, WorldConnectionStatus, WorldSummary } from '~/types/dashboard'

const plannedCrew: BotRow[] = [
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
  const localServer = computed<LocalServerStatus | null>(() => operationalStatus.value?.localServer ?? null)
  const worldConnection = computed<WorldConnectionStatus | null>(() => operationalStatus.value?.worldConnection ?? null)
  const survey = computed(() => maphewStatus.value?.survey ?? null)

  const botsOnline = computed(() => maphewStatus.value?.connected ? 1 : 0)
  const surveyRunning = computed(() => maphewStatus.value?.state === 'surveying')

  const bots = computed<BotRow[]>(() => [
    maphewRow(maphewStatus.value),
    ...plannedCrew
  ])

  const activeJobs = computed<JobRow[]>(() => [
    {
      id: survey.value?.surveyId ?? 'spawn-256',
      label: 'Survey spawn area',
      icon: 'i-lucide-map',
      detail: survey.value
        ? `${survey.value.area.size.x} x ${survey.value.area.size.z}, ${survey.value.sampledTiles}/${survey.value.totalTiles} samples`
        : '256 x 256 around spawn',
      assigned: 'Maphew',
      progress: survey.value?.progressPercent ?? 0,
      status: surveyRunning.value ? 'Running' : 'Waiting',
      approval: 'Not required'
    },
    {
      id: 'clear-tunnel-placeholder',
      label: 'Tunnel clearing crew',
      icon: 'i-lucide-pickaxe',
      detail: 'Placeholder until digger services exist',
      assigned: 'CaptainCobble',
      progress: 0,
      status: 'Waiting',
      approval: 'Pending'
    },
    {
      id: 'follow-leader-placeholder',
      label: 'Digger worker sync',
      icon: 'i-lucide-route',
      detail: 'Placeholder until digger services exist',
      assigned: 'Doug',
      progress: 0,
      status: 'Waiting',
      approval: 'Not required'
    },
    {
      id: 'smelt-tools-placeholder',
      label: 'Tool crafting',
      icon: 'i-lucide-flame',
      detail: 'Placeholder until blacksmith service exists',
      assigned: 'AnvilAnnie',
      progress: 0,
      status: 'Waiting',
      approval: 'Not required'
    },
    {
      id: 'restock-build-placeholder',
      label: 'Restock build chest',
      icon: 'i-lucide-package',
      detail: 'Placeholder until stocker service exists',
      assigned: 'Chesterton',
      progress: 0,
      status: 'Waiting',
      approval: 'Not required'
    },
    {
      id: 'gather-oak-placeholder',
      label: 'Resource gathering',
      icon: 'i-lucide-tree-pine',
      detail: 'Placeholder until gatherer service exists',
      assigned: 'SpruceLee',
      progress: 0,
      status: 'Waiting',
      approval: 'Pending'
    }
  ])

  const healthStats = computed<HealthStat[]>(() => [
    {
      label: 'Server',
      value: serverLabel(localServer.value),
      tone: localServer.value?.ready ? 'green' : localServer.value?.state === 'blocked' ? 'amber' : 'neutral'
    },
    { label: 'Bots', value: `${botsOnline.value} / 7`, tone: botsOnline.value ? 'green' : 'amber' },
    { label: 'Jobs', value: surveyRunning.value ? '1 Running' : '0 Running', tone: surveyRunning.value ? 'blue' : 'neutral' },
    { label: 'Survey', value: `${survey.value?.progressPercent ?? 0}%`, tone: surveyRunning.value ? 'blue' : 'neutral', percent: survey.value?.progressPercent ?? 0 },
    { label: 'Samples', value: `${survey.value?.sampledTiles ?? 0}/${survey.value?.totalTiles ?? 1024}`, tone: 'neutral' }
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

  const events = computed<ActivityEvent[]>(() => [
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
    },
    {
      id: 'evt-crew',
      title: 'Crew placeholders staged',
      message: 'Non-Maphew bots are planned, not connected',
      time: 'Now',
      severity: 'info',
      icon: 'i-lucide-users'
    }
  ])

  const metrics = computed<DashboardMetric[]>(() => [
    {
      id: 'bots-online',
      label: 'Bots Online',
      value: `${botsOnline.value} / 7`,
      helper: botsOnline.value ? 'Maphew connected; crew planned' : 'No bots auto-connected',
      icon: 'i-lucide-bot',
      accent: 'green'
    },
    {
      id: 'active-jobs',
      label: 'Active Jobs',
      value: surveyRunning.value ? '1' : '0',
      helper: surveyRunning.value ? 'Maphew survey running' : 'Explicit start required',
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
      helper: 'No crafting jobs running',
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
    survey,
    worldConnection,
    worldSummary,
    connectMaphew,
    disconnectMaphew,
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

function maphewRow(status: MaphewStatus | null): BotRow {
  const survey = status?.survey

  return {
    id: 'maphew',
    name: status?.name ?? 'Maphew',
    role: 'Cartographer',
    avatar: 'M',
    status: maphewLabel(status),
    statusTone: maphewTone(status),
    currentJob: status?.currentJob ?? 'Idle',
    jobDetail: survey ? `${survey.surveyId}: ${survey.sampledTiles}/${survey.totalTiles} samples` : 'Survey not started',
    location: status?.position ? `${status.position.x}, ${status.position.y}, ${status.position.z}` : 'Not connected',
    tool: 'Survey kit',
    inventoryPercent: status?.connected ? survey?.progressPercent ?? 0 : null
  }
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

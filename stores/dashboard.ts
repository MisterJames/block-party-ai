import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import type { ActivityEvent, AiUsageDashboardSummary, BotRow, DashboardMetric, HealthStat, JobRow, SparklineMetric, WorldSummary } from '~/types/dashboard'

const lowThousandsStart = 1800

export const useDashboardStore = defineStore('dashboard', () => {
  const blocksMined = ref(lowThousandsStart)
  const hasRandomizedBlocks = ref(false)
  const liveTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const startedAt = ref(Date.now() - 2 * 60 * 60 * 1000 - 17 * 60 * 1000)
  const aiUsageSummary = ref<AiUsageDashboardSummary | null>(null)
  const aiUsageError = ref('')

  const bots = ref<BotRow[]>([
    {
      id: 'maphew',
      name: 'Maphew',
      role: 'Cartographer',
      avatar: 'M',
      status: 'Surveying',
      statusTone: 'blue',
      currentJob: 'Surveying spawn area',
      jobDetail: 'spawn-256 patrol route',
      location: '64, 72, -32',
      tool: 'Map kit',
      inventoryPercent: 82
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
  ])

  const activeJobs = ref<JobRow[]>([
    {
      id: 'survey-spawn-001',
      label: 'Survey spawn area',
      icon: 'i-lucide-map',
      detail: '256 x 256 around spawn',
      assigned: 'Maphew',
      progress: 42,
      status: 'Running',
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

  const events = ref<ActivityEvent[]>([
    {
      id: 'evt-1',
      title: 'Maphew sampled ridge',
      message: 'New cliff hazard marked near -24, -88',
      time: '10:42 AM',
      severity: 'info',
      icon: 'i-lucide-map-pin'
    },
    {
      id: 'evt-2',
      title: 'AI usage logging ready',
      message: 'Appending records to state/ai-usage.jsonl',
      time: '10:41 AM',
      severity: 'success',
      icon: 'i-lucide-receipt-text'
    },
    {
      id: 'evt-3',
      title: 'Crew placeholders staged',
      message: 'Non-Maphew bots are planned, not connected',
      time: '10:41 AM',
      severity: 'info',
      icon: 'i-lucide-bot'
    },
    {
      id: 'evt-4',
      title: 'Pricing configuration pending',
      message: 'Set AI_USAGE_PRICES_JSON for cost estimates',
      time: '10:40 AM',
      severity: 'warning',
      icon: 'i-lucide-circle-dollar-sign'
    },
    {
      id: 'evt-5',
      title: 'Dashboard remains placeholder-backed',
      message: 'Jobs, world, and inventory await services',
      time: '10:39 AM',
      severity: 'info',
      icon: 'i-lucide-layout-dashboard'
    },
    {
      id: 'evt-6',
      title: 'Build safety reminder',
      message: 'Destructive jobs still require future approvals',
      time: '10:35 AM',
      severity: 'warning',
      icon: 'i-lucide-shield-alert'
    }
  ])

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

  const healthStats = ref<HealthStat[]>([
    { label: 'Server', value: 'Online', tone: 'green' },
    { label: 'Bots', value: '1 / 7', tone: 'amber' },
    { label: 'Jobs', value: '1 Running', tone: 'blue' },
    { label: 'CPU', value: '18%', tone: 'neutral', percent: 18 },
    { label: 'Memory', value: '42%', tone: 'neutral', percent: 42 }
  ])

  const worldSummary = ref<WorldSummary>({
    day: 241,
    time: '10:42 AM',
    surveyProgress: 42,
    hazards: 9,
    landmarks: 4,
    walkablePercent: 71
  })

  const uptime = computed(() => {
    const elapsed = Date.now() - startedAt.value
    const hours = Math.floor(elapsed / 3_600_000)
    const minutes = Math.floor((elapsed % 3_600_000) / 60_000)
    return `${hours}h ${minutes}m`
  })

  const metrics = computed<DashboardMetric[]>(() => [
    {
      id: 'bots-online',
      label: 'Bots Online',
      value: '1 / 7',
      helper: 'Maphew active; crew planned',
      icon: 'i-lucide-bot',
      accent: 'green'
    },
    {
      id: 'active-jobs',
      label: 'Active Jobs',
      value: '1',
      helper: '5 placeholders',
      icon: 'i-lucide-clipboard-list',
      accent: 'blue'
    },
    {
      id: 'blocks-mined',
      label: 'Blocks Mined',
      value: blocksMined.value.toLocaleString(),
      helper: 'Live placeholder',
      icon: 'i-lucide-box',
      accent: 'violet'
    },
    {
      id: 'items-crafted',
      label: 'Items Crafted',
      value: '128',
      helper: 'Today',
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
    'Mineflayer 4.x',
    'Node 20.x',
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

  function startLiveCounters() {
    if (!import.meta.client || liveTimer.value) {
      return
    }

    if (!hasRandomizedBlocks.value) {
      blocksMined.value = 1200 + Math.floor(Math.random() * 1900)
      hasRandomizedBlocks.value = true
    }

    liveTimer.value = setInterval(() => {
      blocksMined.value += 1 + Math.floor(Math.random() * 3)
    }, 1000)
  }

  function stopLiveCounters() {
    if (!liveTimer.value) {
      return
    }

    clearInterval(liveTimer.value)
    liveTimer.value = null
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
    metrics,
    worldSummary,
    refreshAiUsage,
    startLiveCounters,
    stopLiveCounters
  }
})

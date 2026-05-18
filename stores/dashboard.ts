import { defineStore } from 'pinia'
import type { ActivityEvent, BotRow, DashboardMetric, HealthStat, JobRow, SparklineMetric, WorldSummary } from '~/types/dashboard'

const lowThousandsStart = 1800

export const useDashboardStore = defineStore('dashboard', () => {
  const blocksMined = ref(lowThousandsStart)
  const hasRandomizedBlocks = ref(false)
  const liveTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const startedAt = ref(Date.now() - 2 * 60 * 60 * 1000 - 17 * 60 * 1000)

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
      status: 'Working',
      statusTone: 'green',
      currentJob: 'Clearing tunnel section',
      jobDetail: '91, 54, -245 to 91, 54, -215',
      location: '91, 54, -230',
      tool: 'Iron pickaxe',
      inventoryPercent: 64
    },
    {
      id: 'doug',
      name: 'Doug',
      role: 'Digger Worker',
      avatar: 'D',
      status: 'Going To',
      statusTone: 'blue',
      currentJob: 'Following leader',
      jobDetail: 'checkpoint sync',
      location: '89, 54, -230',
      tool: 'Stone pickaxe',
      inventoryPercent: 61
    },
    {
      id: 'anvilannie',
      name: 'AnvilAnnie',
      role: 'Blacksmith',
      avatar: 'A',
      status: 'Working',
      statusTone: 'green',
      currentJob: 'Smelting iron ore',
      jobDetail: 'furnace array',
      location: 'Base Camp',
      tool: 'Furnace',
      inventoryPercent: 47
    },
    {
      id: 'chesterton',
      name: 'Chesterton',
      role: 'Stocker',
      avatar: 'H',
      status: 'Working',
      statusTone: 'green',
      currentJob: 'Restocking build chest',
      jobDetail: 'Stone -> Build Chest',
      location: 'Storage Room',
      tool: 'Chest',
      inventoryPercent: 72
    },
    {
      id: 'sprucelee',
      name: 'SpruceLee',
      role: 'Gatherer',
      avatar: 'S',
      status: 'Planned',
      statusTone: 'amber',
      currentJob: 'Gathering oak logs',
      jobDetail: 'dark oak forest',
      location: '234, 64, 512',
      tool: 'Axe',
      inventoryPercent: 38
    },
    {
      id: 'blocko',
      name: 'Blocko',
      role: 'Builder',
      avatar: 'B',
      status: 'Paused',
      statusTone: 'neutral',
      currentJob: 'Paused by user',
      jobDetail: 'awaiting build plan',
      location: 'Workshop',
      tool: 'Blocks',
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
      id: 'clear-tunnel-003',
      label: 'Clearing tunnel section',
      icon: 'i-lucide-pickaxe',
      detail: '91, 54, -245 to 91, 54, -215',
      assigned: 'CaptainCobble',
      progress: 63,
      status: 'Running',
      approval: 'Approved'
    },
    {
      id: 'follow-leader-002',
      label: 'Following leader',
      icon: 'i-lucide-route',
      detail: '89, 54, -215 to checkpoint',
      assigned: 'Doug',
      progress: 63,
      status: 'Running',
      approval: 'Not required'
    },
    {
      id: 'smelt-tools-001',
      label: 'Smelting iron ore',
      icon: 'i-lucide-flame',
      detail: 'furnace array',
      assigned: 'AnvilAnnie',
      progress: 41,
      status: 'Running',
      approval: 'Not required'
    },
    {
      id: 'restock-build-001',
      label: 'Restock build chest',
      icon: 'i-lucide-package',
      detail: 'Stone -> Build Chest',
      assigned: 'Chesterton',
      progress: 28,
      status: 'Running',
      approval: 'Not required'
    },
    {
      id: 'gather-oak-001',
      label: 'Gathering oak logs',
      icon: 'i-lucide-tree-pine',
      detail: 'dark oak forest',
      assigned: 'SpruceLee',
      progress: 0,
      status: 'Queued',
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
      title: 'CaptainCobble started job',
      message: 'Clearing tunnel section',
      time: '10:41 AM',
      severity: 'info',
      icon: 'i-lucide-pickaxe'
    },
    {
      id: 'evt-3',
      title: 'Doug reached checkpoint',
      message: 'Following leader',
      time: '10:41 AM',
      severity: 'success',
      icon: 'i-lucide-route'
    },
    {
      id: 'evt-4',
      title: 'AnvilAnnie crafted',
      message: 'Iron Pickaxe x 1',
      time: '10:40 AM',
      severity: 'info',
      icon: 'i-lucide-anvil'
    },
    {
      id: 'evt-5',
      title: 'Chesterton moved items',
      message: '64x Cobblestone -> Build Chest',
      time: '10:39 AM',
      severity: 'success',
      icon: 'i-lucide-box'
    },
    {
      id: 'evt-6',
      title: 'Blocko paused',
      message: 'Paused by user',
      time: '10:35 AM',
      severity: 'warning',
      icon: 'i-lucide-pause-circle'
    }
  ])

  const aiUsage = ref<SparklineMetric[]>([
    {
      id: 'tokens-today',
      label: 'API Tokens Today',
      value: '842,316',
      helper: '+12.4% vs yesterday',
      trend: 'up',
      color: '#4ade80',
      data: [18, 24, 21, 34, 29, 37, 33, 42, 39, 48, 45, 52]
    },
    {
      id: 'world-tokens',
      label: 'World Total Tokens',
      value: '12,845,721',
      helper: 'All time',
      trend: 'steady',
      color: '#a78bfa',
      data: [18, 19, 23, 22, 28, 31, 27, 30, 34, 33, 36, 35]
    },
    {
      id: 'cost-today',
      label: 'AI Cost Today',
      value: '$1.87',
      helper: '+8.7% vs yesterday',
      trend: 'up',
      color: '#4ade80',
      data: [12, 16, 14, 21, 17, 19, 24, 20, 23, 28, 25, 27]
    },
    {
      id: 'world-cost',
      label: 'World Total Cost',
      value: '$37.42',
      helper: 'All time',
      trend: 'steady',
      color: '#a78bfa',
      data: [13, 15, 14, 17, 19, 18, 22, 23, 25, 23, 24, 25]
    }
  ])

  const healthStats = ref<HealthStat[]>([
    { label: 'Server', value: 'Online', tone: 'green' },
    { label: 'Bots', value: '6 / 7', tone: 'green' },
    { label: 'Jobs', value: '5 Running', tone: 'green' },
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
      value: '6 / 7',
      helper: 'Maphew connected',
      icon: 'i-lucide-bot',
      accent: 'green'
    },
    {
      id: 'active-jobs',
      label: 'Active Jobs',
      value: '5',
      helper: '1 queued',
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
    'OpenAI API placeholder',
    'America/Winnipeg'
  ])

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
    bots,
    events,
    footerDiagnostics,
    healthStats,
    metrics,
    worldSummary,
    startLiveCounters,
    stopLiveCounters
  }
})

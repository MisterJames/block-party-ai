<template>
  <aside class="flex w-full flex-col border-b border-slate-800 bg-slate-950/96 px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 lg:border-b-0 lg:border-r">
    <div class="flex items-center gap-3">
      <div class="grid size-10 shrink-0 place-items-center rounded-md border border-cyan-400/30 bg-slate-900/80 p-1">
        <img
          src="/brand/builder-head-logo.png"
          alt="Block Party AI builder head"
          class="size-full object-contain"
          width="32"
          height="32"
        >
      </div>
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">
          Block Party AI
        </p>
        <p class="text-xs text-slate-400">
          Minecraft Bot Crew
        </p>
      </div>
    </div>

    <nav class="mt-6 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:block lg:space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
          route.path === item.to
            ? 'bg-slate-800 text-slate-50'
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
        ]"
      >
        <UIcon :name="item.icon" class="size-4" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:mt-auto lg:block lg:space-y-4">
      <UButton
        color="error"
        variant="outline"
        block
        icon="i-lucide-pause"
        label="Pause All Bots"
        class="justify-center"
      />

      <DashboardPanel title="System Status" body-class="p-3">
        <div class="space-y-3">
          <div
            v-for="stat in healthStats"
            :key="stat.label"
            class="grid grid-cols-[1fr_auto] items-center gap-3 text-xs"
          >
            <span class="text-slate-400">{{ stat.label }}</span>
            <div class="flex items-center gap-2">
              <span :class="toneText(stat.tone)">{{ stat.value }}</span>
              <UProgress
                v-if="typeof stat.percent === 'number'"
                :model-value="stat.percent"
                size="xs"
                class="w-12"
              />
            </div>
          </div>
        </div>
      </DashboardPanel>

      <div class="dashboard-panel-muted rounded-lg p-3">
        <div class="flex items-center gap-3">
          <div class="grid size-9 place-items-center rounded-md bg-emerald-500/10 text-emerald-300">
            <UIcon name="i-lucide-blocks" class="size-5" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-100">
              {{ worldConnection?.label ?? 'Local World' }}
            </p>
            <p class="truncate text-xs text-slate-400">
              {{ worldConnection?.host ?? 'localhost' }}:{{ worldConnection?.port ?? 25565 }}
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <UBadge :color="serverBadgeColor" variant="subtle" size="sm">
                {{ serverLabel }}
              </UBadge>
              <span class="text-xs text-slate-500">{{ authLabel }}</span>
            </div>
          </div>
          <UDropdownMenu :items="serverMenuItems">
            <UTooltip text="Local server controls">
              <UButton
                icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
                class="ml-auto"
                aria-label="Local server controls"
              />
            </UTooltip>
          </UDropdownMenu>
        </div>
        <p
          v-if="store.localServerActionError"
          class="mt-2 line-clamp-2 text-xs text-amber-300"
        >
          {{ store.localServerActionError }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { HealthStat, WorldConnectionStatus } from '~/types/dashboard'

const props = defineProps<{
  healthStats: HealthStat[]
  worldConnection: WorldConnectionStatus | null
}>()

const route = useRoute()
const store = useDashboardStore()

const navItems = [
  { label: 'Overview', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Bots', to: '/bots', icon: 'i-lucide-bot' },
  { label: 'Jobs', to: '/jobs', icon: 'i-lucide-clipboard-list' },
  { label: 'Planner', to: '/planner', icon: 'i-lucide-sparkles' },
  { label: 'World', to: '/world', icon: 'i-lucide-globe-2' },
  { label: 'Chests / Items', to: '/chests', icon: 'i-lucide-package' },
  { label: 'Projects', to: '/projects', icon: 'i-lucide-folder-kanban' },
  { label: 'Logs', to: '/logs', icon: 'i-lucide-list' },
  { label: 'Settings', to: '/settings', icon: 'i-lucide-settings' }
]

function toneText(tone: HealthStat['tone']) {
  return {
    green: 'text-emerald-300',
    amber: 'text-amber-300',
    blue: 'text-sky-300',
    neutral: 'text-slate-200'
  }[tone]
}

const server = computed(() => store.localServer)

const serverLabel = computed(() => {
  if (!server.value) return 'Loading'
  if (server.value.ready) return 'Online'
  if (server.value.state === 'blocked') return 'Blocked'
  if (server.value.state === 'starting') return 'Starting'
  if (server.value.state === 'stopping') return 'Stopping'
  if (server.value.state === 'failed') return 'Failed'
  return 'Stopped'
})

const serverBadgeColor = computed(() => {
  if (server.value?.ready) return 'success'
  if (server.value?.state === 'blocked' || server.value?.state === 'failed') return 'warning'
  return 'neutral'
})

const authLabel = computed(() => props.worldConnection?.auth === 'offline' ? 'Offline Mode' : 'Auth configured')

const serverMenuItems = computed(() => [
  [
    {
      label: 'Start local server',
      icon: 'i-lucide-play',
      disabled: !server.value?.canStart,
      onSelect: () => store.startLocalServer()
    },
    {
      label: 'Stop local server',
      icon: 'i-lucide-square',
      disabled: !server.value?.pid && !server.value?.ready,
      onSelect: () => store.stopLocalServer()
    },
    {
      label: 'Refresh status',
      icon: 'i-lucide-refresh-cw',
      onSelect: () => store.refreshOperationalStatus()
    }
  ]
])
</script>

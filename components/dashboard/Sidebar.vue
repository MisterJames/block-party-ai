<template>
  <aside class="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-950/96 px-4 py-4">
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

    <nav class="mt-6 space-y-1">
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

    <div class="mt-auto space-y-4">
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
            <p class="text-sm font-medium text-slate-100">
              Local World
            </p>
            <p class="text-xs text-slate-400">
              127.0.0.1:25565
            </p>
            <p class="mt-1 flex items-center gap-1 text-xs text-emerald-300">
              <span class="size-1.5 rounded-full bg-emerald-400" />
              Offline Mode
            </p>
          </div>
          <UIcon name="i-lucide-chevron-down" class="ml-auto size-4 text-slate-500" />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { HealthStat } from '~/types/dashboard'

defineProps<{
  healthStats: HealthStat[]
}>()

const route = useRoute()

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
</script>

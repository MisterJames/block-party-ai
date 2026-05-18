<template>
  <UCard
    :ui="{ root: 'dashboard-panel rounded-lg', body: 'p-4' }"
  >
    <div class="flex items-center gap-3">
      <div :class="['flex size-10 items-center justify-center rounded-md', accentClasses.iconWrap]">
        <UIcon :name="metric.icon" :class="['size-5', accentClasses.icon]" />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-slate-400">
          {{ metric.label }}
        </p>
        <p
          :data-testid="metric.id"
          class="mt-1 text-xl font-semibold leading-none tracking-normal text-slate-50"
        >
          {{ metric.value }}
        </p>
        <p :class="['mt-1 text-xs', accentClasses.text]">
          {{ metric.helper }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { DashboardMetric } from '~/types/dashboard'

const props = defineProps<{
  metric: DashboardMetric
}>()

const accentClasses = computed(() => {
  const classes = {
    green: {
      iconWrap: 'bg-emerald-500/10',
      icon: 'text-emerald-300',
      text: 'text-emerald-300'
    },
    blue: {
      iconWrap: 'bg-sky-500/10',
      icon: 'text-sky-300',
      text: 'text-sky-300'
    },
    violet: {
      iconWrap: 'bg-violet-500/10',
      icon: 'text-violet-300',
      text: 'text-violet-300'
    },
    amber: {
      iconWrap: 'bg-amber-500/10',
      icon: 'text-amber-300',
      text: 'text-amber-300'
    },
    cyan: {
      iconWrap: 'bg-cyan-500/10',
      icon: 'text-cyan-300',
      text: 'text-cyan-300'
    }
  }

  return classes[props.metric.accent]
})
</script>

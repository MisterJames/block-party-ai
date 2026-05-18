<template>
  <DashboardPanel body-class="p-0">
    <div class="grid grid-cols-1 divide-y divide-slate-700/70 xl:grid-cols-[250px_repeat(4,minmax(0,1fr))] xl:divide-x xl:divide-y-0">
      <div class="flex items-center gap-3 px-5 py-4">
        <div class="flex size-12 items-center justify-center rounded-md bg-violet-500/10 text-violet-300">
          <UIcon name="i-lucide-brain-circuit" class="size-7" />
        </div>
        <div>
          <div class="flex items-baseline gap-2">
            <h2 class="text-sm font-semibold text-slate-50">
              AI Usage
            </h2>
            <span class="text-xs text-slate-400">(OpenAI API)</span>
          </div>
          <p class="mt-1 text-xs text-slate-400">
            Planner usage and costs
          </p>
          <div class="mt-2 flex items-center gap-2">
            <UBadge color="info" variant="subtle" size="sm">
              Local JSONL
            </UBadge>
            <UBadge
              v-if="summary?.unpricedRecords"
              color="warning"
              variant="subtle"
              size="sm"
            >
              Pricing needed
            </UBadge>
          </div>
        </div>
      </div>

      <div
        v-for="metric in metrics"
        :key="metric.id"
        class="grid grid-cols-[1fr_104px] items-center gap-3 px-5 py-4"
      >
        <div class="min-w-0">
          <p class="text-xs text-slate-400">
            {{ metric.label }}
          </p>
          <p class="mt-1 text-xl font-semibold leading-none text-slate-50">
            {{ metric.value }}
          </p>
          <p :class="['mt-1 text-xs', helperColor(metric)]">
            {{ metric.helper }}
          </p>
        </div>
        <ClientOnly>
          <VChart
            class="h-12 w-full"
            :option="sparklineOption(metric)"
            autoresize
          />
        </ClientOnly>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 border-t border-slate-800 px-5 py-3 text-xs sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
      <div class="min-w-0">
        <p class="text-slate-500">Current Model</p>
        <p class="mt-1 truncate font-medium text-slate-200">
          {{ summary?.currentModel ?? 'Not recorded' }}
        </p>
      </div>
      <div class="min-w-0">
        <p class="text-slate-500">Last Planner Call</p>
        <p class="mt-1 truncate font-medium text-slate-200">
          {{ formatLastCall(summary?.lastCallAt) }}
        </p>
      </div>
      <div class="min-w-0">
        <p class="text-slate-500">Usage Store</p>
        <UTooltip :text="storageTooltip">
          <p class="mt-1 truncate font-medium text-slate-200">
            {{ summary?.storage.path ?? 'state/ai-usage.jsonl' }}
          </p>
        </UTooltip>
      </div>
      <div class="min-w-0">
        <p class="text-slate-500">Record Health</p>
        <p :class="['mt-1 truncate font-medium', error ? 'text-red-300' : 'text-slate-200']">
          {{ healthLabel }}
        </p>
      </div>
    </div>
  </DashboardPanel>
</template>

<script setup lang="ts">
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { AiUsageDashboardSummary, SparklineMetric } from '~/types/dashboard'

const props = defineProps<{
  metrics: SparklineMetric[]
  summary?: AiUsageDashboardSummary | null
  error?: string
}>()

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const storageTooltip = computed(() => {
  if (!props.summary) {
    return 'Usage records are stored outside Nuxt build output.'
  }

  return props.summary.storage.survivesNuxtCleanup
    ? 'Append-only local file ignored by git and not touched by Nuxt cleanup.'
    : 'Check storage configuration before relying on this path.'
})

const healthLabel = computed(() => {
  if (props.error) {
    return 'Usage API unavailable'
  }

  if (!props.summary) {
    return 'Loading usage summary'
  }

  if (props.summary.skippedLines > 0) {
    return `${props.summary.skippedLines} malformed records skipped`
  }

  return `${props.summary.recordsTotal} records loaded`
})

function helperColor(metric: SparklineMetric) {
  if (metric.tone === 'warning') return 'text-amber-300'
  if (metric.tone === 'success' || metric.trend === 'up') return 'text-emerald-300'
  return 'text-slate-400'
}

function formatLastCall(timestamp?: string | null) {
  if (!timestamp) {
    return 'No calls recorded'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

function sparklineOption(metric: SparklineMetric) {
  return {
    animation: false,
    grid: {
      left: 0,
      right: 0,
      top: 6,
      bottom: 6
    },
    xAxis: {
      type: 'category',
      show: false,
      data: metric.data.map((_, index) => index)
    },
    yAxis: {
      type: 'value',
      show: false,
      min: Math.min(...metric.data) - 4,
      max: Math.max(...metric.data) + 4
    },
    tooltip: { show: false },
    series: [
      {
        type: 'line',
        data: metric.data,
        symbol: 'none',
        smooth: true,
        lineStyle: {
          width: 2,
          color: metric.color
        },
        areaStyle: {
          color: `${metric.color}22`
        }
      }
    ]
  }
}
</script>

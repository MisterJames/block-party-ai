<template>
  <DashboardPanel body-class="p-0">
    <div class="grid grid-cols-[250px_repeat(4,minmax(0,1fr))] divide-x divide-slate-700/70">
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
          <p :class="['mt-1 text-xs', metric.trend === 'up' ? 'text-emerald-300' : 'text-slate-400']">
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
  </DashboardPanel>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import type { SparklineMetric } from '~/types/dashboard'

defineProps<{
  metrics: SparklineMetric[]
}>()

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

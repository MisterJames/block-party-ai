<template>
  <DashboardPanel title="Activity Feed" body-class="p-3">
    <template #header>
      <UButton label="View All" to="/logs" color="neutral" variant="soft" size="xs" />
    </template>

    <div class="space-y-2">
      <div
        v-for="event in events"
        :key="event.id"
        class="grid grid-cols-[28px_1fr_auto] gap-3 rounded-md px-2 py-1.5 hover:bg-slate-900/70"
      >
        <div :class="['grid size-7 place-items-center rounded-md', severityBg(event.severity)]">
          <UIcon :name="event.icon" :class="['size-4', severityText(event.severity)]" />
        </div>
        <div class="min-w-0">
          <p class="truncate text-xs font-medium text-slate-100">
            {{ event.title }}
          </p>
          <p class="truncate text-xs text-slate-400">
            {{ event.message }}
          </p>
        </div>
        <time class="text-xs text-slate-500">{{ event.time }}</time>
      </div>
    </div>
  </DashboardPanel>
</template>

<script setup lang="ts">
import type { ActivityEvent, Severity } from '~/types/dashboard'

defineProps<{
  events: ActivityEvent[]
}>()

function severityBg(severity: Severity) {
  return {
    info: 'bg-sky-500/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10'
  }[severity]
}

function severityText(severity: Severity) {
  return {
    info: 'text-sky-300',
    success: 'text-emerald-300',
    warning: 'text-amber-300',
    danger: 'text-red-300'
  }[severity]
}
</script>

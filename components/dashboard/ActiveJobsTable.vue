<template>
  <DashboardPanel title="Active Jobs" body-class="p-0">
    <template #header>
      <UButton label="View All Jobs" to="/jobs" color="neutral" variant="soft" size="xs" />
    </template>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[760px] table-fixed text-left text-xs">
      <thead class="border-b border-slate-700/70 text-slate-400">
        <tr>
          <th class="w-[38%] px-4 py-2 font-medium">Job</th>
          <th class="w-[18%] px-3 py-2 font-medium">Assigned</th>
          <th class="w-[18%] px-3 py-2 font-medium">Progress</th>
          <th class="w-[13%] px-3 py-2 font-medium">State</th>
          <th class="w-[13%] px-3 py-2 font-medium">Approval</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/80">
        <tr
          v-for="job in jobs"
          :key="job.id"
          class="hover:bg-slate-900/70"
        >
          <td class="px-4 py-2.5">
            <div class="flex items-center gap-2">
              <UIcon :name="job.icon" class="size-4 text-amber-300" />
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-100">{{ job.label }}</p>
                <p class="truncate text-slate-500">{{ job.detail }}</p>
              </div>
            </div>
          </td>
          <td class="truncate px-3 py-2.5 text-slate-300">{{ job.assigned }}</td>
          <td class="px-3 py-2.5">
            <div class="flex items-center gap-2">
              <span class="w-8 text-right text-slate-400">{{ job.progress }}%</span>
              <UProgress :model-value="job.progress" size="xs" />
            </div>
          </td>
          <td class="px-3 py-2.5">
            <UBadge :color="statusColor(job.status)" variant="subtle" size="sm">
              {{ job.status }}
            </UBadge>
          </td>
          <td class="px-3 py-2.5">
            <UBadge :color="job.approval === 'Pending' ? 'warning' : 'neutral'" variant="subtle" size="sm">
              {{ job.approval }}
            </UBadge>
          </td>
        </tr>
      </tbody>
      </table>
    </div>
  </DashboardPanel>
</template>

<script setup lang="ts">
import type { JobRow } from '~/types/dashboard'

defineProps<{
  jobs: JobRow[]
}>()

function statusColor(status: JobRow['status']) {
  return {
    Running: 'success',
    Queued: 'info',
    Waiting: 'neutral',
    Proposed: 'warning',
    Blocked: 'warning',
    Completed: 'success'
  }[status] as 'success' | 'info' | 'neutral' | 'warning'
}
</script>

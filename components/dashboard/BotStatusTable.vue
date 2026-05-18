<template>
  <DashboardPanel title="Bots" body-class="p-0">
    <template #header>
      <UTooltip text="Placeholder crew status settings">
        <UButton icon="i-lucide-settings-2" color="neutral" variant="ghost" size="xs" />
      </UTooltip>
    </template>

    <div class="overflow-hidden">
      <table class="w-full table-fixed text-left text-xs">
        <thead class="border-b border-slate-700/70 text-slate-400">
          <tr>
            <th class="w-[28%] px-4 py-2 font-medium">Bot</th>
            <th class="w-[15%] px-3 py-2 font-medium">Role</th>
            <th class="w-[13%] px-3 py-2 font-medium">Status</th>
            <th class="w-[24%] px-3 py-2 font-medium">Current Job</th>
            <th class="w-[12%] px-3 py-2 font-medium">Location</th>
            <th class="w-[8%] px-3 py-2 font-medium">Tool</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/80">
          <tr
            v-for="bot in bots"
            :key="bot.id"
            class="hover:bg-slate-900/70"
          >
            <td class="px-4 py-2.5">
              <div class="flex items-center gap-3">
                <div class="grid size-8 shrink-0 place-items-center rounded-md border border-slate-600 bg-slate-800 text-xs font-bold text-slate-100">
                  {{ bot.avatar }}
                </div>
                <div class="min-w-0">
                  <p class="truncate font-medium text-slate-100">{{ bot.name }}</p>
                  <p class="truncate text-slate-500">({{ bot.role }})</p>
                </div>
              </div>
            </td>
            <td class="px-3 py-2.5">
              <UBadge :color="roleColor(bot.role)" variant="subtle" size="sm">
                {{ bot.role }}
              </UBadge>
            </td>
            <td class="px-3 py-2.5">
              <UBadge :color="statusColor(bot.statusTone)" variant="subtle" size="sm">
                {{ bot.status }}
              </UBadge>
            </td>
            <td class="px-3 py-2.5">
              <p class="truncate font-medium text-slate-100">{{ bot.currentJob }}</p>
              <p class="truncate text-slate-500">{{ bot.jobDetail }}</p>
            </td>
            <td class="truncate px-3 py-2.5 text-slate-300">
              {{ bot.location }}
            </td>
            <td class="px-3 py-2.5">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-wrench" class="size-4 text-amber-300" />
                <UProgress
                  v-if="bot.inventoryPercent !== null"
                  :model-value="bot.inventoryPercent"
                  size="xs"
                  class="w-12"
                />
                <span v-else class="text-slate-500">--</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs">
        <span class="text-emerald-300">6 of 7 bots online</span>
        <UButton label="View All Bots" to="/bots" color="neutral" variant="soft" size="xs" />
      </div>
    </div>
  </DashboardPanel>
</template>

<script setup lang="ts">
import type { BotRow } from '~/types/dashboard'

defineProps<{
  bots: BotRow[]
}>()

function statusColor(tone: BotRow['statusTone']) {
  return {
    green: 'success',
    blue: 'info',
    amber: 'warning',
    neutral: 'neutral'
  }[tone] as 'success' | 'info' | 'warning' | 'neutral'
}

function roleColor(role: string) {
  if (role.includes('Digger')) return 'secondary'
  if (role === 'Blacksmith') return 'warning'
  if (role === 'Stocker') return 'info'
  if (role === 'Cartographer') return 'primary'
  if (role === 'Builder') return 'warning'
  return 'success'
}
</script>

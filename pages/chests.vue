<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="space-y-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Simulated logistics</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">Chests / Items</h1>
          <p class="mt-1 text-sm text-slate-400">Track known storage, bot inventories, recipes, low stock, and item movement.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton to="/jobs" icon="i-lucide-clipboard-list" label="Jobs" color="neutral" variant="soft" size="xs" />
          <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="ghost" size="xs" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStatusCard
          v-for="metric in logisticsMetrics"
          :key="metric.id"
          :metric="metric"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardPanel title="Chest Registry" description="Durable simulated storage state" body-class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[860px] table-fixed text-left text-xs">
              <thead class="border-b border-slate-700/70 text-slate-400">
                <tr>
                  <th class="w-[22%] px-4 py-2 font-medium">Chest</th>
                  <th class="w-[12%] px-3 py-2 font-medium">Kind</th>
                  <th class="w-[18%] px-3 py-2 font-medium">Owner</th>
                  <th class="w-[18%] px-3 py-2 font-medium">Location</th>
                  <th class="w-[30%] px-3 py-2 font-medium">Items</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr
                  v-for="chest in logistics?.chests ?? []"
                  :key="chest.id"
                  :class="[
                    'cursor-pointer hover:bg-slate-900/70',
                    selectedChestId === chest.id ? 'bg-slate-900' : ''
                  ]"
                  @click="selectedChestId = chest.id"
                >
                  <td class="px-4 py-2.5">
                    <p class="truncate font-medium text-slate-100">{{ chest.label }}</p>
                    <p class="mt-1 line-clamp-1 text-slate-500">{{ chest.purpose }}</p>
                  </td>
                  <td class="px-3 py-2.5">
                    <UBadge color="info" variant="subtle" size="sm">{{ kindLabel(chest.kind) }}</UBadge>
                  </td>
                  <td class="px-3 py-2.5 text-slate-300">{{ botName(chest.ownerBotId) }}</td>
                  <td class="px-3 py-2.5 text-slate-400">{{ chest.location.label }}</td>
                  <td class="px-3 py-2.5 text-slate-400">{{ stackSummary(chest.items) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <div class="space-y-3">
          <DashboardPanel title="Selected Chest" :description="selectedChest?.location.label ?? 'Choose a chest'">
            <div v-if="selectedChest" class="space-y-3 text-xs">
              <div>
                <p class="font-medium text-slate-100">{{ selectedChest.label }}</p>
                <p class="mt-1 leading-5 text-slate-500">{{ selectedChest.purpose }}</p>
              </div>

              <div class="space-y-2">
                <div
                  v-for="stack in selectedChest.items"
                  :key="stack.itemId"
                  class="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <span class="text-slate-200">{{ stack.label }}</span>
                  <span class="font-medium text-slate-100">x{{ stack.count }}</span>
                </div>
                <p v-if="!selectedChest.items.length" class="text-slate-500">No items recorded.</p>
              </div>

              <div>
                <p class="mb-2 font-medium text-slate-200">Minimums</p>
                <div class="space-y-2">
                  <div
                    v-for="minimum in selectedChest.minimums"
                    :key="minimum.itemId"
                    class="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <span class="text-slate-400">{{ minimum.label }}</span>
                    <UBadge :color="minimumColor(selectedChest.id, minimum.itemId)" variant="subtle" size="sm">
                      {{ stackCount(selectedChest.items, minimum.itemId) }} / {{ minimum.count }}
                    </UBadge>
                  </div>
                  <p v-if="!selectedChest.minimums.length" class="text-slate-500">No minimum stock rule.</p>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-slate-500">Loading logistics state.</p>
          </DashboardPanel>

          <DashboardPanel title="Low Stock" description="Requests this phase can turn into jobs" body-class="p-0">
            <div class="divide-y divide-slate-800">
              <div
                v-for="warning in logistics?.lowStockWarnings ?? []"
                :key="`${warning.chestId}:${warning.itemId}`"
                class="p-3 text-xs"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-amber-100">{{ warning.label }}</p>
                    <p class="mt-1 truncate text-slate-500">{{ warning.chestLabel }}</p>
                  </div>
                  <UBadge color="warning" variant="subtle" size="sm">{{ warning.current }} / {{ warning.minimum }}</UBadge>
                </div>
              </div>
              <p v-if="!logistics?.lowStockWarnings.length" class="p-3 text-xs text-slate-500">All tracked minimums are satisfied.</p>
            </div>
          </DashboardPanel>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DashboardPanel title="Bot Inventories" description="Simulated non-digger crew inventory snapshots" body-class="p-0">
          <div class="divide-y divide-slate-800">
            <div v-for="inventory in logistics?.inventories ?? []" :key="inventory.botId" class="grid grid-cols-[150px_1fr_72px] gap-3 p-3 text-xs">
              <div>
                <p class="font-medium text-slate-100">{{ botName(inventory.botId) }}</p>
                <p class="mt-1 text-slate-500">{{ inventory.freeSlots }} free slots</p>
              </div>
              <p class="truncate text-slate-400">{{ stackSummary(inventory.items) }}</p>
              <UBadge color="neutral" variant="subtle" size="sm">{{ inventory.items.length }} types</UBadge>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Recipes / Workstations" description="Approved simulated crafting shapes" body-class="p-0">
          <div class="divide-y divide-slate-800">
            <div v-for="recipe in logistics?.recipes ?? []" :key="recipe.id" class="p-3 text-xs">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium text-slate-100">{{ recipe.label }}</p>
                  <p class="mt-1 text-slate-500">{{ recipe.station }} · {{ botName(recipe.ownerBotId) }}</p>
                </div>
                <UBadge color="success" variant="subtle" size="sm">{{ stackSummary(recipe.outputs) }}</UBadge>
              </div>
              <p class="mt-2 text-slate-400">Inputs: {{ stackSummary(recipe.inputs) }}</p>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Movement History" description="Item effects emitted by simulated job steps" body-class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[840px] table-fixed text-left text-xs">
            <thead class="border-b border-slate-700/70 text-slate-400">
              <tr>
                <th class="w-[18%] px-4 py-2 font-medium">Item</th>
                <th class="w-[12%] px-3 py-2 font-medium">Kind</th>
                <th class="w-[24%] px-3 py-2 font-medium">From</th>
                <th class="w-[24%] px-3 py-2 font-medium">To</th>
                <th class="w-[22%] px-3 py-2 font-medium">Job</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80">
              <tr v-for="movement in (logistics?.movements ?? []).slice(0, 12)" :key="movement.id" class="hover:bg-slate-900/70">
                <td class="px-4 py-2.5 font-medium text-slate-100">{{ movement.label }} x{{ movement.count }}</td>
                <td class="px-3 py-2.5">
                  <UBadge color="neutral" variant="subtle" size="sm">{{ movement.kind }}</UBadge>
                </td>
                <td class="truncate px-3 py-2.5 text-slate-400">{{ movement.from?.label ?? 'Created' }}</td>
                <td class="truncate px-3 py-2.5 text-slate-400">{{ movement.to?.label ?? 'Consumed' }}</td>
                <td class="truncate px-3 py-2.5 text-slate-500">{{ jobLabel(movement.jobId) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!logistics?.movements.length" class="p-4 text-xs text-slate-500">No simulated item movement yet. Advance a greenlit job step from Jobs.</p>
        </div>
      </DashboardPanel>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { BotInventoryRecord, ChestRecord, CrewBotId, ItemStack, LogisticsDashboardPayload } from '~/types/coordination'
import type { DashboardMetric } from '~/types/dashboard'

const store = useDashboardStore()
const logistics = ref<LogisticsDashboardPayload | null>(null)
const selectedChestId = ref('')

const selectedChest = computed<ChestRecord | null>(() => logistics.value?.chests.find((chest) => chest.id === selectedChestId.value) ?? logistics.value?.chests[0] ?? null)

const logisticsMetrics = computed<DashboardMetric[]>(() => [
  {
    id: 'logistics-chests',
    label: 'Known Chests',
    value: String(logistics.value?.chests.length ?? 0),
    helper: 'Registered storage points',
    icon: 'i-lucide-box',
    accent: 'blue'
  },
  {
    id: 'logistics-items',
    label: 'Tracked Items',
    value: String(totalItems.value),
    helper: 'Chest + bot stacks',
    icon: 'i-lucide-package-check',
    accent: 'green'
  },
  {
    id: 'logistics-low-stock',
    label: 'Low Stock',
    value: String(logistics.value?.lowStockWarnings.length ?? 0),
    helper: 'Minimums below target',
    icon: 'i-lucide-triangle-alert',
    accent: 'amber'
  },
  {
    id: 'logistics-recipes',
    label: 'Recipes',
    value: String(logistics.value?.recipes.length ?? 0),
    helper: 'Reusable simulated crafts',
    icon: 'i-lucide-hammer',
    accent: 'cyan'
  },
  {
    id: 'logistics-movements',
    label: 'Movements',
    value: String(logistics.value?.movements.length ?? 0),
    helper: 'Logged item effects',
    icon: 'i-lucide-arrow-left-right',
    accent: 'violet'
  }
])

const totalItems = computed(() => {
  const chestItems = logistics.value?.chests.flatMap((chest) => chest.items) ?? []
  const inventoryItems = logistics.value?.inventories.flatMap((inventory) => inventory.items) ?? []

  return [...chestItems, ...inventoryItems].reduce((total, stack) => total + stack.count, 0)
})

async function refresh() {
  logistics.value = await $fetch<LogisticsDashboardPayload>('/api/chests')
  selectedChestId.value ||= logistics.value.chests[0]?.id ?? ''
  await store.refreshOperationalStatus()
}

function stackSummary(stacks: ItemStack[]) {
  if (!stacks.length) return 'Empty'

  return stacks.map((stack) => `${stack.label} x${stack.count}`).join(', ')
}

function stackCount(stacks: ItemStack[], itemId: string) {
  return stacks.find((stack) => stack.itemId === itemId)?.count ?? 0
}

function minimumColor(chestId: string, itemId: string) {
  return logistics.value?.lowStockWarnings.some((warning) => warning.chestId === chestId && warning.itemId === itemId) ? 'warning' : 'success'
}

function kindLabel(kind: ChestRecord['kind']) {
  return kind.replace('_', ' ')
}

function botName(id: CrewBotId | null) {
  if (!id) return 'Shared'

  const inventory = logistics.value?.inventories.find((item: BotInventoryRecord) => item.botId === id)
  const names: Record<CrewBotId, string> = {
    maphew: 'Maphew',
    snackwella: 'Snackwella',
    chesterton: 'Chesterton',
    anvilannie: 'AnvilAnnie',
    blocko: 'Blocko',
    sprucelee: 'SpruceLee',
    'captain-cobble': 'CaptainCobble',
    doug: 'Doug'
  }

  return inventory ? names[id] : names[id]
}

function jobLabel(jobId: string) {
  return store.operationalStatus?.coordination.jobs.find((job) => job.id === jobId)?.label ?? jobId
}

onMounted(() => {
  refresh()
  store.startOperationalPolling()
})

onBeforeUnmount(() => {
  store.stopOperationalPolling()
})
</script>

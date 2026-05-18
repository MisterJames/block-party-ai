<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="space-y-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Cartography</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">World</h1>
          <p class="mt-1 text-sm text-slate-400">Maphew survey map and local spawn findings.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="surveyStatusColor" variant="subtle" size="lg">
            {{ surveyMap?.status ?? 'loading' }}
          </UBadge>
          <UButton icon="i-lucide-refresh-cw" label="Refresh" color="neutral" variant="soft" size="xs" @click="refreshSurveyMap" />
          <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="soft" size="xs" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <DashboardStatusCard
          v-for="metric in worldMetrics"
          :key="metric.id"
          :metric="metric"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_390px]">
        <DashboardPanel title="Spawn Survey Map" description="Pixelated Maphew samples" body-class="p-3">
          <template #header>
            <div class="flex flex-wrap items-center gap-1.5">
              <UButton
                v-for="layer in layerButtons"
                :key="layer.key"
                :icon="layer.icon"
                :label="layer.label"
                :color="layers[layer.key] ? 'primary' : 'neutral'"
                :variant="layers[layer.key] ? 'soft' : 'ghost'"
                size="xs"
                @click="layers[layer.key] = !layers[layer.key]"
              />
            </div>
          </template>

          <div v-if="surveyMap" class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px]">
            <WorldSurveyMapCanvas
              :payload="surveyMap"
              :layers="layers"
              :hover-point="hoverPoint"
              :selected-point="selectedPoint"
              @hover-point="hoverPoint = $event"
            />
            <div class="space-y-3 text-xs">
              <div class="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <p class="font-medium text-slate-100">Pinned Finding</p>
                <div v-if="selectedPoint" class="mt-2 space-y-1 text-slate-300" data-testid="world-map-selected">
                  <p class="text-cyan-200">{{ selectedPoint.type }}</p>
                  <p>{{ selectedPoint.x }}, {{ selectedPoint.z }} · Y {{ selectedPoint.surfaceY ?? '--' }}</p>
                  <p>{{ selectedPoint.surfaceBlock ?? 'unknown' }} · {{ selectedPoint.walkable ? 'walkable' : 'not walkable' }}</p>
                  <p v-if="selectedPoint.error" class="text-amber-300">{{ selectedPoint.error }}</p>
                  <UButton label="Clear Pin" color="neutral" variant="soft" size="xs" class="mt-2" @click="selectedPoint = null" />
                </div>
                <p v-else class="mt-2 text-slate-500">Hover or click a finding from the sidebar.</p>
              </div>

              <div class="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <p class="font-medium text-slate-100">Survey Store</p>
                <p class="mt-1 break-words font-mono text-slate-400">{{ surveyMap.parsing.storagePath }}</p>
                <p class="mt-2 text-slate-500">
                  {{ surveyMap.parsing.skippedLines }} skipped lines · {{ surveyMap.parsing.duplicateCoordinates }} replaced samples
                </p>
              </div>
            </div>
          </div>

          <div v-else class="grid min-h-[420px] place-items-center text-sm text-slate-400">
            {{ surveyMapError || 'Loading survey map...' }}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Findings" description="Hazards, landmarks, and sampled surfaces" body-class="p-0">
          <div v-if="surveyMap" class="max-h-[760px] overflow-y-auto">
            <div class="border-b border-slate-800 p-3">
              <UInput
                v-model="findingFilter"
                icon="i-lucide-search"
                placeholder="Filter findings"
                size="xs"
              />
            </div>

            <UAccordion
              :items="findingSections"
              :default-value="['hazards', 'landmarks']"
              type="multiple"
              collapsible
              :ui="{ trigger: 'px-3 py-2 text-xs', content: 'pb-2' }"
            >
              <template #content="{ item }">
                <div class="space-y-2 px-3">
                  <div
                    v-for="group in filteredGroups(item.groups)"
                    :key="group.id"
                    class="rounded-md border border-slate-800 bg-slate-950/50"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs"
                      @click="toggleGroup(group.id)"
                    >
                      <span class="truncate font-medium text-slate-100">{{ group.type }}</span>
                      <UBadge :color="categoryColor(group.category)" variant="subtle" size="sm">
                        {{ group.count }}
                      </UBadge>
                    </button>
                    <div v-if="expandedGroups.has(group.id)" class="border-t border-slate-800">
                      <button
                        v-for="point in group.points.slice(0, 18)"
                        :key="point.id"
                        type="button"
                        class="grid w-full grid-cols-[1fr_auto] gap-2 px-3 py-2 text-left text-xs hover:bg-slate-900"
                        :data-testid="`finding-point-${point.category}`"
                        @mouseenter="hoverPoint = point"
                        @mouseleave="hoverPoint = null"
                        @click="selectedPoint = point"
                      >
                        <span class="min-w-0">
                          <span class="block truncate text-slate-200">{{ point.x }}, {{ point.z }} · Y {{ point.surfaceY ?? '--' }}</span>
                          <span class="block truncate text-slate-500">{{ point.surfaceBlock ?? 'unknown' }} · {{ point.walkable ? 'walkable' : 'not walkable' }}</span>
                        </span>
                        <UIcon name="i-lucide-map-pin" class="mt-1 size-3.5 text-slate-500" />
                      </button>
                      <p v-if="group.points.length > 18" class="px-3 py-2 text-xs text-slate-500">
                        {{ group.points.length - 18 }} more samples hidden
                      </p>
                    </div>
                  </div>
                  <p v-if="!filteredGroups(item.groups).length" class="py-2 text-xs text-slate-500">No matching findings.</p>
                </div>
              </template>
            </UAccordion>
          </div>

          <div v-else class="p-4 text-sm text-slate-400">
            Findings load after the survey map payload.
          </div>
        </DashboardPanel>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { DashboardMetric, SurveyFindingGroup, SurveyFindingPoint, SurveyMapLayerState, SurveyMapPayload } from '~/types/dashboard'

const store = useDashboardStore()
const surveyMap = ref<SurveyMapPayload | null>(null)
const surveyMapError = ref('')
const findingFilter = ref('')
const expandedGroups = ref(new Set<string>())
const hoverPoint = ref<SurveyFindingPoint | null>(null)
const selectedPoint = ref<SurveyFindingPoint | null>(null)
const layers = reactive<SurveyMapLayerState>({
  hazards: true,
  landmarks: true,
  walkable: true,
  route: true,
  height: true
})

const layerButtons: Array<{ key: keyof SurveyMapLayerState, label: string, icon: string }> = [
  { key: 'hazards', label: 'Hazards', icon: 'i-lucide-triangle-alert' },
  { key: 'landmarks', label: 'Landmarks', icon: 'i-lucide-map-pin' },
  { key: 'walkable', label: 'Walkable', icon: 'i-lucide-footprints' },
  { key: 'route', label: 'Route', icon: 'i-lucide-route' },
  { key: 'height', label: 'Height', icon: 'i-lucide-mountain' }
]

const surveyStatusColor = computed(() => {
  if (surveyMap.value?.status === 'surveying') return 'info'
  if (surveyMap.value?.status === 'complete') return 'success'
  if (surveyMap.value?.status === 'failed' || surveyMap.value?.status === 'blocked') return 'warning'
  return 'neutral'
})

const worldMetrics = computed<DashboardMetric[]>(() => [
  {
    id: 'world-sampled',
    label: 'Sampled Tiles',
    value: `${surveyMap.value?.grid.sampledTiles ?? 0}/${surveyMap.value?.grid.totalTiles ?? 1024}`,
    helper: `${surveyMap.value?.progressPercent ?? 0}% complete`,
    icon: 'i-lucide-grid-3x3',
    accent: 'blue'
  },
  {
    id: 'world-hazards',
    label: 'Hazards',
    value: String(surveyMap.value?.stats.hazardsFound ?? 0),
    helper: 'Marked samples',
    icon: 'i-lucide-triangle-alert',
    accent: 'amber'
  },
  {
    id: 'world-landmarks',
    label: 'Landmarks',
    value: String(surveyMap.value?.stats.landmarksFound ?? 0),
    helper: 'Resources and features',
    icon: 'i-lucide-map-pin',
    accent: 'cyan'
  },
  {
    id: 'world-walkable',
    label: 'Walkable',
    value: `${surveyMap.value?.stats.walkablePercent ?? 0}%`,
    helper: `${surveyMap.value?.stats.walkableTiles ?? 0} sampled tiles`,
    icon: 'i-lucide-footprints',
    accent: 'green'
  },
  {
    id: 'world-height',
    label: 'Height Range',
    value: heightRange.value,
    helper: 'Sampled surface Y',
    icon: 'i-lucide-mountain',
    accent: 'violet'
  },
  {
    id: 'world-last-survey',
    label: 'Last Survey',
    value: lastSurveyTime.value,
    helper: 'Local display',
    icon: 'i-lucide-clock-3',
    accent: 'cyan'
  }
])

const heightRange = computed(() => {
  const stats = surveyMap.value?.stats

  if (!stats || stats.minSurfaceY === null || stats.maxSurfaceY === null) {
    return '--'
  }

  return `${stats.minSurfaceY}-${stats.maxSurfaceY}`
})

const lastSurveyTime = computed(() => {
  if (!surveyMap.value?.lastSurveyAt) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(surveyMap.value.lastSurveyAt))
})

const findingSections = computed(() => [
  { label: `Hazards (${surveyMap.value?.findings.hazards.length ?? 0})`, value: 'hazards', groups: surveyMap.value?.findings.hazards ?? [] },
  { label: `Landmarks (${surveyMap.value?.findings.landmarks.length ?? 0})`, value: 'landmarks', groups: surveyMap.value?.findings.landmarks ?? [] },
  { label: `Surface Blocks (${surveyMap.value?.findings.surfaceBlocks.length ?? 0})`, value: 'surface', groups: surveyMap.value?.findings.surfaceBlocks ?? [] },
  { label: `Sample Errors (${surveyMap.value?.findings.errors.length ?? 0})`, value: 'errors', groups: surveyMap.value?.findings.errors ?? [] }
])

onMounted(() => {
  store.refreshOperationalStatus()
  refreshSurveyMap()
})

async function refreshSurveyMap() {
  try {
    surveyMap.value = await $fetch<SurveyMapPayload>('/api/world/survey-map')
    surveyMapError.value = ''
    seedExpandedGroups()
  } catch (error) {
    surveyMapError.value = error instanceof Error ? error.message : 'Unable to load survey map'
  }
}

function seedExpandedGroups() {
  if (expandedGroups.value.size || !surveyMap.value) {
    return
  }

  const next = new Set<string>()
  for (const group of [...surveyMap.value.findings.hazards, ...surveyMap.value.findings.landmarks].slice(0, 4)) {
    next.add(group.id)
  }
  expandedGroups.value = next
}

function toggleGroup(id: string) {
  const next = new Set(expandedGroups.value)

  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }

  expandedGroups.value = next
}

function filteredGroups(groups: SurveyFindingGroup[]) {
  const filter = findingFilter.value.trim().toLowerCase()

  if (!filter) {
    return groups
  }

  return groups.filter((group) => group.type.toLowerCase().includes(filter))
}

function categoryColor(category: SurveyFindingGroup['category']) {
  return {
    hazard: 'warning',
    landmark: 'info',
    surface: 'neutral',
    error: 'error'
  }[category] as 'warning' | 'info' | 'neutral' | 'error'
}
</script>

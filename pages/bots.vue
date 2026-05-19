<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="p-4 sm:p-5">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Crew control</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">Bots</h1>
          <p class="mt-1 text-sm text-slate-400">Maphew controls are explicit; non-digger crew can now run real adapters or fallback steps.</p>
        </div>
        <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="soft" size="xs" />
      </div>

      <div class="grid min-w-0 gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div class="min-w-0 space-y-3">
          <DashboardPanel title="Maphew" description="Cartographer connection and survey controls" body-class="p-4">
            <div class="space-y-4 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-slate-500">Status</p>
                  <UBadge :color="maphewBadgeColor" variant="subtle" size="sm">
                    {{ maphewLabel }}
                  </UBadge>
                </div>
                <div>
                  <p class="text-slate-500">Location</p>
                  <p class="text-slate-200">{{ maphewLocation }}</p>
                </div>
                <div>
                  <p class="text-slate-500">Health</p>
                  <p class="text-slate-200">{{ store.maphewStatus?.health ?? '--' }}</p>
                </div>
                <div>
                  <p class="text-slate-500">Food</p>
                  <p class="text-slate-200">{{ store.maphewStatus?.food ?? '--' }}</p>
                </div>
              </div>

              <div class="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p class="font-medium text-slate-100">Spawn Survey</p>
                    <p class="text-slate-500">{{ surveyDetail }}</p>
                  </div>
                  <UBadge color="neutral" variant="subtle" size="sm">
                    {{ store.survey?.status ?? 'idle' }}
                  </UBadge>
                </div>
                <UProgress :model-value="store.survey?.progressPercent ?? 0" size="sm" />
                <div class="mt-2 grid grid-cols-3 gap-2 text-slate-400">
                  <span>{{ store.survey?.hazardsFound ?? 0 }} hazards</span>
                  <span>{{ store.survey?.landmarksFound ?? 0 }} landmarks</span>
                  <span>{{ store.survey?.walkablePercent ?? 0 }}% walkable</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <UButton
                  label="Connect"
                  icon="i-lucide-plug"
                  color="primary"
                  variant="soft"
                  size="xs"
                  :disabled="store.maphewStatus?.connected || !store.localServer?.ready"
                  @click="store.connectMaphew()"
                />
                <UButton
                  label="Disconnect"
                  icon="i-lucide-unplug"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  :disabled="!store.maphewStatus?.connected"
                  @click="store.disconnectMaphew()"
                />
                <UButton
                  label="Start Survey"
                  icon="i-lucide-map"
                  color="success"
                  variant="soft"
                  size="xs"
                  :disabled="!store.maphewStatus?.connected || store.maphewStatus?.state === 'surveying'"
                  @click="store.startMaphewSurvey()"
                />
                <UButton
                  label="Stop Survey"
                  icon="i-lucide-square"
                  color="warning"
                  variant="soft"
                  size="xs"
                  :disabled="store.maphewStatus?.state !== 'surveying'"
                  @click="store.stopMaphewSurvey()"
                />
              </div>

              <p v-if="!store.localServer?.ready" class="text-amber-300">
                Start or connect a local Minecraft server before connecting Maphew.
              </p>
              <p v-if="store.maphewActionError" class="text-amber-300">
                {{ store.maphewActionError }}
              </p>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Non-Digger Crew" description="Snackwella, Chesterton, AnvilAnnie, and Blocko" body-class="p-0">
            <div class="space-y-3 p-3 text-xs">
              <div class="grid grid-cols-2 gap-2">
                <UButton
                  label="Connect Crew"
                  icon="i-lucide-plug"
                  color="primary"
                  variant="soft"
                  size="xs"
                  :disabled="!store.localServer?.ready"
                  @click="store.connectNonDiggerCrew()"
                />
                <UButton
                  label="Disconnect Crew"
                  icon="i-lucide-unplug"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  @click="store.disconnectNonDiggerCrew()"
                />
              </div>

              <p v-if="!store.localServer?.ready" class="text-slate-500">
                Real connections wait for a reachable local server. Fallback Step still exercises the backend adapter path.
              </p>
              <p v-if="store.nonDiggerActionError" class="text-amber-300">{{ store.nonDiggerActionError }}</p>
            </div>

            <div class="divide-y divide-slate-800">
              <div v-for="bot in store.nonDiggerCrew" :key="bot.id" class="space-y-2 p-3 text-xs">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-medium text-slate-100">{{ bot.name }}</p>
                    <p class="truncate text-slate-500">{{ bot.role }} · {{ bot.mode }} adapter</p>
                  </div>
                  <UBadge :color="nonDiggerColor(bot.state)" variant="subtle" size="sm">
                    {{ bot.state }}
                  </UBadge>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <UButton
                    label="Connect"
                    icon="i-lucide-plug"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    :disabled="bot.connected || !store.localServer?.ready"
                    @click="store.connectNonDiggerBot(bot.id)"
                  />
                  <UButton
                    label="Disconnect"
                    icon="i-lucide-unplug"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :disabled="!bot.connected && bot.state === 'disconnected'"
                    @click="store.disconnectNonDiggerBot(bot.id)"
                  />
                  <UButton
                    :label="bot.connected ? 'Run Step' : 'Fallback Step'"
                    icon="i-lucide-play"
                    color="primary"
                    variant="soft"
                    size="xs"
                    @click="store.executeNonDiggerStep(bot.id)"
                  />
                </div>

                <div v-if="bot.announcements.length" class="rounded-md border border-slate-800 bg-slate-950/60 p-2">
                  <p class="mb-1 text-slate-500">Latest announcement</p>
                  <p class="text-slate-300">{{ bot.announcements[0].message }}</p>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div class="min-w-0">
          <DashboardBotStatusTable :bots="store.bots" />
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const store = useDashboardStore()

const maphewLabel = computed(() => store.bots[0]?.status ?? 'Offline')
const maphewBadgeColor = computed(() => {
  if (store.maphewStatus?.state === 'surveying') return 'info'
  if (store.maphewStatus?.connected) return 'success'
  if (store.maphewStatus?.state === 'blocked' || store.maphewStatus?.state === 'failed') return 'warning'
  return 'neutral'
})
const maphewLocation = computed(() => {
  const position = store.maphewStatus?.position

  return position ? `${position.x}, ${position.y}, ${position.z}` : 'Not connected'
})
const surveyDetail = computed(() => {
  const survey = store.survey

  if (!survey) {
    return '256 x 256 spawn area'
  }

  return `${survey.area.size.x} x ${survey.area.size.z}, every ${survey.area.sampleInterval} blocks`
})

function nonDiggerColor(state: string) {
  if (state === 'connected') return 'success'
  if (state === 'executing') return 'info'
  if (state === 'blocked' || state === 'failed') return 'warning'
  return 'neutral'
}

onMounted(() => {
  store.refreshOperationalStatus()
  store.startOperationalPolling()
})

onBeforeUnmount(() => {
  store.stopOperationalPolling()
})
</script>

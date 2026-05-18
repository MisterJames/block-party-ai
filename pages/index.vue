<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="flex min-h-screen flex-col">
      <div class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h1 class="text-xl font-semibold text-slate-50">Dashboard Overview</h1>
          <p class="mt-1 text-sm text-slate-400">Crew status at a glance</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sun" class="size-4" />
            <span>{{ currentTime }}</span>
          </div>
          <UBadge :color="systemBadgeColor" variant="subtle" size="lg">
            {{ systemBadgeLabel }}
          </UBadge>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-5">
        <DashboardStatusCard
          v-for="metric in store.metrics"
          :key="metric.id"
          :metric="metric"
        />
      </div>

      <div class="px-4 pt-3 sm:px-5">
        <LazyDashboardAiUsagePanel
          :metrics="store.aiUsage"
          :summary="store.aiUsageSummary"
          :error="store.aiUsageError"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 px-4 pt-3 sm:px-5 xl:grid-cols-[1fr_400px]">
        <DashboardBotStatusTable :bots="store.bots" />
        <DashboardActivityFeed :events="store.events" />
      </div>

      <div class="grid grid-cols-1 gap-3 px-4 py-3 sm:px-5 xl:grid-cols-[0.92fr_1fr]">
        <DashboardActiveJobsTable :jobs="store.activeJobs" />
        <DashboardWorldOverview :summary="store.worldSummary" />
      </div>

      <div class="mt-auto">
        <DashboardFooterDiagnostics :diagnostics="store.footerDiagnostics" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const store = useDashboardStore()

const currentTime = computed(() => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit'
}).format(new Date()))
const systemBadgeLabel = computed(() => {
  if (store.localServer?.ready && store.maphewStatus?.connected) return 'Crew Connected'
  if (store.localServer?.state === 'blocked') return 'Setup Needed'
  if (store.localServer?.ready) return 'Server Online'
  return 'Idle'
})
const systemBadgeColor = computed(() => {
  if (store.localServer?.ready && store.maphewStatus?.connected) return 'success'
  if (store.localServer?.state === 'blocked') return 'warning'
  return 'neutral'
})

onMounted(() => {
  store.refreshOperationalStatus()
  store.startOperationalPolling()
  store.refreshAiUsage()
})

onBeforeUnmount(() => {
  store.stopOperationalPolling()
})
</script>

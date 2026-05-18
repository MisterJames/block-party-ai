<template>
  <main class="min-h-screen min-w-[1280px] bg-slate-950 pl-64 text-slate-100">
    <DashboardSidebar :health-stats="store.healthStats" />

    <section class="flex min-h-screen flex-col">
      <div class="flex items-center justify-between px-5 py-4">
        <div>
          <h1 class="text-xl font-semibold text-slate-50">Dashboard Overview</h1>
          <p class="mt-1 text-sm text-slate-400">Crew status at a glance</p>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sun" class="size-4" />
            <span>10:42:18 AM</span>
          </div>
          <UBadge color="success" variant="subtle" size="lg">
            All Systems Go
          </UBadge>
        </div>
      </div>

      <div class="grid grid-cols-5 gap-3 px-5">
        <DashboardStatusCard
          v-for="metric in store.metrics"
          :key="metric.id"
          :metric="metric"
        />
      </div>

      <div class="px-5 pt-3">
        <DashboardAiUsagePanel :metrics="store.aiUsage" />
      </div>

      <div class="grid grid-cols-[1fr_400px] gap-3 px-5 pt-3">
        <DashboardBotStatusTable :bots="store.bots" />
        <DashboardActivityFeed :events="store.events" />
      </div>

      <div class="grid grid-cols-[0.92fr_1fr] gap-3 px-5 py-3">
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

onMounted(() => {
  store.startLiveCounters()
})

onBeforeUnmount(() => {
  store.stopLiveCounters()
})
</script>

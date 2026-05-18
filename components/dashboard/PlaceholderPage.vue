<template>
  <main class="min-h-screen bg-slate-950 pl-64 text-slate-100">
    <DashboardSidebar :health-stats="store.healthStats" />
    <section class="p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Placeholder route</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">
            {{ title }}
          </h1>
          <p class="mt-1 text-sm text-slate-400">
            {{ description }}
          </p>
        </div>
        <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="soft" />
      </div>

      <DashboardPanel title="Coming Later" body-class="p-5">
        <p class="max-w-3xl text-sm leading-6 text-slate-300">
          {{ detail }}
        </p>
      </DashboardPanel>
    </section>
  </main>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  detail: string
}>()

const store = useDashboardStore()
</script>

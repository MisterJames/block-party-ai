<template>
  <footer class="flex min-h-10 flex-col gap-2 border-t border-slate-800 bg-slate-950 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:py-0">
    <div class="flex flex-wrap items-center divide-x divide-slate-800">
      <span
        v-for="item in diagnostics.slice(0, 4)"
        :key="item"
        class="px-4 first:pl-0"
      >
        {{ item }}
      </span>
    </div>
    <div class="flex items-center gap-3">
      <span>All times local</span>
      <UBadge color="neutral" variant="soft">
        {{ diagnostics[4] }}
      </UBadge>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineProps<{
  diagnostics: string[]
}>()
</script>

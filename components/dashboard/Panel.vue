<template>
  <section class="dashboard-panel rounded-lg">
    <div
      v-if="$slots.header || title"
      class="flex items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-3"
    >
      <div>
        <h2 class="text-sm font-semibold text-slate-100">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-0.5 text-xs text-slate-400">
          {{ description }}
        </p>
      </div>
      <slot name="header" />
    </div>
    <div :class="bodyClass">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    bodyClass?: string
  }>(),
  {
    title: '',
    description: '',
    bodyClass: 'p-4'
  }
)
</script>

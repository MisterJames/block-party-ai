<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: {
    class: 'dark'
  },
  bodyAttrs: {
    class: 'bg-slate-950 text-slate-100 antialiased'
  }
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="space-y-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Planner POC</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">
            Planner
          </h1>
          <p class="mt-1 text-sm text-slate-400">
            Free-form AI call testing with local token and cost accounting.
          </p>
        </div>
        <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="soft" />
      </div>

      <LazyDashboardAiUsagePanel
        :metrics="store.aiUsage"
        :summary="store.aiUsageSummary"
        :error="store.aiUsageError"
      />

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
        <DashboardPanel title="Free-form Planner Chat" body-class="p-0">
          <template #header>
            <UBadge color="warning" variant="subtle" size="sm">
              POC only
            </UBadge>
          </template>

          <div class="flex min-h-[480px] flex-col">
            <div class="flex-1 space-y-3 overflow-y-auto p-4">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="[
                  'max-w-[820px] rounded-lg border px-3 py-2 text-sm leading-6',
                  message.role === 'user'
                    ? 'ml-auto border-cyan-500/30 bg-cyan-500/10 text-cyan-50'
                    : 'border-slate-700 bg-slate-900/80 text-slate-200'
                ]"
              >
                <div class="mb-1 flex items-center gap-2 text-xs">
                  <UIcon :name="message.role === 'user' ? 'i-lucide-user' : 'i-lucide-sparkles'" class="size-3.5" />
                  <span :class="message.role === 'user' ? 'text-cyan-200' : 'text-slate-400'">
                    {{ message.role === 'user' ? 'You' : 'Planner' }}
                  </span>
                  <span v-if="message.model" class="text-slate-500">{{ message.model }}</span>
                </div>
                <p class="whitespace-pre-wrap break-words">
                  {{ message.content }}
                </p>
              </div>
            </div>

            <form class="border-t border-slate-800 p-4" @submit.prevent="submitPrompt">
              <UTextarea
                v-model="draft"
                autoresize
                :rows="4"
                :disabled="isSubmitting"
                placeholder="Ask the planner something exploratory, like: sketch a safe first Maphew survey plan near spawn."
                class="w-full"
                @input="updateDraft"
              />
              <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p :class="['text-xs', errorMessage ? 'text-red-300' : 'text-slate-500']">
                  {{ errorMessage || 'Submits one free-form API call and records token usage locally.' }}
                </p>
                <UButton
                  type="submit"
                  icon="i-lucide-send"
                  label="Send"
                  color="primary"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                />
              </div>
            </form>
          </div>
        </DashboardPanel>

        <DashboardPanel title="POC Guardrails" body-class="p-4">
          <div class="space-y-4 text-xs text-slate-300">
            <div class="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p class="font-medium text-slate-100">What this does</p>
              <p class="mt-1 leading-5 text-slate-400">
                Sends free-form text to the planner endpoint, returns plain text, and appends an AI usage record.
              </p>
            </div>
            <div class="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
              <p class="font-medium text-amber-200">What this does not do</p>
              <p class="mt-1 leading-5 text-amber-100/80">
                It does not create jobs, approve work, move bots, or change the Minecraft world.
              </p>
            </div>
            <div class="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p class="font-medium text-slate-100">Usage path</p>
              <p class="mt-1 break-words font-mono text-slate-400">
                {{ store.aiUsageSummary?.storage.path ?? 'state/ai-usage.jsonl' }}
              </p>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
type PlannerMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  model?: string
}

type PlannerResponse = {
  model: string
  message: string
}

const store = useDashboardStore()
const draft = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const messages = ref<PlannerMessage[]>([
  {
    id: 'planner-welcome',
    role: 'assistant',
    content: 'This is a free-form planner POC. Send a prompt to make one AI API call and watch the usage cards update.'
  }
])

onMounted(() => {
  store.refreshOperationalStatus()
  store.refreshAiUsage()
})

async function submitPrompt() {
  const content = draft.value.trim()

  if (!content || isSubmitting.value) {
    return
  }

  errorMessage.value = ''
  isSubmitting.value = true
  draft.value = ''
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content
  })

  try {
    const response = await $fetch<PlannerResponse>('/api/planner/freeform', {
      method: 'POST',
      body: {
        message: content
      }
    })

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.message,
      model: response.model
    })
    await store.refreshAiUsage()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Planner request failed'
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: errorMessage.value
    })
  } finally {
    isSubmitting.value = false
  }
}

function updateDraft(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value
}
</script>

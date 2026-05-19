<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="space-y-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Coordination planning</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">Planner</h1>
          <p class="mt-1 text-sm text-slate-400">Plan goals, review proposals, and manage approval policy.</p>
        </div>
        <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="soft" size="xs" />
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStatusCard
          v-for="metric in plannerMetrics"
          :key="metric.id"
          :metric="metric"
        />
      </div>

      <div class="flex flex-wrap gap-1 rounded-md border border-slate-800 bg-slate-900/70 p-1">
        <button
          v-for="tab in plannerTabs"
          :key="tab.id"
          type="button"
          :class="[
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition',
            activeTab === tab.id
              ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          ]"
          @click="setActiveTab(tab.id)"
        >
          <UIcon :name="tab.icon" class="size-3.5" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <div v-if="activeTab === 'proposals'" class="grid grid-cols-1 gap-3 xl:grid-cols-[380px_1fr]">
        <div class="space-y-3">
          <DashboardPanel title="Planner Proposal" description="Deterministic Phase 5 proposal drafts">
            <form class="space-y-3" @submit.prevent="createProposal">
              <UTextarea
                v-model="proposalDraft"
                :rows="4"
                autoresize
                placeholder="Try: Build a foundry near the workshop, craft a hoe, or feed Maphew."
              />
              <div class="flex items-center justify-between gap-3">
                <p :class="['text-xs', actionError ? 'text-amber-300' : 'text-slate-500']">
                  {{ actionError || 'Creates proposed goals, plans, jobs, and steps without calling OpenAI.' }}
                </p>
                <UButton type="submit" label="Draft" icon="i-lucide-sparkles" color="primary" size="xs" :loading="busyAction === 'proposal'" />
              </div>
            </form>
          </DashboardPanel>

          <DashboardPanel title="Human Goal" description="Add a goal for planner review">
            <form class="space-y-3" @submit.prevent="createGoal">
              <UInput v-model="goalLabel" placeholder="Goal label" size="sm" />
              <UTextarea v-model="goalDetail" :rows="3" autoresize placeholder="What outcome should the crew plan for?" />
              <div class="flex justify-end">
                <UButton type="submit" label="Create Goal" icon="i-lucide-plus" color="neutral" variant="soft" size="xs" :loading="busyAction === 'goal'" />
              </div>
            </form>
          </DashboardPanel>
        </div>

        <DashboardPanel title="Planner Proposals" body-class="p-0">
          <div class="divide-y divide-slate-800">
            <div
              v-for="proposal in coordination?.proposals ?? []"
              :key="proposal.id"
              class="p-3 text-xs"
            >
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-medium text-slate-100">{{ proposal.label }}</p>
                    <UBadge :color="proposal.status === 'approved' ? 'success' : proposal.status === 'rejected' ? 'warning' : 'neutral'" variant="subtle" size="sm">
                      {{ proposal.status }}
                    </UBadge>
                  </div>
                  <p class="mt-1 text-slate-500">{{ proposal.jobs.length }} jobs · {{ proposal.detail }}</p>
                  <div class="mt-3 grid gap-2 md:grid-cols-2">
                    <div v-for="job in proposal.jobs" :key="job.id" class="rounded-md border border-slate-800 bg-slate-950/60 p-2">
                      <p class="font-medium text-slate-200">{{ job.label }}</p>
                      <p class="mt-1 text-slate-500">{{ botName(job.assignedBotId) }} · {{ job.steps.length }} steps</p>
                    </div>
                  </div>
                </div>
                <div class="flex shrink-0 gap-2">
                  <UButton
                    v-if="proposal.status === 'proposed'"
                    label="Approve"
                    icon="i-lucide-check"
                    color="success"
                    variant="soft"
                    size="xs"
                    :loading="busyAction === proposal.id + ':approve'"
                    @click="proposalAction(proposal.id, 'approve')"
                  />
                  <UButton
                    v-if="proposal.status === 'proposed'"
                    label="Reject"
                    icon="i-lucide-x"
                    color="warning"
                    variant="soft"
                    size="xs"
                    :loading="busyAction === proposal.id + ':reject'"
                    @click="proposalAction(proposal.id, 'reject')"
                  />
                </div>
              </div>
            </div>
            <p v-if="!coordination?.proposals.length" class="p-4 text-xs text-slate-500">
              No planner proposals yet.
            </p>
          </div>
        </DashboardPanel>
      </div>

      <div v-else-if="activeTab === 'greenlights'" class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
        <DashboardPanel title="Greenlight Rules" description="Approval policy home for repeatable low-risk work" body-class="p-0">
          <template #header>
            <UBadge color="neutral" variant="subtle" size="sm">Read-only Phase 5</UBadge>
          </template>
          <div class="divide-y divide-slate-800">
            <div
              v-for="rule in coordination?.greenlights ?? []"
              :key="rule.id"
              class="p-3 text-xs"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div class="min-w-0">
                  <p class="font-medium text-slate-100">{{ rule.label }}</p>
                  <p class="mt-1 text-slate-500">{{ rule.notes }}</p>
                  <p class="mt-2 text-slate-400">Templates: {{ rule.templateIds.join(', ') || 'None' }}</p>
                  <p class="mt-1 text-slate-400">Bots: {{ rule.botIds.map(botName).join(', ') || 'None' }}</p>
                </div>
                <div class="grid shrink-0 grid-cols-2 gap-2 text-slate-400">
                  <UBadge :color="rule.enabled ? 'success' : 'neutral'" variant="subtle" size="sm">
                    {{ rule.enabled ? 'Enabled' : 'Off' }}
                  </UBadge>
                  <UBadge color="neutral" variant="subtle" size="sm">
                    Max {{ rule.maxItemCount ?? 'n/a' }}
                  </UBadge>
                  <UBadge :color="rule.allowBlockPlacement ? 'warning' : 'neutral'" variant="subtle" size="sm">
                    Place {{ rule.allowBlockPlacement ? 'yes' : 'no' }}
                  </UBadge>
                  <UBadge :color="rule.allowBlockBreaking ? 'warning' : 'neutral'" variant="subtle" size="sm">
                    Break {{ rule.allowBlockBreaking ? 'yes' : 'no' }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Policy Boundary" body-class="p-4">
          <div class="space-y-3 text-xs text-slate-300">
            <div class="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p class="font-medium text-slate-100">Planner owns policy</p>
              <p class="mt-1 leading-5 text-slate-400">
                Proposal approval and greenlight review live here because they decide what work should exist.
              </p>
            </div>
            <div class="rounded-md border border-slate-800 bg-slate-900/70 p-3">
              <p class="font-medium text-slate-100">Jobs owns execution</p>
              <p class="mt-1 leading-5 text-slate-400">
                The Jobs page keeps queue visibility, concrete job approvals, steps, blockers, and request handling.
              </p>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <div v-else class="space-y-3">
        <LazyDashboardAiUsagePanel
          :metrics="store.aiUsage"
          :summary="store.aiUsageSummary"
          :error="store.aiUsageError"
        />

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
          <DashboardPanel title="Free-form Planner Chat" body-class="p-0">
            <template #header>
              <UBadge color="warning" variant="subtle" size="sm">POC only</UBadge>
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
                  <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
                </div>
              </div>

              <div class="border-t border-slate-800 p-4">
                <UTextarea
                  v-model="draft"
                  autoresize
                  :rows="4"
                  :disabled="isSubmitting || !isHydrated"
                  placeholder="Ask the planner something exploratory, like: sketch a safe first Maphew survey plan near spawn."
                  class="w-full"
                />
                <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p :class="['text-xs', freeformError ? 'text-red-300' : 'text-slate-500']">
                    {{ freeformError || 'Submits one free-form API call and records token usage locally.' }}
                  </p>
                  <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-md bg-cyan-500 px-3 text-xs font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isSubmitting || !isHydrated"
                    @click="submitPrompt"
                  >
                    <UIcon name="i-lucide-send" class="size-3.5" />
                    <span>{{ isSubmitting ? 'Sending' : 'Send' }}</span>
                  </button>
                </div>
              </div>
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
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { CoordinationDashboardPayload, CrewBotId } from '~/types/coordination'
import type { DashboardMetric } from '~/types/dashboard'

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

type PlannerTab = 'proposals' | 'greenlights' | 'freeform'

const store = useDashboardStore()
const route = useRoute()
const router = useRouter()
const coordination = ref<CoordinationDashboardPayload | null>(null)
const activeTab = ref<PlannerTab>(tabFromQuery(route.query.tab))
const proposalDraft = ref('Build a foundry near the workshop.')
const goalLabel = ref('')
const goalDetail = ref('')
const actionError = ref('')
const busyAction = ref('')
const draft = ref('')
const isSubmitting = ref(false)
const isHydrated = ref(false)
const freeformError = ref('')
const messages = ref<PlannerMessage[]>([
  {
    id: 'planner-welcome',
    role: 'assistant',
    content: 'This is a free-form planner POC. Send a prompt to make one AI API call and watch the usage cards update.'
  }
])

const plannerTabs: Array<{ id: PlannerTab, label: string, icon: string }> = [
  { id: 'proposals', label: 'Proposals', icon: 'i-lucide-sparkles' },
  { id: 'greenlights', label: 'Greenlights', icon: 'i-lucide-badge-check' },
  { id: 'freeform', label: 'Free-form POC', icon: 'i-lucide-message-square' }
]

const plannerMetrics = computed<DashboardMetric[]>(() => [
  {
    id: 'planner-proposals',
    label: 'Pending Proposals',
    value: String(coordination.value?.proposals.filter((proposal) => proposal.status === 'proposed').length ?? 0),
    helper: 'Planner batches awaiting review',
    icon: 'i-lucide-sparkles',
    accent: 'blue'
  },
  {
    id: 'planner-goals',
    label: 'Open Goals',
    value: String(coordination.value?.summary.goalsOpen ?? 0),
    helper: 'Human, bot, or planner outcomes',
    icon: 'i-lucide-target',
    accent: 'green'
  },
  {
    id: 'planner-plans',
    label: 'Reusable Plans',
    value: String(coordination.value?.plans.length ?? 0),
    helper: 'Saved plan shapes',
    icon: 'i-lucide-repeat',
    accent: 'violet'
  },
  {
    id: 'planner-rules',
    label: 'Greenlights',
    value: String(coordination.value?.summary.greenlightsEnabled ?? 0),
    helper: 'Approval policy enabled',
    icon: 'i-lucide-badge-check',
    accent: 'cyan'
  },
  {
    id: 'planner-job-approvals',
    label: 'Job Approvals',
    value: String(coordination.value?.jobs.filter((job) => job.approval === 'pending').length ?? 0),
    helper: 'Concrete work handled on Jobs',
    icon: 'i-lucide-clipboard-check',
    accent: 'amber'
  }
])

onMounted(() => {
  isHydrated.value = true
  refresh()
  store.startOperationalPolling()
  store.refreshAiUsage()
})

onBeforeUnmount(() => {
  store.stopOperationalPolling()
})

watch(() => route.query.tab, (tab) => {
  activeTab.value = tabFromQuery(tab)
})

async function refresh() {
  coordination.value = await $fetch<CoordinationDashboardPayload>('/api/coordination')
  await store.refreshOperationalStatus()
}

async function createProposal() {
  await runAction('proposal', async () => {
    await $fetch('/api/planner/proposals', {
      method: 'POST',
      body: {
        message: proposalDraft.value
      }
    })
    proposalDraft.value = ''
  })
}

async function createGoal() {
  await runAction('goal', async () => {
    await $fetch('/api/goals', {
      method: 'POST',
      body: {
        label: goalLabel.value,
        detail: goalDetail.value
      }
    })
    goalLabel.value = ''
    goalDetail.value = ''
  })
}

async function proposalAction(id: string, action: 'approve' | 'reject') {
  await runAction(`${id}:${action}`, () => $fetch(`/api/proposals/${id}/${action}`, { method: 'POST' }))
}

async function runAction(label: string, action: () => Promise<unknown>) {
  try {
    busyAction.value = label
    actionError.value = ''
    await action()
    await refresh()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Planner action failed'
  } finally {
    busyAction.value = ''
  }
}

async function submitPrompt() {
  const content = draft.value.trim()

  if (!content || isSubmitting.value || !isHydrated.value) {
    return
  }

  freeformError.value = ''
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
    freeformError.value = error instanceof Error ? error.message : 'Planner request failed'
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: freeformError.value
    })
  } finally {
    isSubmitting.value = false
  }
}

function botName(id: CrewBotId) {
  return coordination.value?.crew.find((bot) => bot.id === id)?.name ?? id
}

function setActiveTab(tab: PlannerTab) {
  activeTab.value = tab
  router.replace({
    query: {
      ...route.query,
      tab
    }
  })
}

function tabFromQuery(tab: unknown): PlannerTab {
  return tab === 'greenlights' || tab === 'freeform' ? tab : 'proposals'
}
</script>

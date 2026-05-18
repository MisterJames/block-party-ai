<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 lg:pl-64">
    <DashboardSidebar
      :health-stats="store.healthStats"
      :world-connection="store.worldConnection"
    />

    <section class="space-y-3 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Coordination core</p>
          <h1 class="mt-1 text-xl font-semibold text-slate-50">Jobs</h1>
          <p class="mt-1 text-sm text-slate-400">Goals, reusable plans, bot queues, requests, approvals, and greenlights.</p>
        </div>
        <UButton to="/" icon="i-lucide-layout-dashboard" label="Overview" color="neutral" variant="soft" size="xs" />
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStatusCard
          v-for="metric in coordinationMetrics"
          :key="metric.id"
          :metric="metric"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-[380px_1fr]">
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

          <DashboardPanel title="Human Goal" description="Add a goal for later approval">
            <form class="space-y-3" @submit.prevent="createGoal">
              <UInput v-model="goalLabel" placeholder="Goal label" size="sm" />
              <UTextarea v-model="goalDetail" :rows="3" autoresize placeholder="What outcome should the crew plan for?" />
              <div class="flex justify-end">
                <UButton type="submit" label="Create Goal" icon="i-lucide-plus" color="neutral" variant="soft" size="xs" :loading="busyAction === 'goal'" />
              </div>
            </form>
          </DashboardPanel>

          <DashboardPanel title="Greenlights" body-class="p-0">
            <div class="divide-y divide-slate-800">
              <div
                v-for="rule in coordination?.greenlights ?? []"
                :key="rule.id"
                class="p-3 text-xs"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-slate-100">{{ rule.label }}</p>
                    <p class="mt-1 line-clamp-2 text-slate-500">{{ rule.notes }}</p>
                  </div>
                  <UBadge :color="rule.enabled ? 'success' : 'neutral'" variant="subtle" size="sm">
                    {{ rule.enabled ? 'Enabled' : 'Off' }}
                  </UBadge>
                </div>
                <p class="mt-2 text-slate-400">
                  {{ rule.templateIds.join(', ') || 'No templates' }}
                </p>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div class="space-y-3">
          <DashboardPanel title="Bot Queues" body-class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[820px] table-fixed text-left text-xs">
                <thead class="border-b border-slate-700/70 text-slate-400">
                  <tr>
                    <th class="w-[26%] px-4 py-2 font-medium">Bot</th>
                    <th class="w-[18%] px-3 py-2 font-medium">Runtime</th>
                    <th class="w-[14%] px-3 py-2 font-medium">Queue</th>
                    <th class="w-[42%] px-3 py-2 font-medium">Capabilities</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80">
                  <tr v-for="bot in coordination?.crew ?? []" :key="bot.id" class="hover:bg-slate-900/70">
                    <td class="px-4 py-2.5">
                      <div class="flex items-center gap-2">
                        <div class="grid size-7 place-items-center rounded-md border border-slate-700 bg-slate-800 text-[11px] font-bold">{{ bot.avatar }}</div>
                        <div class="min-w-0">
                          <p class="truncate font-medium text-slate-100">{{ bot.name }}</p>
                          <p class="truncate text-slate-500">{{ bot.role }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <UBadge :color="runtimeColor(bot.runtime)" variant="subtle" size="sm">
                        {{ bot.runtime }}
                      </UBadge>
                    </td>
                    <td class="px-3 py-2.5 text-slate-300">{{ bot.queueLength }}</td>
                    <td class="truncate px-3 py-2.5 text-slate-400">{{ bot.capabilities.join(', ') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Jobs" body-class="p-0">
            <template #header>
              <div class="flex flex-wrap gap-1">
                <UButton
                  v-for="filter in filters"
                  :key="filter"
                  :label="filter"
                  :color="activeFilter === filter ? 'primary' : 'neutral'"
                  :variant="activeFilter === filter ? 'soft' : 'ghost'"
                  size="xs"
                  @click="activeFilter = filter"
                />
              </div>
            </template>

            <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div class="max-h-[560px] overflow-y-auto border-b border-slate-800 xl:border-b-0 xl:border-r">
                <button
                  v-for="job in filteredJobs"
                  :key="job.id"
                  type="button"
                  :class="[
                    'block w-full border-b border-slate-800 px-4 py-3 text-left text-xs hover:bg-slate-900/80',
                    selectedJobId === job.id ? 'bg-slate-900' : ''
                  ]"
                  @click="selectedJobId = job.id"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate font-medium text-slate-100">{{ job.label }}</p>
                      <p class="mt-1 line-clamp-2 text-slate-500">{{ job.detail }}</p>
                    </div>
                    <div class="flex shrink-0 gap-1">
                      <UBadge :color="statusColor(job.status)" variant="subtle" size="sm">{{ statusLabel(job.status) }}</UBadge>
                      <UBadge :color="approvalColor(job.approval)" variant="subtle" size="sm">{{ approvalLabel(job.approval) }}</UBadge>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center gap-2 text-slate-400">
                    <span>{{ botName(job.assignedBotId) }}</span>
                    <span>·</span>
                    <span>{{ job.progressPercent }}%</span>
                    <UProgress :model-value="job.progressPercent" size="xs" class="max-w-32" />
                  </div>
                </button>
              </div>

              <div class="min-h-[360px] p-4 text-xs">
                <div v-if="selectedJob" class="space-y-4">
                  <div>
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-slate-100">{{ selectedJob.label }}</p>
                        <p class="mt-1 text-slate-400">{{ selectedJob.detail }}</p>
                      </div>
                      <UBadge :color="statusColor(selectedJob.status)" variant="subtle" size="sm">
                        {{ statusLabel(selectedJob.status) }}
                      </UBadge>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <UButton
                        v-if="selectedJob.approval === 'pending'"
                        label="Approve"
                        icon="i-lucide-check"
                        color="success"
                        variant="soft"
                        size="xs"
                        :loading="busyAction === selectedJob.id + ':approve'"
                        @click="jobAction(selectedJob.id, 'approve')"
                      />
                      <UButton
                        v-if="selectedJob.approval === 'pending'"
                        label="Reject"
                        icon="i-lucide-x"
                        color="warning"
                        variant="soft"
                        size="xs"
                        :loading="busyAction === selectedJob.id + ':reject'"
                        @click="jobAction(selectedJob.id, 'reject')"
                      />
                      <UButton
                        v-if="!['cancelled', 'completed', 'rejected'].includes(selectedJob.status)"
                        label="Cancel"
                        icon="i-lucide-ban"
                        color="neutral"
                        variant="soft"
                        size="xs"
                        :loading="busyAction === selectedJob.id + ':cancel'"
                        @click="jobAction(selectedJob.id, 'cancel')"
                      />
                      <UButton
                        label="Request Help"
                        icon="i-lucide-message-square-warning"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        :loading="busyAction === selectedJob.id + ':request'"
                        @click="requestHelp(selectedJob.id)"
                      />
                    </div>
                  </div>

                  <div>
                    <p class="mb-2 font-medium text-slate-200">Steps</p>
                    <div class="space-y-2">
                      <div v-for="step in selectedJob.steps" :key="step.id" class="rounded-md border border-slate-800 bg-slate-950/60 p-2">
                        <div class="flex items-center justify-between gap-2">
                          <p class="font-medium text-slate-200">{{ step.order }}. {{ step.label }}</p>
                          <UBadge color="neutral" variant="subtle" size="sm">{{ step.status }}</UBadge>
                        </div>
                        <p class="mt-1 text-slate-500">{{ step.detail || 'No extra detail.' }}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p class="mb-2 font-medium text-slate-200">Requests</p>
                    <div v-if="selectedJob.requests.length" class="space-y-2">
                      <div v-for="request in selectedJob.requests" :key="request.id" class="rounded-md border border-amber-500/20 bg-amber-500/10 p-2">
                        <p class="font-medium text-amber-100">{{ request.label }}</p>
                        <p class="mt-1 text-amber-100/75">{{ request.detail }}</p>
                      </div>
                    </div>
                    <p v-else class="text-slate-500">No open requests.</p>
                  </div>
                </div>

                <p v-else class="text-slate-500">Select a job to inspect steps, requests, and approval controls.</p>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Planner Proposals" body-class="p-0">
            <div class="divide-y divide-slate-800">
              <div
                v-for="proposal in coordination?.proposals ?? []"
                :key="proposal.id"
                class="p-3 text-xs"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <p class="font-medium text-slate-100">{{ proposal.label }}</p>
                    <p class="mt-1 text-slate-500">{{ proposal.jobs.length }} jobs · {{ proposal.detail }}</p>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <UBadge :color="proposal.status === 'approved' ? 'success' : proposal.status === 'rejected' ? 'warning' : 'neutral'" variant="subtle" size="sm">
                      {{ proposal.status }}
                    </UBadge>
                    <UButton
                      v-if="proposal.status === 'proposed'"
                      label="Approve"
                      color="success"
                      variant="soft"
                      size="xs"
                      :loading="busyAction === proposal.id + ':approve'"
                      @click="proposalAction(proposal.id, 'approve')"
                    />
                    <UButton
                      v-if="proposal.status === 'proposed'"
                      label="Reject"
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
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { CoordinationDashboardPayload, CoordinationJobStatus, CoordinationApprovalState, CrewBotId } from '~/types/coordination'
import type { DashboardMetric } from '~/types/dashboard'

const store = useDashboardStore()
const coordination = ref<CoordinationDashboardPayload | null>(null)
const selectedJobId = ref('')
const activeFilter = ref('All')
const proposalDraft = ref('Build a foundry near the workshop.')
const goalLabel = ref('')
const goalDetail = ref('')
const actionError = ref('')
const busyAction = ref('')
const filters = ['All', 'Proposed', 'Queued', 'Blocked', 'Completed']

const coordinationMetrics = computed<DashboardMetric[]>(() => [
  {
    id: 'coord-jobs',
    label: 'Active Jobs',
    value: String(coordination.value?.summary.jobsActive ?? 0),
    helper: `${coordination.value?.summary.jobsPendingApproval ?? 0} approval items`,
    icon: 'i-lucide-clipboard-list',
    accent: 'blue'
  },
  {
    id: 'coord-requests',
    label: 'Open Requests',
    value: String(coordination.value?.summary.requestsOpen ?? 0),
    helper: 'Bot-originated needs',
    icon: 'i-lucide-message-square-warning',
    accent: 'amber'
  },
  {
    id: 'coord-goals',
    label: 'Open Goals',
    value: String(coordination.value?.summary.goalsOpen ?? 0),
    helper: 'Human, bot, or planner outcomes',
    icon: 'i-lucide-target',
    accent: 'green'
  },
  {
    id: 'coord-rules',
    label: 'Greenlights',
    value: String(coordination.value?.summary.greenlightsEnabled ?? 0),
    helper: 'Conservative defaults enabled',
    icon: 'i-lucide-badge-check',
    accent: 'cyan'
  },
  {
    id: 'coord-crew',
    label: 'Crew Queues',
    value: String(coordination.value?.crew.length ?? 0),
    helper: coordination.value?.summary.storagePath ?? 'Loading state',
    icon: 'i-lucide-users',
    accent: 'violet'
  }
])

const filteredJobs = computed(() => {
  const jobs = coordination.value?.jobs ?? []

  if (activeFilter.value === 'All') return jobs

  return jobs.filter((job) => statusLabel(job.status) === activeFilter.value)
})

const selectedJob = computed(() => coordination.value?.jobs.find((job) => job.id === selectedJobId.value) ?? filteredJobs.value[0] ?? null)

watch(filteredJobs, (jobs) => {
  if (!selectedJobId.value || !jobs.some((job) => job.id === selectedJobId.value)) {
    selectedJobId.value = jobs[0]?.id ?? ''
  }
})

async function refresh() {
  coordination.value = await $fetch<CoordinationDashboardPayload>('/api/coordination')
  await store.refreshOperationalStatus()
  selectedJobId.value ||= coordination.value.jobs[0]?.id ?? ''
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

async function jobAction(id: string, action: 'approve' | 'reject' | 'cancel') {
  await runAction(`${id}:${action}`, () => $fetch(`/api/jobs/${id}/${action}`, { method: 'POST' }))
}

async function requestHelp(id: string) {
  await runAction(`${id}:request`, () => $fetch(`/api/jobs/${id}/requests`, {
    method: 'POST',
    body: {
      type: 'planner_support',
      label: 'Needs coordination help',
      detail: 'A manual request was added from the Jobs page.'
    }
  }))
}

async function runAction(label: string, action: () => Promise<unknown>) {
  try {
    busyAction.value = label
    actionError.value = ''
    await action()
    await refresh()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Coordination action failed'
  } finally {
    busyAction.value = ''
  }
}

function botName(id: CrewBotId) {
  return coordination.value?.crew.find((bot) => bot.id === id)?.name ?? id
}

function statusLabel(status: CoordinationJobStatus) {
  if (['proposed', 'waiting_for_approval'].includes(status)) return 'Proposed'
  if (['approved', 'greenlit', 'queued', 'accepted', 'running'].includes(status)) return 'Queued'
  if (status === 'blocked' || status === 'failed') return 'Blocked'
  if (status === 'completed') return 'Completed'
  return 'Waiting'
}

function statusColor(status: CoordinationJobStatus) {
  if (status === 'completed') return 'success'
  if (['blocked', 'failed'].includes(status)) return 'warning'
  if (['proposed', 'waiting_for_approval'].includes(status)) return 'warning'
  if (['approved', 'greenlit', 'queued', 'accepted', 'running'].includes(status)) return 'info'
  return 'neutral'
}

function approvalLabel(approval: CoordinationApprovalState) {
  return {
    not_required: 'Not required',
    pending: 'Pending',
    approved: 'Approved',
    greenlit: 'Greenlit',
    rejected: 'Rejected'
  }[approval]
}

function approvalColor(approval: CoordinationApprovalState) {
  if (approval === 'approved' || approval === 'greenlit') return 'success'
  if (approval === 'pending') return 'warning'
  if (approval === 'rejected') return 'warning'
  return 'neutral'
}

function runtimeColor(runtime: string) {
  if (runtime === 'real') return 'success'
  if (runtime === 'simulated') return 'info'
  return 'neutral'
}

onMounted(() => {
  refresh()
  store.startOperationalPolling()
  store.refreshAiUsage()
})

onBeforeUnmount(() => {
  store.stopOperationalPolling()
})
</script>

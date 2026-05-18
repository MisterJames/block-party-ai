import { randomUUID } from 'node:crypto'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import type {
  CoordinationDashboardPayload,
  CoordinationEvent,
  CoordinationJobStatus,
  CoordinationState,
  CrewBot,
  CrewBotId,
  CrewGoal,
  CrewJob,
  CrewPlan,
  GreenlightRule,
  JobRequest,
  JobStep,
  JobTemplate,
  PlannerProposal
} from '../../types/coordination'
import { formatLocalPath } from './minecraft-config'

type PlannerKind = 'foundry' | 'hoe' | 'food'

const stateVersion = 1
const completedJobStates = new Set<CoordinationJobStatus>(['completed', 'cancelled', 'rejected', 'failed'])

function now() {
  return new Date().toISOString()
}

function absoluteStatePath(value: string | undefined, fallback: string) {
  if (!value?.trim()) {
    return join(process.cwd(), fallback)
  }

  return resolve(process.cwd(), value)
}

function getCoordinationPaths() {
  return {
    statePath: absoluteStatePath(process.env.COORDINATION_STATE_PATH, 'state/coordination.json'),
    eventLogPath: absoluteStatePath(process.env.COORDINATION_EVENTS_LOG_PATH, 'state/coordination-events.jsonl')
  }
}

function step(id: string, label: string, order: number, detail = ''): JobStep {
  return {
    id,
    label,
    order,
    detail,
    status: 'pending',
    startedAt: null,
    completedAt: null
  }
}

function baseCrew(timestamp: string): CrewBot[] {
  return [
    {
      id: 'maphew',
      name: 'Maphew',
      role: 'Cartographer',
      avatar: 'M',
      runtime: 'real',
      status: 'idle',
      capabilities: ['survey_area', 'answer_location'],
      currentJobId: null,
      queueLength: 0,
      inventorySummary: 'Survey kit',
      locationLabel: 'Maphew runtime',
      lastActivityAt: timestamp
    },
    {
      id: 'snackwella',
      name: 'Snackwella',
      role: 'Provisions / Farming',
      avatar: 'S',
      runtime: 'simulated',
      status: 'queued',
      capabilities: ['farm_food', 'feed_bot'],
      currentJobId: 'job-feed-maphew',
      queueLength: 1,
      inventorySummary: 'Food stores simulated',
      locationLabel: 'Planned farm plot',
      lastActivityAt: timestamp
    },
    {
      id: 'chesterton',
      name: 'Chesterton',
      role: 'Stocker',
      avatar: 'H',
      runtime: 'simulated',
      status: 'queued',
      capabilities: ['fetch_item', 'stock_chest'],
      currentJobId: 'job-fetch-seeds',
      queueLength: 1,
      inventorySummary: 'Chest routes simulated',
      locationLabel: 'Storage',
      lastActivityAt: timestamp
    },
    {
      id: 'anvilannie',
      name: 'AnvilAnnie',
      role: 'Blacksmith',
      avatar: 'A',
      runtime: 'simulated',
      status: 'idle',
      capabilities: ['craft_item'],
      currentJobId: null,
      queueLength: 0,
      inventorySummary: 'Recipes simulated',
      locationLabel: 'Workshop',
      lastActivityAt: timestamp
    },
    {
      id: 'blocko',
      name: 'Blocko',
      role: 'Builder',
      avatar: 'B',
      runtime: 'simulated',
      status: 'idle',
      capabilities: ['craft_item', 'safe_zone_setup', 'place_blocks'],
      currentJobId: null,
      queueLength: 0,
      inventorySummary: 'Utility kit simulated',
      locationLabel: 'Base camp',
      lastActivityAt: timestamp
    },
    {
      id: 'sprucelee',
      name: 'SpruceLee',
      role: 'Gatherer',
      avatar: 'S',
      runtime: 'planned',
      status: 'planned',
      capabilities: ['gather_resource'],
      currentJobId: null,
      queueLength: 0,
      inventorySummary: 'Pending',
      locationLabel: 'Not connected',
      lastActivityAt: null
    },
    {
      id: 'captain-cobble',
      name: 'CaptainCobble',
      role: 'Digger Leader',
      avatar: 'C',
      runtime: 'planned',
      status: 'planned',
      capabilities: ['future_dig_jobs'],
      currentJobId: null,
      queueLength: 0,
      inventorySummary: 'Pending',
      locationLabel: 'Not connected',
      lastActivityAt: null
    },
    {
      id: 'doug',
      name: 'Doug',
      role: 'Digger Worker',
      avatar: 'D',
      runtime: 'planned',
      status: 'planned',
      capabilities: ['future_dig_jobs'],
      currentJobId: null,
      queueLength: 0,
      inventorySummary: 'Pending',
      locationLabel: 'Not connected',
      lastActivityAt: null
    }
  ]
}

function seedTemplates(): JobTemplate[] {
  return [
    {
      id: 'survey_area',
      label: 'Survey Area',
      category: 'survey',
      defaultBotId: 'maphew',
      destructive: false,
      stepLabels: ['Walk patrol route', 'Record surface samples', 'Report findings'],
      enabled: true
    },
    {
      id: 'fetch_item',
      label: 'Fetch Item',
      category: 'fetch',
      defaultBotId: 'chesterton',
      destructive: false,
      stepLabels: ['Locate source chest', 'Reserve requested items', 'Deliver items'],
      enabled: true
    },
    {
      id: 'craft_item',
      label: 'Craft Item',
      category: 'craft',
      defaultBotId: 'anvilannie',
      destructive: false,
      stepLabels: ['Check recipe', 'Confirm materials', 'Craft item'],
      enabled: true
    },
    {
      id: 'farm_food',
      label: 'Farm Food',
      category: 'farm',
      defaultBotId: 'snackwella',
      destructive: false,
      stepLabels: ['Check crop plot', 'Plant or harvest crops', 'Stock food'],
      enabled: true
    },
    {
      id: 'stock_chest',
      label: 'Stock Chest',
      category: 'stock',
      defaultBotId: 'chesterton',
      destructive: false,
      stepLabels: ['Check target minimums', 'Fetch missing items', 'Update chest record'],
      enabled: true
    },
    {
      id: 'place_blocks',
      label: 'Place Blocks',
      category: 'build',
      defaultBotId: 'blocko',
      destructive: false,
      stepLabels: ['Check build location', 'Confirm materials', 'Place approved blocks'],
      enabled: true
    }
  ]
}

function seedGreenlights(timestamp: string): GreenlightRule[] {
  return [
    {
      id: 'greenlight-maphew-survey',
      label: 'Maphew routine survey and location answers',
      enabled: true,
      templateIds: ['survey_area'],
      botIds: ['maphew'],
      maxItemCount: null,
      allowBlockPlacement: false,
      allowBlockBreaking: false,
      allowPlannerCalls: false,
      notes: 'Observational work only.',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'greenlight-common-logistics',
      label: 'Common simulated fetch, craft, farm, and stock work',
      enabled: true,
      templateIds: ['fetch_item', 'craft_item', 'farm_food', 'stock_chest'],
      botIds: ['snackwella', 'chesterton', 'anvilannie', 'blocko'],
      maxItemCount: 64,
      allowBlockPlacement: false,
      allowBlockBreaking: false,
      allowPlannerCalls: false,
      notes: 'Phase 5 coordination demo only; non-Maphew bots remain simulated.',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}

function seedPlans(timestamp: string): CrewPlan[] {
  return [
    {
      id: 'plan-build-foundry',
      label: 'Build a foundry',
      detail: 'Reusable plan for a starter foundry with storage for coal and ore plus a crafting table.',
      reusable: true,
      templateIds: ['place_blocks', 'stock_chest', 'stock_chest', 'craft_item'],
      defaultJobLabels: ['Frame foundry work area', 'Stock coal chest', 'Stock iron ore chest', 'Place crafting table'],
      approval: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}

function seedJobs(timestamp: string): CrewJob[] {
  return [
    {
      id: 'job-maphew-survey',
      goalId: 'goal-map-spawn',
      planId: null,
      templateId: 'survey_area',
      label: 'Survey spawn area',
      detail: 'Greenlit Maphew survey job mirrors the current 256 x 256 spawn-area survey.',
      assignedBotId: 'maphew',
      status: 'queued',
      approval: 'greenlit',
      destructive: false,
      progressPercent: 0,
      steps: [
        step('step-route', 'Walk patrol route', 1, 'Use configured Maphew survey route.'),
        step('step-sample', 'Record surface samples', 2, 'Append survey samples to JSONL.'),
        step('step-report', 'Report findings', 3, 'Expose hazards, landmarks, and walkable zones.')
      ],
      requests: [],
      dependencies: [],
      greenlightRuleId: 'greenlight-maphew-survey',
      location: { x: 0, z: 0, label: 'Spawn survey' },
      createdBy: 'seed',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'job-feed-maphew',
      goalId: 'goal-feed-maphew',
      planId: null,
      templateId: 'farm_food',
      label: 'Prepare food for Maphew',
      detail: 'Snackwella handles a simulated provisions loop for a hungry cartographer.',
      assignedBotId: 'snackwella',
      status: 'queued',
      approval: 'greenlit',
      destructive: false,
      progressPercent: 10,
      steps: [
        step('step-check-food', 'Check food stores', 1, 'Confirm available bread, carrots, or wheat.'),
        step('step-prepare-food', 'Prepare food bundle', 2, 'Assemble a small delivery for Maphew.')
      ],
      requests: [
        {
          id: 'req-seeds-for-food',
          jobId: 'job-feed-maphew',
          fromBotId: 'snackwella',
          targetBotId: 'chesterton',
          type: 'item',
          label: 'Need seeds for provisions',
          detail: 'Snackwella needs starter seeds to keep food production moving.',
          status: 'proposed',
          spawnedJobId: 'job-fetch-seeds',
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ],
      dependencies: ['job-fetch-seeds'],
      greenlightRuleId: 'greenlight-common-logistics',
      location: { x: 4, z: 4, label: 'Farm plot' },
      createdBy: 'seed',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'job-fetch-seeds',
      goalId: 'goal-feed-maphew',
      planId: null,
      templateId: 'fetch_item',
      label: 'Fetch starter seeds',
      detail: 'Chesterton simulates fetching seeds for Snackwella.',
      assignedBotId: 'chesterton',
      status: 'queued',
      approval: 'greenlit',
      destructive: false,
      progressPercent: 0,
      steps: [
        step('step-find-storage', 'Check known storage', 1, 'Look for seeds in registered storage.'),
        step('step-deliver-seeds', 'Deliver seeds', 2, 'Bring seeds to Snackwella.')
      ],
      requests: [],
      dependencies: [],
      greenlightRuleId: 'greenlight-common-logistics',
      location: { x: 2, z: 2, label: 'Storage' },
      createdBy: 'seed',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'job-craft-hoe',
      goalId: 'goal-craft-hoe',
      planId: null,
      templateId: 'craft_item',
      label: 'Craft a hoe',
      detail: 'A one-step simulated utility craft job for the provisions loop.',
      assignedBotId: 'anvilannie',
      status: 'proposed',
      approval: 'pending',
      destructive: false,
      progressPercent: 0,
      steps: [
        step('step-craft-hoe', 'Craft hoe', 1, 'Use common materials to craft a starter hoe.')
      ],
      requests: [],
      dependencies: [],
      greenlightRuleId: null,
      location: { x: 6, z: 2, label: 'Workshop' },
      createdBy: 'seed',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}

function seedGoals(timestamp: string): CrewGoal[] {
  return [
    {
      id: 'goal-map-spawn',
      label: 'Map spawn area',
      detail: 'Keep Maphew surveying the local spawn area.',
      status: 'active',
      source: 'seed',
      planId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'goal-feed-maphew',
      label: 'Feed Maphew',
      detail: 'Start the provisions loop so Maphew has food support.',
      status: 'active',
      source: 'seed',
      planId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'goal-craft-hoe',
      label: 'Craft a hoe',
      detail: 'Prepare the first farming tool for Snackwella.',
      status: 'proposed',
      source: 'seed',
      planId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}

function seedState(): CoordinationState {
  const timestamp = now()

  return {
    version: stateVersion,
    updatedAt: timestamp,
    crew: baseCrew(timestamp),
    goals: seedGoals(timestamp),
    plans: seedPlans(timestamp),
    jobs: seedJobs(timestamp),
    templates: seedTemplates(),
    greenlights: seedGreenlights(timestamp),
    proposals: []
  }
}

function allRequests(state: CoordinationState) {
  return state.jobs.flatMap((job) => job.requests)
}

function proposalKind(prompt: string): PlannerKind {
  const normalized = prompt.toLowerCase()

  if (normalized.includes('hoe')) return 'hoe'
  if (normalized.includes('food') || normalized.includes('feed') || normalized.includes('hungry')) return 'food'
  return 'foundry'
}

function makeJobFromTemplate(params: {
  id: string
  goalId: string
  planId: string | null
  template: JobTemplate
  label: string
  detail: string
  assignedBotId?: CrewBotId
  approval?: CrewJob['approval']
  status?: CrewJob['status']
  createdBy: CrewJob['createdBy']
  timestamp: string
  location?: CrewJob['location']
}): CrewJob {
  return {
    id: params.id,
    goalId: params.goalId,
    planId: params.planId,
    templateId: params.template.id,
    label: params.label,
    detail: params.detail,
    assignedBotId: params.assignedBotId ?? params.template.defaultBotId,
    status: params.status ?? 'proposed',
    approval: params.approval ?? 'pending',
    destructive: params.template.destructive,
    progressPercent: 0,
    steps: params.template.stepLabels.map((label, index) => step(`${params.id}-step-${index + 1}`, label, index + 1)),
    requests: [],
    dependencies: [],
    greenlightRuleId: null,
    location: params.location ?? null,
    createdBy: params.createdBy,
    createdAt: params.timestamp,
    updatedAt: params.timestamp
  }
}

function templateById(state: CoordinationState, id: string) {
  const template = state.templates.find((item) => item.id === id)

  if (!template) {
    throw new Error(`Missing job template: ${id}`)
  }

  return template
}

function deterministicProposal(state: CoordinationState, prompt: string): PlannerProposal {
  const timestamp = now()
  const kind = proposalKind(prompt)
  const proposalId = `proposal-${randomUUID()}`
  const goalId = `goal-${randomUUID()}`
  const planId = kind === 'foundry' ? `plan-${randomUUID()}` : null
  const goal: CrewGoal = {
    id: goalId,
    label: kind === 'hoe' ? 'Craft a hoe' : kind === 'food' ? 'Feed Maphew' : 'Build a foundry',
    detail: `Planner proposal from: ${prompt}`,
    status: 'proposed',
    source: 'planner',
    planId,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  const plan: CrewPlan | null = kind === 'foundry'
    ? {
        id: planId as string,
        label: 'Build a foundry',
        detail: 'Reusable foundry plan with structure, coal storage, ore storage, and a crafting table.',
        reusable: true,
        templateIds: ['place_blocks', 'stock_chest', 'stock_chest', 'craft_item'],
        defaultJobLabels: ['Frame foundry work area', 'Stock coal chest', 'Stock iron ore chest', 'Place crafting table'],
        approval: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      }
    : null
  const jobs = kind === 'hoe'
    ? [
        makeJobFromTemplate({
          id: `job-${randomUUID()}`,
          goalId,
          planId,
          template: templateById(state, 'craft_item'),
          label: 'Craft a hoe',
          detail: 'Create a starter hoe for Snackwella.',
          assignedBotId: 'anvilannie',
          createdBy: 'planner',
          timestamp
        })
      ]
    : kind === 'food'
      ? [
          makeJobFromTemplate({
            id: `job-${randomUUID()}`,
            goalId,
            planId,
            template: templateById(state, 'farm_food'),
            label: 'Prepare food for Maphew',
            detail: 'Start a simulated food preparation loop.',
            assignedBotId: 'snackwella',
            createdBy: 'planner',
            timestamp
          }),
          makeJobFromTemplate({
            id: `job-${randomUUID()}`,
            goalId,
            planId,
            template: templateById(state, 'fetch_item'),
            label: 'Fetch food supplies',
            detail: 'Fetch common supplies from known storage.',
            assignedBotId: 'chesterton',
            createdBy: 'planner',
            timestamp
          })
        ]
      : [
          makeJobFromTemplate({
            id: `job-${randomUUID()}`,
            goalId,
            planId,
            template: templateById(state, 'place_blocks'),
            label: 'Frame foundry work area',
            detail: 'Place the approved low wall outline for a starter foundry.',
            assignedBotId: 'blocko',
            createdBy: 'planner',
            timestamp
          }),
          makeJobFromTemplate({
            id: `job-${randomUUID()}`,
            goalId,
            planId,
            template: templateById(state, 'stock_chest'),
            label: 'Stock coal chest',
            detail: 'Add coal storage to the foundry plan.',
            assignedBotId: 'chesterton',
            createdBy: 'planner',
            timestamp
          }),
          makeJobFromTemplate({
            id: `job-${randomUUID()}`,
            goalId,
            planId,
            template: templateById(state, 'stock_chest'),
            label: 'Stock iron ore chest',
            detail: 'Add iron ore storage to the foundry plan.',
            assignedBotId: 'chesterton',
            createdBy: 'planner',
            timestamp
          }),
          makeJobFromTemplate({
            id: `job-${randomUUID()}`,
            goalId,
            planId,
            template: templateById(state, 'craft_item'),
            label: 'Place crafting table',
            detail: 'Prepare or place the foundry crafting station.',
            assignedBotId: 'anvilannie',
            createdBy: 'planner',
            timestamp
          })
        ]

  return {
    id: proposalId,
    prompt,
    label: goal.label,
    detail: goal.detail,
    status: 'proposed',
    goal,
    plan,
    jobs,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

async function saveState(state: CoordinationState) {
  const { statePath } = getCoordinationPaths()

  state.updatedAt = now()
  await mkdir(dirname(statePath), { recursive: true })
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

async function appendEvent(event: Omit<CoordinationEvent, 'id' | 'timestamp'>) {
  const { eventLogPath } = getCoordinationPaths()
  const record: CoordinationEvent = {
    id: randomUUID(),
    timestamp: now(),
    ...event
  }

  await mkdir(dirname(eventLogPath), { recursive: true })
  await appendFile(eventLogPath, `${JSON.stringify(record)}\n`, 'utf8')
  return record
}

async function readEvents(limit = 12): Promise<CoordinationEvent[]> {
  const { eventLogPath } = getCoordinationPaths()

  try {
    const raw = await readFile(eventLogPath, 'utf8')

    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as CoordinationEvent
        } catch {
          return null
        }
      })
      .filter((event): event is CoordinationEvent => Boolean(event?.id))
      .slice(-limit)
      .reverse()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

export async function readCoordinationState(): Promise<CoordinationState> {
  const { statePath } = getCoordinationPaths()

  try {
    const raw = await readFile(statePath, 'utf8')
    const parsed = JSON.parse(raw) as CoordinationState

    if (parsed.version !== stateVersion) {
      throw new Error('Unsupported coordination state version')
    }

    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }

    const seeded = seedState()
    await saveState(seeded)
    await appendEvent({
      type: 'coordination_seeded',
      severity: 'info',
      botId: null,
      jobId: null,
      title: 'Coordination core seeded',
      message: 'Seeded goals, jobs, templates, plans, and conservative greenlights.'
    })

    return seeded
  }
}

export async function getCoordinationDashboard(): Promise<CoordinationDashboardPayload> {
  const state = await readCoordinationState()
  const events = await readEvents()
  const requests = allRequests(state)
  const { statePath, eventLogPath } = getCoordinationPaths()

  return {
    ...state,
    requests,
    events,
    summary: {
      goalsOpen: state.goals.filter((goal) => !['completed', 'rejected'].includes(goal.status)).length,
      jobsActive: state.jobs.filter((job) => !completedJobStates.has(job.status)).length,
      jobsPendingApproval: state.jobs.filter((job) => job.approval === 'pending').length + state.proposals.filter((proposal) => proposal.status === 'proposed').length,
      requestsOpen: requests.filter((request) => ['open', 'proposed'].includes(request.status)).length,
      greenlightsEnabled: state.greenlights.filter((rule) => rule.enabled).length,
      storagePath: formatLocalPath(statePath),
      eventLogPath: formatLocalPath(eventLogPath)
    }
  }
}

export async function createGoal(input: { label?: string, detail?: string, planId?: string | null }) {
  const state = await readCoordinationState()
  const timestamp = now()
  const goal: CrewGoal = {
    id: `goal-${randomUUID()}`,
    label: input.label?.trim() || 'New goal',
    detail: input.detail?.trim() || 'Human-created coordination goal.',
    status: 'proposed',
    source: 'human',
    planId: input.planId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  state.goals.unshift(goal)
  await saveState(state)
  await appendEvent({
    type: 'goal_created',
    severity: 'info',
    botId: null,
    jobId: null,
    title: 'Goal proposed',
    message: goal.label
  })

  return getCoordinationDashboard()
}

export async function createPlannerProposal(prompt: string) {
  const state = await readCoordinationState()
  const proposal = deterministicProposal(state, prompt)

  state.proposals.unshift(proposal)
  await saveState(state)
  await appendEvent({
    type: 'planner_proposal_created',
    severity: 'info',
    botId: null,
    jobId: null,
    title: 'Planner proposal drafted',
    message: proposal.label
  })

  return proposal
}

export async function updateProposalStatus(id: string, status: PlannerProposal['status']) {
  const state = await readCoordinationState()
  const proposal = state.proposals.find((item) => item.id === id)

  if (!proposal) {
    throw new Error('Proposal not found')
  }

  const timestamp = now()
  proposal.status = status
  proposal.updatedAt = timestamp

  if (status === 'approved') {
    proposal.goal.status = 'approved'
    proposal.goal.updatedAt = timestamp
    state.goals.unshift(proposal.goal)

    if (proposal.plan) {
      proposal.plan.approval = 'approved'
      proposal.plan.updatedAt = timestamp
      state.plans.unshift(proposal.plan)
    }

    for (const job of proposal.jobs) {
      state.jobs.unshift({
        ...job,
        status: 'approved',
        approval: 'approved',
        updatedAt: timestamp
      })
    }
  }

  await saveState(state)
  await appendEvent({
    type: `proposal_${status}`,
    severity: status === 'approved' ? 'success' : 'warning',
    botId: null,
    jobId: null,
    title: status === 'approved' ? 'Proposal approved' : 'Proposal rejected',
    message: proposal.label
  })

  return getCoordinationDashboard()
}

export async function updateJobStatus(id: string, action: 'approve' | 'reject' | 'cancel') {
  const state = await readCoordinationState()
  const job = state.jobs.find((item) => item.id === id)

  if (!job) {
    throw new Error('Job not found')
  }

  if (action === 'approve') {
    job.status = 'approved'
    job.approval = 'approved'
  } else if (action === 'reject') {
    job.status = 'rejected'
    job.approval = 'rejected'
  } else {
    job.status = 'cancelled'
  }

  job.updatedAt = now()
  await saveState(state)
  await appendEvent({
    type: `job_${action}`,
    severity: action === 'approve' ? 'success' : 'warning',
    botId: job.assignedBotId,
    jobId: job.id,
    title: action === 'approve' ? 'Job approved' : action === 'reject' ? 'Job rejected' : 'Job cancelled',
    message: job.label
  })

  return getCoordinationDashboard()
}

export async function createJobRequest(jobId: string, input: Partial<JobRequest>) {
  const state = await readCoordinationState()
  const job = state.jobs.find((item) => item.id === jobId)

  if (!job) {
    throw new Error('Job not found')
  }

  const timestamp = now()
  const request: JobRequest = {
    id: `req-${randomUUID()}`,
    jobId,
    fromBotId: input.fromBotId ?? job.assignedBotId,
    targetBotId: input.targetBotId ?? null,
    type: input.type ?? 'item',
    label: input.label?.trim() || 'Job support request',
    detail: input.detail?.trim() || 'A bot needs support before this job can continue.',
    status: 'open',
    spawnedJobId: null,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  job.requests.unshift(request)
  job.status = 'blocked'
  job.updatedAt = timestamp
  await saveState(state)
  await appendEvent({
    type: 'job_request_created',
    severity: 'warning',
    botId: request.fromBotId,
    jobId,
    title: 'Job request opened',
    message: request.label
  })

  return getCoordinationDashboard()
}

export async function createGreenlight(input: Partial<GreenlightRule>) {
  const state = await readCoordinationState()
  const timestamp = now()
  const rule: GreenlightRule = {
    id: `greenlight-${randomUUID()}`,
    label: input.label?.trim() || 'New greenlight rule',
    enabled: input.enabled ?? false,
    templateIds: input.templateIds ?? [],
    botIds: input.botIds ?? [],
    maxItemCount: input.maxItemCount ?? null,
    allowBlockPlacement: input.allowBlockPlacement ?? false,
    allowBlockBreaking: input.allowBlockBreaking ?? false,
    allowPlannerCalls: input.allowPlannerCalls ?? false,
    notes: input.notes?.trim() || 'Human-created coordination greenlight.',
    createdAt: timestamp,
    updatedAt: timestamp
  }

  state.greenlights.unshift(rule)
  await saveState(state)
  await appendEvent({
    type: 'greenlight_created',
    severity: 'info',
    botId: null,
    jobId: null,
    title: 'Greenlight rule added',
    message: rule.label
  })

  return getCoordinationDashboard()
}

export function coordinationPathMeta() {
  const { statePath, eventLogPath } = getCoordinationPaths()

  return {
    statePath: formatLocalPath(statePath),
    eventLogPath: formatLocalPath(eventLogPath),
    stateGitIgnored: relative(process.cwd(), statePath).startsWith('state'),
    eventGitIgnored: relative(process.cwd(), eventLogPath).startsWith('state')
  }
}

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
  ItemMovementRecord,
  ItemStack,
  JobRequest,
  JobStep,
  JobTemplate,
  LogisticsDashboardPayload,
  LogisticsEndpoint,
  LogisticsItemEffect,
  LogisticsState,
  LowStockWarning,
  PlannerProposal
} from '../../types/coordination'
import { formatLocalPath } from './minecraft-config'

type PlannerKind = 'foundry' | 'hoe' | 'food'

const stateVersion = 2
const completedJobStates = new Set<CoordinationJobStatus>(['completed', 'cancelled', 'rejected', 'failed'])
const terminalJobStates = new Set<CoordinationJobStatus>(['completed', 'cancelled', 'rejected', 'failed'])
const runnableApprovals = new Set<CrewJob['approval']>(['approved', 'greenlit', 'not_required'])

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

function chestEndpoint(id: string, label: string): LogisticsEndpoint {
  return { type: 'chest', id, label }
}

function botEndpoint(id: CrewBotId, label: string): LogisticsEndpoint {
  return { type: 'bot', id, label }
}

function item(itemId: string, label: string, count: number): ItemStack {
  return { itemId, label, count }
}

function effect(params: {
  kind: LogisticsItemEffect['kind']
  itemId: string
  label: string
  count: number
  from?: LogisticsEndpoint | null
  to?: LogisticsEndpoint | null
}): LogisticsItemEffect {
  return {
    kind: params.kind,
    itemId: params.itemId,
    label: params.label,
    count: params.count,
    from: params.from ?? null,
    to: params.to ?? null
  }
}

function step(id: string, label: string, order: number, detail = '', itemEffects: LogisticsItemEffect[] = []): JobStep {
  return {
    id,
    label,
    order,
    detail,
    itemEffects,
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
    },
    {
      id: 'safe_zone_setup',
      label: 'Safe Zone Setup',
      category: 'build',
      defaultBotId: 'blocko',
      destructive: false,
      stepLabels: ['Prepare torches', 'Craft compass', 'Stock safe setup crate'],
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
      templateIds: ['fetch_item', 'craft_item', 'farm_food', 'stock_chest', 'safe_zone_setup'],
      botIds: ['snackwella', 'chesterton', 'anvilannie', 'blocko'],
      maxItemCount: 64,
      allowBlockPlacement: false,
      allowBlockBreaking: false,
      allowPlannerCalls: false,
      notes: 'Phase 6 simulated logistics only; non-Maphew bots remain simulated.',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}

function seedLogistics(timestamp: string): LogisticsState {
  return {
    chests: [
      {
        id: 'chest-seed-store',
        label: 'Seed Store',
        kind: 'seed',
        purpose: 'Starter crops and farm inputs for Snackwella.',
        ownerBotId: 'snackwella',
        location: { x: 3, y: 64, z: 5, label: 'Farm shed' },
        items: [item('wheat_seeds', 'Wheat Seeds', 18), item('carrot', 'Carrots', 9)],
        minimums: [item('wheat_seeds', 'Wheat Seeds', 12)],
        updatedAt: timestamp
      },
      {
        id: 'chest-food-crate',
        label: 'Food Crate',
        kind: 'food',
        purpose: 'Prepared food bundles for hungry workers.',
        ownerBotId: 'snackwella',
        location: { x: 4, y: 64, z: 4, label: 'Farm plot' },
        items: [item('bread', 'Bread', 5), item('carrot', 'Carrots', 9)],
        minimums: [item('bread', 'Bread', 6)],
        updatedAt: timestamp
      },
      {
        id: 'chest-workshop-materials',
        label: 'Workshop Materials',
        kind: 'material',
        purpose: 'Common crafting inputs for AnvilAnnie and Blocko.',
        ownerBotId: 'anvilannie',
        location: { x: 6, y: 64, z: 2, label: 'Workshop' },
        items: [
          item('oak_planks', 'Oak Planks', 24),
          item('stick', 'Sticks', 20),
          item('cobblestone', 'Cobblestone', 48),
          item('coal', 'Coal', 12),
          item('iron_ingot', 'Iron Ingots', 8),
          item('redstone_dust', 'Redstone Dust', 3)
        ],
        minimums: [item('stick', 'Sticks', 12), item('coal', 'Coal', 8), item('iron_ingot', 'Iron Ingots', 4)],
        updatedAt: timestamp
      },
      {
        id: 'chest-tool-rack',
        label: 'Tool Rack',
        kind: 'tool',
        purpose: 'Shared low-risk tools for provisions and utility jobs.',
        ownerBotId: 'anvilannie',
        location: { x: 7, y: 64, z: 2, label: 'Workshop' },
        items: [item('stone_pickaxe', 'Stone Pickaxe', 2)],
        minimums: [item('wooden_hoe', 'Wooden Hoe', 1), item('stone_pickaxe', 'Stone Pickaxe', 2)],
        updatedAt: timestamp
      },
      {
        id: 'chest-safe-setup',
        label: 'Safe Setup Crate',
        kind: 'safe_setup',
        purpose: 'Torches, compass support, and utility supplies for Blocko.',
        ownerBotId: 'blocko',
        location: { x: 0, y: 64, z: 0, label: 'Base camp' },
        items: [item('torch', 'Torches', 12)],
        minimums: [item('torch', 'Torches', 32), item('compass', 'Compass', 1)],
        updatedAt: timestamp
      },
      {
        id: 'chest-foundry-coal',
        label: 'Foundry Coal Chest',
        kind: 'furnace',
        purpose: 'Fuel reserve for the reusable foundry plan.',
        ownerBotId: 'chesterton',
        location: { x: 10, y: 64, z: 8, label: 'Foundry site' },
        items: [item('coal', 'Coal', 0)],
        minimums: [item('coal', 'Coal', 48)],
        updatedAt: timestamp
      },
      {
        id: 'chest-foundry-ore',
        label: 'Foundry Ore Chest',
        kind: 'furnace',
        purpose: 'Iron ore reserve for the reusable foundry plan.',
        ownerBotId: 'chesterton',
        location: { x: 11, y: 64, z: 8, label: 'Foundry site' },
        items: [item('iron_ore', 'Iron Ore', 0)],
        minimums: [item('iron_ore', 'Iron Ore', 48)],
        updatedAt: timestamp
      },
      {
        id: 'chest-dump',
        label: 'Dump Chest',
        kind: 'dump',
        purpose: 'Temporary intake for unsorted common materials.',
        ownerBotId: 'chesterton',
        location: { x: 2, y: 64, z: 2, label: 'Storage' },
        items: [item('dirt', 'Dirt', 32), item('cobblestone', 'Cobblestone', 16)],
        minimums: [],
        updatedAt: timestamp
      }
    ],
    inventories: [
      { botId: 'maphew', items: [item('bread', 'Bread', 1)], freeSlots: 34, updatedAt: timestamp },
      { botId: 'snackwella', items: [], freeSlots: 36, updatedAt: timestamp },
      { botId: 'chesterton', items: [], freeSlots: 36, updatedAt: timestamp },
      { botId: 'anvilannie', items: [], freeSlots: 36, updatedAt: timestamp },
      { botId: 'blocko', items: [], freeSlots: 36, updatedAt: timestamp }
    ],
    recipes: [
      {
        id: 'recipe-wooden-hoe',
        label: 'Wooden Hoe',
        station: 'Crafting Table',
        ownerBotId: 'anvilannie',
        inputs: [item('oak_planks', 'Oak Planks', 2), item('stick', 'Sticks', 2)],
        outputs: [item('wooden_hoe', 'Wooden Hoe', 1)]
      },
      {
        id: 'recipe-torches',
        label: 'Torches',
        station: 'Crafting Grid',
        ownerBotId: 'blocko',
        inputs: [item('coal', 'Coal', 1), item('stick', 'Sticks', 1)],
        outputs: [item('torch', 'Torches', 4)]
      },
      {
        id: 'recipe-compass',
        label: 'Compass',
        station: 'Crafting Table',
        ownerBotId: 'blocko',
        inputs: [item('iron_ingot', 'Iron Ingots', 4), item('redstone_dust', 'Redstone Dust', 1)],
        outputs: [item('compass', 'Compass', 1)]
      },
      {
        id: 'recipe-bread-bundle',
        label: 'Maphew Food Bundle',
        station: 'Food Crate',
        ownerBotId: 'snackwella',
        inputs: [item('bread', 'Bread', 2)],
        outputs: [item('bread', 'Bread', 2)]
      }
    ],
    movements: []
  }
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
        step('step-prepare-food', 'Prepare food bundle', 2, 'Assemble a small delivery for Maphew.', [
          effect({
            kind: 'deliver',
            itemId: 'bread',
            label: 'Bread',
            count: 2,
            from: chestEndpoint('chest-food-crate', 'Food Crate'),
            to: botEndpoint('maphew', 'Maphew')
          })
        ])
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
        step('step-deliver-seeds', 'Deliver seeds', 2, 'Bring seeds to Snackwella.', [
          effect({
            kind: 'deliver',
            itemId: 'wheat_seeds',
            label: 'Wheat Seeds',
            count: 8,
            from: chestEndpoint('chest-seed-store', 'Seed Store'),
            to: botEndpoint('snackwella', 'Snackwella')
          })
        ])
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
        step('step-craft-hoe', 'Craft hoe', 1, 'Use common materials to craft a starter hoe.', [
          effect({
            kind: 'consume',
            itemId: 'oak_planks',
            label: 'Oak Planks',
            count: 2,
            from: chestEndpoint('chest-workshop-materials', 'Workshop Materials')
          }),
          effect({
            kind: 'consume',
            itemId: 'stick',
            label: 'Sticks',
            count: 2,
            from: chestEndpoint('chest-workshop-materials', 'Workshop Materials')
          }),
          effect({
            kind: 'produce',
            itemId: 'wooden_hoe',
            label: 'Wooden Hoe',
            count: 1,
            to: chestEndpoint('chest-tool-rack', 'Tool Rack')
          })
        ])
      ],
      requests: [],
      dependencies: [],
      greenlightRuleId: null,
      location: { x: 6, z: 2, label: 'Workshop' },
      createdBy: 'seed',
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: 'job-safe-setup',
      goalId: 'goal-safe-setup',
      planId: null,
      templateId: 'safe_zone_setup',
      label: 'Prepare safe setup crate',
      detail: 'Blocko simulates utility prep for torches and compass support without placing blocks.',
      assignedBotId: 'blocko',
      status: 'queued',
      approval: 'greenlit',
      destructive: false,
      progressPercent: 0,
      steps: [
        step('step-craft-torches', 'Prepare torches', 1, 'Use coal and sticks to prepare a torch bundle.', [
          effect({
            kind: 'consume',
            itemId: 'coal',
            label: 'Coal',
            count: 5,
            from: chestEndpoint('chest-workshop-materials', 'Workshop Materials')
          }),
          effect({
            kind: 'consume',
            itemId: 'stick',
            label: 'Sticks',
            count: 5,
            from: chestEndpoint('chest-workshop-materials', 'Workshop Materials')
          }),
          effect({
            kind: 'produce',
            itemId: 'torch',
            label: 'Torches',
            count: 20,
            to: botEndpoint('blocko', 'Blocko')
          })
        ]),
        step('step-craft-compass', 'Craft compass', 2, 'Create one compass for Maphew support.', [
          effect({
            kind: 'consume',
            itemId: 'iron_ingot',
            label: 'Iron Ingots',
            count: 4,
            from: chestEndpoint('chest-workshop-materials', 'Workshop Materials')
          }),
          effect({
            kind: 'consume',
            itemId: 'redstone_dust',
            label: 'Redstone Dust',
            count: 1,
            from: chestEndpoint('chest-workshop-materials', 'Workshop Materials')
          }),
          effect({
            kind: 'produce',
            itemId: 'compass',
            label: 'Compass',
            count: 1,
            to: botEndpoint('blocko', 'Blocko')
          })
        ]),
        step('step-stock-safe-crate', 'Stock safe setup crate', 3, 'Move utility supplies into the safe setup crate.', [
          effect({
            kind: 'stock',
            itemId: 'torch',
            label: 'Torches',
            count: 20,
            from: botEndpoint('blocko', 'Blocko'),
            to: chestEndpoint('chest-safe-setup', 'Safe Setup Crate')
          }),
          effect({
            kind: 'stock',
            itemId: 'compass',
            label: 'Compass',
            count: 1,
            from: botEndpoint('blocko', 'Blocko'),
            to: chestEndpoint('chest-safe-setup', 'Safe Setup Crate')
          })
        ])
      ],
      requests: [],
      dependencies: [],
      greenlightRuleId: 'greenlight-common-logistics',
      location: { x: 0, z: 0, label: 'Base camp' },
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
    },
    {
      id: 'goal-safe-setup',
      label: 'Prepare safe setup',
      detail: 'Stock non-destructive utility supplies before larger work starts.',
      status: 'active',
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
    proposals: [],
    logistics: seedLogistics(timestamp)
  }
}

function mergeMissingSeedData(state: CoordinationState) {
  const timestamp = now()
  const seeded = seedState()
  const templateIds = new Set(state.templates.map((template) => template.id))
  const goalIds = new Set(state.goals.map((goal) => goal.id))
  const jobIds = new Set(state.jobs.map((job) => job.id))
  const greenlightIds = new Set(state.greenlights.map((rule) => rule.id))

  state.templates.push(...seeded.templates.filter((template) => !templateIds.has(template.id)))
  state.goals.push(...seeded.goals.filter((goal) => !goalIds.has(goal.id)))
  state.jobs.push(...seeded.jobs.filter((job) => !jobIds.has(job.id)))
  state.greenlights.push(...seeded.greenlights.filter((rule) => !greenlightIds.has(rule.id)))

  for (const seededJob of seeded.jobs) {
    const existingJob = state.jobs.find((job) => job.id === seededJob.id)

    if (!existingJob) continue

    for (const seededStep of seededJob.steps) {
      const existingStep = existingJob.steps.find((jobStep) => jobStep.id === seededStep.id)

      if (existingStep && !existingStep.itemEffects?.length && seededStep.itemEffects?.length) {
        existingStep.itemEffects = seededStep.itemEffects
      }
    }
  }

  const commonGreenlight = state.greenlights.find((rule) => rule.id === 'greenlight-common-logistics')

  if (commonGreenlight && !commonGreenlight.templateIds.includes('safe_zone_setup')) {
    commonGreenlight.templateIds.push('safe_zone_setup')
    commonGreenlight.notes = commonGreenlight.notes.includes('Phase 6')
      ? commonGreenlight.notes
      : 'Phase 6 simulated logistics only; non-Maphew bots remain simulated.'
    commonGreenlight.updatedAt = timestamp
  }

  if (!state.logistics) {
    state.logistics = seedLogistics(timestamp)
    return
  }

  const chestIds = new Set(state.logistics.chests.map((chest) => chest.id))
  const inventoryIds = new Set(state.logistics.inventories.map((inventory) => inventory.botId))
  const recipeIds = new Set(state.logistics.recipes.map((recipe) => recipe.id))

  state.logistics.chests.push(...seeded.logistics.chests.filter((chest) => !chestIds.has(chest.id)))
  state.logistics.inventories.push(...seeded.logistics.inventories.filter((inventory) => !inventoryIds.has(inventory.botId)))
  state.logistics.recipes.push(...seeded.logistics.recipes.filter((recipe) => !recipeIds.has(recipe.id)))
  state.logistics.movements ??= []
}

function migrateCoordinationState(raw: unknown): { state: CoordinationState, migrated: boolean } {
  const parsed = raw as Record<string, unknown> & { version?: number }

  if (parsed.version !== 1 && parsed.version !== 2) {
    throw new Error('Unsupported coordination state version')
  }

  const state = parsed as unknown as CoordinationState
  const migrated = parsed.version !== stateVersion || !state.logistics

  state.version = stateVersion
  state.crew ??= []
  state.goals ??= []
  state.plans ??= []
  state.jobs ??= []
  state.templates ??= []
  state.greenlights ??= []
  state.proposals ??= []
  mergeMissingSeedData(state)
  refreshCrewQueueState(state)

  return { state, migrated }
}

function stackCount(items: ItemStack[], itemId: string) {
  return items.find((itemStack) => itemStack.itemId === itemId)?.count ?? 0
}

function addItems(items: ItemStack[], stack: ItemStack) {
  const existing = items.find((itemStack) => itemStack.itemId === stack.itemId)

  if (existing) {
    existing.count += stack.count
    existing.label = stack.label
    return
  }

  items.push({ ...stack })
}

function removeItems(items: ItemStack[], stack: ItemStack) {
  const existing = items.find((itemStack) => itemStack.itemId === stack.itemId)

  if (!existing || existing.count < stack.count) {
    throw new Error(`Not enough ${stack.label} available`)
  }

  existing.count -= stack.count

  if (existing.count === 0) {
    items.splice(items.indexOf(existing), 1)
  }
}

function itemsForEndpoint(state: CoordinationState, endpoint: LogisticsEndpoint) {
  if (endpoint.type === 'chest') {
    const chest = state.logistics.chests.find((item) => item.id === endpoint.id)

    if (!chest) throw new Error(`Unknown chest: ${endpoint.label}`)
    return { items: chest.items, markUpdated: (timestamp: string) => { chest.updatedAt = timestamp } }
  }

  if (endpoint.type === 'bot') {
    const inventory = state.logistics.inventories.find((item) => item.botId === endpoint.id)

    if (!inventory) throw new Error(`Unknown bot inventory: ${endpoint.label}`)
    return { items: inventory.items, markUpdated: (timestamp: string) => { inventory.updatedAt = timestamp } }
  }

  throw new Error(`Unsupported logistics endpoint: ${endpoint.label}`)
}

function applyItemEffect(state: CoordinationState, job: CrewJob, stepRecord: JobStep, itemEffect: LogisticsItemEffect, timestamp: string): ItemMovementRecord {
  const stack = item(itemEffect.itemId, itemEffect.label, itemEffect.count)

  if (itemEffect.from) {
    const source = itemsForEndpoint(state, itemEffect.from)
    removeItems(source.items, stack)
    source.markUpdated(timestamp)
  }

  if (itemEffect.to) {
    const target = itemsForEndpoint(state, itemEffect.to)
    addItems(target.items, stack)
    target.markUpdated(timestamp)
  }

  const movement: ItemMovementRecord = {
    id: `move-${randomUUID()}`,
    timestamp,
    jobId: job.id,
    stepId: stepRecord.id,
    kind: itemEffect.kind,
    itemId: itemEffect.itemId,
    label: itemEffect.label,
    count: itemEffect.count,
    from: itemEffect.from,
    to: itemEffect.to
  }

  state.logistics.movements.unshift(movement)
  state.logistics.movements = state.logistics.movements.slice(0, 80)
  return movement
}

function lowStockWarnings(state: CoordinationState): LowStockWarning[] {
  return state.logistics.chests.flatMap((chest) => chest.minimums
    .map((minimum) => ({
      chestId: chest.id,
      chestLabel: chest.label,
      itemId: minimum.itemId,
      label: minimum.label,
      current: stackCount(chest.items, minimum.itemId),
      minimum: minimum.count
    }))
    .filter((warning) => warning.current < warning.minimum))
}

function activeJobsForBot(state: CoordinationState, botId: CrewBotId) {
  return state.jobs.filter((job) => job.assignedBotId === botId && !terminalJobStates.has(job.status))
}

function refreshCrewQueueState(state: CoordinationState) {
  const timestamp = now()

  for (const bot of state.crew) {
    const activeJobs = activeJobsForBot(state, bot.id)
    const inventory = state.logistics?.inventories.find((item) => item.botId === bot.id)
    const itemSummary = inventory?.items.length
      ? inventory.items.slice(0, 3).map((stack) => `${stack.label} x${stack.count}`).join(', ')
      : inventory ? 'Empty inventory' : bot.inventorySummary

    bot.queueLength = activeJobs.length
    bot.currentJobId = activeJobs[0]?.id ?? null

    if (bot.runtime !== 'planned') {
      bot.status = activeJobs.some((job) => job.status === 'blocked') ? 'blocked' : activeJobs.length ? 'queued' : 'idle'
      bot.inventorySummary = itemSummary
      bot.lastActivityAt = activeJobs.length || inventory ? timestamp : bot.lastActivityAt
    }
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

  state.version = stateVersion
  refreshCrewQueueState(state)
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
    const { state, migrated } = migrateCoordinationState(JSON.parse(raw))

    if (migrated) {
      await saveState(state)
      await appendEvent({
        type: 'coordination_state_migrated',
        severity: 'info',
        botId: null,
        jobId: null,
        title: 'Coordination state upgraded',
        message: 'Migrated coordination state to version 2 with simulated logistics.'
      })
    }

    return state
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
  const lowStock = lowStockWarnings(state)
  const { statePath, eventLogPath } = getCoordinationPaths()

  return {
    ...state,
    requests,
    events,
    lowStockWarnings: lowStock,
    summary: {
      goalsOpen: state.goals.filter((goal) => !['completed', 'rejected'].includes(goal.status)).length,
      jobsActive: state.jobs.filter((job) => !completedJobStates.has(job.status)).length,
      jobsPendingApproval: state.jobs.filter((job) => job.approval === 'pending').length + state.proposals.filter((proposal) => proposal.status === 'proposed').length,
      requestsOpen: requests.filter((request) => ['open', 'proposed'].includes(request.status)).length,
      greenlightsEnabled: state.greenlights.filter((rule) => rule.enabled).length,
      lowStockWarnings: lowStock.length,
      movementsLogged: state.logistics.movements.length,
      storagePath: formatLocalPath(statePath),
      eventLogPath: formatLocalPath(eventLogPath)
    }
  }
}

export async function getLogisticsDashboard(): Promise<LogisticsDashboardPayload> {
  const state = await readCoordinationState()

  return {
    ...state.logistics,
    lowStockWarnings: lowStockWarnings(state),
    updatedAt: state.updatedAt
  }
}

export async function simulateJobStep(id: string) {
  const state = await readCoordinationState()
  const job = state.jobs.find((item) => item.id === id)

  if (!job) {
    throw new Error('Job not found')
  }

  if (terminalJobStates.has(job.status)) {
    throw new Error('Job is already terminal')
  }

  if (!runnableApprovals.has(job.approval)) {
    throw new Error('Job must be approved or greenlit before simulation can advance')
  }

  const incompleteDependency = job.dependencies.find((dependencyId) => {
    const dependency = state.jobs.find((item) => item.id === dependencyId)
    return dependency && dependency.status !== 'completed'
  })

  if (incompleteDependency) {
    job.status = 'blocked'
    job.updatedAt = now()
    await saveState(state)
    await appendEvent({
      type: 'job_blocked_dependency',
      severity: 'warning',
      botId: job.assignedBotId,
      jobId: job.id,
      title: 'Job blocked',
      message: `${job.label} is waiting on ${incompleteDependency}.`
    })
    throw new Error(`Job is waiting on dependency ${incompleteDependency}`)
  }

  const nextStep = [...job.steps].sort((a, b) => a.order - b.order).find((item) => item.status !== 'completed' && item.status !== 'skipped')

  if (!nextStep) {
    job.status = 'completed'
    job.progressPercent = 100
    job.updatedAt = now()
    await saveState(state)
    return getCoordinationDashboard()
  }

  const timestamp = now()
  const appliedMovements: ItemMovementRecord[] = []

  try {
    for (const itemEffect of nextStep.itemEffects ?? []) {
      appliedMovements.push(applyItemEffect(state, job, nextStep, itemEffect, timestamp))
    }
  } catch (error) {
    nextStep.status = 'blocked'
    job.status = 'blocked'
    job.updatedAt = timestamp
    await saveState(state)
    await appendEvent({
      type: 'job_blocked_materials',
      severity: 'warning',
      botId: job.assignedBotId,
      jobId: job.id,
      title: 'Materials missing',
      message: error instanceof Error ? error.message : `${job.label} is missing materials.`
    })
    throw error
  }

  nextStep.status = 'completed'
  nextStep.startedAt ??= timestamp
  nextStep.completedAt = timestamp
  job.status = job.steps.every((item) => item.status === 'completed' || item.status === 'skipped') ? 'completed' : 'running'
  job.progressPercent = Math.round((job.steps.filter((item) => item.status === 'completed' || item.status === 'skipped').length / job.steps.length) * 100)
  job.updatedAt = timestamp

  if (job.status === 'completed') {
    for (const request of allRequests(state)) {
      if (request.spawnedJobId === job.id && request.status !== 'resolved') {
        request.status = 'resolved'
        request.updatedAt = timestamp
      }
    }
  }

  await saveState(state)
  await appendEvent({
    type: job.status === 'completed' ? 'job_completed' : 'job_step_simulated',
    severity: job.status === 'completed' ? 'success' : 'info',
    botId: job.assignedBotId,
    jobId: job.id,
    title: job.status === 'completed' ? 'Job completed' : 'Step simulated',
    message: appliedMovements.length
      ? `${nextStep.label}: ${appliedMovements.map((movement) => `${movement.label} x${movement.count}`).join(', ')}`
      : nextStep.label
  })

  return getCoordinationDashboard()
}

export async function updateCrewBotRuntime(input: {
  botId: CrewBotId
  runtime?: CrewBot['runtime']
  status?: CrewBot['status']
  currentJobId?: string | null
  inventorySummary?: string
  locationLabel?: string
}) {
  const state = await readCoordinationState()
  const bot = state.crew.find((item) => item.id === input.botId)

  if (!bot) {
    throw new Error('Crew bot not found')
  }

  if (input.runtime) bot.runtime = input.runtime
  if (input.status) bot.status = input.status
  if ('currentJobId' in input) bot.currentJobId = input.currentJobId ?? null
  if (input.inventorySummary) bot.inventorySummary = input.inventorySummary
  if (input.locationLabel) bot.locationLabel = input.locationLabel
  bot.lastActivityAt = now()

  await saveState(state)
  return getCoordinationDashboard()
}

export async function recordCoordinationEvent(event: Omit<CoordinationEvent, 'id' | 'timestamp'>) {
  return appendEvent(event)
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

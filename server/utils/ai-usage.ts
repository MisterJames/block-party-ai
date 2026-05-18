import { randomUUID } from 'node:crypto'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import type { AiUsageDashboardSummary, AiUsagePricingSnapshot, AiUsageRecord, AiUsageRecordPreview, SparklineMetric } from '../../types/dashboard'

const tokensPerMillion = 1_000_000
const defaultProjectId = 'local'
const defaultWorldId = 'local-world'

type UsageRecordInput = {
  timestamp?: string
  provider?: 'openai'
  model?: string
  purpose?: string
  projectId?: string
  worldId?: string
  inputTokens?: number
  cachedInputTokens?: number
  outputTokens?: number
  totalTokens?: number
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
    cached_tokens?: number
    prompt_tokens_details?: {
      cached_tokens?: number
    }
  }
  pricing?: Partial<AiUsagePricingSnapshot>
}

type ParsedRecords = {
  records: AiUsageRecord[]
  skippedLines: number
}

function usageLogPath() {
  const configuredPath = process.env.AI_USAGE_LOG_PATH

  if (!configuredPath) {
    return join(process.cwd(), 'state', 'ai-usage.jsonl')
  }

  return isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath)
}

function formatStoragePath(path: string) {
  const localPath = relative(process.cwd(), path)

  return localPath && !localPath.startsWith('..') ? localPath.replaceAll('\\', '/') : path
}

function numberFromEnv(name: string) {
  const rawValue = process.env[name]

  if (!rawValue) {
    return null
  }

  const value = Number(rawValue)
  return Number.isFinite(value) && value >= 0 ? value : null
}

function safeTokenCount(value: unknown) {
  const numericValue = Number(value ?? 0)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }

  return Math.round(numericValue)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

function formatUsd(value: number | null) {
  if (value === null) {
    return 'Unpriced'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1 ? 2 : 4
  }).format(value)
}

function safeDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date()

  return Number.isNaN(date.getTime()) ? new Date() : date
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function parsePricingJson(model: string): AiUsagePricingSnapshot | null {
  const rawPricing = process.env.AI_USAGE_PRICES_JSON

  if (!rawPricing) {
    return null
  }

  try {
    const pricing = JSON.parse(rawPricing) as Record<string, Partial<AiUsagePricingSnapshot>>
    const modelPricing = pricing[model]

    if (!modelPricing) {
      return null
    }

    return {
      inputUsdPerMillion: modelPricing.inputUsdPerMillion ?? null,
      outputUsdPerMillion: modelPricing.outputUsdPerMillion ?? null,
      cachedInputUsdPerMillion: modelPricing.cachedInputUsdPerMillion ?? null,
      currency: 'USD',
      source: 'AI_USAGE_PRICES_JSON'
    }
  } catch {
    return null
  }
}

function resolvePricing(model: string, explicitPricing?: Partial<AiUsagePricingSnapshot>): AiUsagePricingSnapshot {
  if (explicitPricing?.inputUsdPerMillion !== undefined || explicitPricing?.outputUsdPerMillion !== undefined) {
    return {
      inputUsdPerMillion: explicitPricing.inputUsdPerMillion ?? null,
      outputUsdPerMillion: explicitPricing.outputUsdPerMillion ?? null,
      cachedInputUsdPerMillion: explicitPricing.cachedInputUsdPerMillion ?? null,
      currency: 'USD',
      source: explicitPricing.source ?? 'recorded-call'
    }
  }

  const jsonPricing = parsePricingJson(model)

  if (jsonPricing) {
    return jsonPricing
  }

  const inputUsdPerMillion = numberFromEnv('AI_USAGE_DEFAULT_INPUT_USD_PER_MILLION')
  const outputUsdPerMillion = numberFromEnv('AI_USAGE_DEFAULT_OUTPUT_USD_PER_MILLION')
  const cachedInputUsdPerMillion = numberFromEnv('AI_USAGE_DEFAULT_CACHED_INPUT_USD_PER_MILLION')

  if (inputUsdPerMillion !== null || outputUsdPerMillion !== null) {
    return {
      inputUsdPerMillion,
      outputUsdPerMillion,
      cachedInputUsdPerMillion,
      currency: 'USD',
      source: 'AI_USAGE_DEFAULT_*'
    }
  }

  return {
    inputUsdPerMillion: null,
    outputUsdPerMillion: null,
    cachedInputUsdPerMillion: null,
    currency: 'USD',
    source: 'unconfigured'
  }
}

function calculateCostUsd(record: Omit<AiUsageRecord, 'estimatedCostUsd'>) {
  if (record.pricing.inputUsdPerMillion === null || record.pricing.outputUsdPerMillion === null) {
    return null
  }

  const cachedInputTokens = Math.min(record.cachedInputTokens, record.inputTokens)
  const uncachedInputTokens = record.inputTokens - cachedInputTokens
  const cachedInputUsdPerMillion = record.pricing.cachedInputUsdPerMillion ?? record.pricing.inputUsdPerMillion
  const inputCost = (uncachedInputTokens * record.pricing.inputUsdPerMillion) / tokensPerMillion
  const cachedInputCost = (cachedInputTokens * cachedInputUsdPerMillion) / tokensPerMillion
  const outputCost = (record.outputTokens * record.pricing.outputUsdPerMillion) / tokensPerMillion

  return Number((inputCost + cachedInputCost + outputCost).toFixed(8))
}

function normalizeRecord(input: UsageRecordInput): AiUsageRecord {
  const timestamp = safeDate(input.timestamp).toISOString()
  const model = input.model?.trim() || process.env.OPENAI_MODEL || 'unknown-model'
  const usage = input.usage ?? {}
  const inputTokens = safeTokenCount(input.inputTokens ?? usage.input_tokens ?? usage.prompt_tokens)
  const outputTokens = safeTokenCount(input.outputTokens ?? usage.output_tokens ?? usage.completion_tokens)
  const cachedInputTokens = safeTokenCount(input.cachedInputTokens ?? usage.cached_tokens ?? usage.prompt_tokens_details?.cached_tokens)
  const totalTokens = safeTokenCount(input.totalTokens ?? usage.total_tokens) || inputTokens + outputTokens
  const pricing = resolvePricing(model, input.pricing)
  const recordWithoutCost = {
    id: randomUUID(),
    timestamp,
    provider: input.provider ?? 'openai',
    model,
    purpose: input.purpose?.trim() || 'unspecified',
    projectId: input.projectId?.trim() || defaultProjectId,
    worldId: input.worldId?.trim() || defaultWorldId,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    pricing
  }

  return {
    ...recordWithoutCost,
    estimatedCostUsd: calculateCostUsd(recordWithoutCost)
  }
}

function recordPreview(record: AiUsageRecord): AiUsageRecordPreview {
  return {
    id: record.id,
    timestamp: record.timestamp,
    model: record.model,
    purpose: record.purpose,
    totalTokens: record.totalTokens,
    estimatedCostUsd: record.estimatedCostUsd
  }
}

async function parseUsageRecords(): Promise<ParsedRecords> {
  try {
    const rawLog = await readFile(usageLogPath(), 'utf8')
    const lines = rawLog.split(/\r?\n/).filter(Boolean)
    const parsed: ParsedRecords = {
      records: [],
      skippedLines: 0
    }

    for (const line of lines) {
      try {
        const record = JSON.parse(line) as AiUsageRecord

        if (record.id && record.timestamp && record.model) {
          parsed.records.push(record)
        } else {
          parsed.skippedLines += 1
        }
      } catch {
        parsed.skippedLines += 1
      }
    }

    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        records: [],
        skippedLines: 0
      }
    }

    throw error
  }
}

function hourlySeries(records: AiUsageRecord[], selector: (record: AiUsageRecord) => number) {
  const now = new Date()
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now)
    date.setHours(now.getHours() - (11 - index), 0, 0, 0)

    return {
      key: date.toISOString(),
      value: 0
    }
  })

  for (const record of records) {
    const date = new Date(record.timestamp)
    date.setMinutes(0, 0, 0)
    const bucket = buckets.find((item) => item.key === date.toISOString())

    if (bucket) {
      bucket.value += selector(record)
    }
  }

  return buckets.map((bucket) => Number(bucket.value.toFixed(4)))
}

function metric(id: string, label: string, value: string, helper: string, color: string, data: number[], tone: SparklineMetric['tone'] = 'neutral'): SparklineMetric {
  return {
    id,
    label,
    value,
    helper,
    trend: tone === 'success' ? 'up' : tone,
    color,
    data: data.some((item) => item > 0) ? data : Array.from({ length: 12 }, () => 0),
    tone
  }
}

export async function recordAiUsage(input: UsageRecordInput) {
  const record = normalizeRecord(input)
  const path = usageLogPath()

  await mkdir(dirname(path), { recursive: true })
  await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8')

  return record
}

export async function listAiUsageRecords(limit = 50) {
  const { records, skippedLines } = await parseUsageRecords()

  return {
    records: records
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
      .slice(0, limit),
    skippedLines
  }
}

export async function getAiUsageSummary(): Promise<AiUsageDashboardSummary> {
  const { records, skippedLines } = await parseUsageRecords()
  const todayKey = localDateKey(new Date())
  const todayRecords = records.filter((record) => localDateKey(new Date(record.timestamp)) === todayKey)
  const totalTokensToday = todayRecords.reduce((total, record) => total + record.totalTokens, 0)
  const totalTokensAllTime = records.reduce((total, record) => total + record.totalTokens, 0)
  const pricedTodayRecords = todayRecords.filter((record) => record.estimatedCostUsd !== null)
  const pricedRecords = records.filter((record) => record.estimatedCostUsd !== null)
  const unpricedRecords = records.length - pricedRecords.length
  const totalCostTodayUsd = pricedTodayRecords.length === todayRecords.length
    ? pricedTodayRecords.reduce((total, record) => total + (record.estimatedCostUsd ?? 0), 0)
    : null
  const totalCostAllTimeUsd = pricedRecords.length === records.length
    ? pricedRecords.reduce((total, record) => total + (record.estimatedCostUsd ?? 0), 0)
    : null
  const recentRecords = records
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 6)
  const latestRecord = recentRecords[0]
  const costHelper = unpricedRecords > 0 ? `${unpricedRecords} unpriced calls` : `${pricedRecords.length} priced calls`

  return {
    metrics: [
      metric(
        'tokens-today',
        'API Tokens Today',
        formatNumber(totalTokensToday),
        todayRecords.length ? `${todayRecords.length} calls today` : 'No calls today',
        '#4ade80',
        hourlySeries(todayRecords, (record) => record.totalTokens),
        todayRecords.length ? 'success' : 'neutral'
      ),
      metric(
        'world-tokens',
        'World Total Tokens',
        formatNumber(totalTokensAllTime),
        records.length ? 'All local records' : 'No records yet',
        '#38bdf8',
        hourlySeries(records, (record) => record.totalTokens),
        'neutral'
      ),
      metric(
        'cost-today',
        'AI Cost Today',
        formatUsd(totalCostTodayUsd),
        todayRecords.length ? costHelper : 'Configure pricing before calls',
        totalCostTodayUsd === null ? '#fbbf24' : '#4ade80',
        hourlySeries(todayRecords, (record) => record.estimatedCostUsd ?? 0),
        totalCostTodayUsd === null && todayRecords.length ? 'warning' : 'neutral'
      ),
      metric(
        'world-cost',
        'World Total Cost',
        formatUsd(totalCostAllTimeUsd),
        records.length ? costHelper : 'All time',
        totalCostAllTimeUsd === null ? '#fbbf24' : '#a78bfa',
        hourlySeries(records, (record) => record.estimatedCostUsd ?? 0),
        totalCostAllTimeUsd === null && records.length ? 'warning' : 'neutral'
      )
    ],
    currentModel: latestRecord?.model ?? process.env.OPENAI_MODEL ?? 'Not recorded',
    lastCallAt: latestRecord?.timestamp ?? null,
    recordsToday: todayRecords.length,
    recordsTotal: records.length,
    totalTokensToday,
    totalTokensAllTime,
    totalCostTodayUsd,
    totalCostAllTimeUsd,
    unpricedRecords,
    skippedLines,
    recentRecords: recentRecords.map(recordPreview),
    storage: {
      path: formatStoragePath(usageLogPath()),
      gitIgnored: true,
      appendOnly: true,
      survivesNuxtCleanup: true
    }
  }
}

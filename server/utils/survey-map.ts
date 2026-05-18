import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import type { MaphewPosition, SurveyFindingGroup, SurveyFindingPoint, SurveyMapPayload, SurveyMapTile, SurveySampleRecord, SurveySummary } from '../../types/dashboard'
import { formatLocalPath, getSurveyConfig } from './minecraft-config'
import { getMaphewStatus } from './maphew'

type ParsedSurveySamples = {
  records: SurveySampleRecord[]
  skippedLines: number
}

function routePoints() {
  const { area } = getSurveyConfig()
  const startX = area.center.x - Math.floor(area.size.x / 2)
  const startZ = area.center.z - Math.floor(area.size.z / 2)
  const columns = Math.ceil(area.size.x / area.sampleInterval)
  const rows = Math.ceil(area.size.z / area.sampleInterval)
  const route: SurveyMapPayload['route'] = []

  for (let gridZ = 0; gridZ < rows; gridZ += 1) {
    const z = startZ + gridZ * area.sampleInterval
    const gridXs = Array.from({ length: columns }, (_, gridX) => gridX)

    if (gridZ % 2 === 1) {
      gridXs.reverse()
    }

    for (const gridX of gridXs) {
      route.push({
        x: startX + gridX * area.sampleInterval,
        z,
        gridX,
        gridZ,
        routeIndex: route.length,
        sampled: false
      })
    }
  }

  return route
}

async function readSamples(): Promise<ParsedSurveySamples> {
  const { logPath, surveyId } = getSurveyConfig()

  try {
    const rawLog = await readFile(logPath, 'utf8')
    const parsed: ParsedSurveySamples = {
      records: [],
      skippedLines: 0
    }

    for (const line of rawLog.split(/\r?\n/).filter(Boolean)) {
      try {
        const record = JSON.parse(line) as SurveySampleRecord

        if (record.id && record.surveyId === surveyId && typeof record.x === 'number' && typeof record.z === 'number') {
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

function routeKey(x: number, z: number) {
  return `${x},${z}`
}

function findingPoint(tile: SurveyMapTile, type: string, category: SurveyFindingPoint['category']): SurveyFindingPoint {
  return {
    id: `${category}:${type}:${tile.x},${tile.z}`,
    type,
    category,
    x: tile.x,
    z: tile.z,
    gridX: tile.gridX,
    gridZ: tile.gridZ,
    surfaceY: tile.surfaceY,
    surfaceBlock: tile.surfaceBlock,
    walkable: tile.walkable,
    timestamp: tile.timestamp,
    error: tile.error
  }
}

function grouped(points: SurveyFindingPoint[]) {
  const byType = new Map<string, SurveyFindingPoint[]>()

  for (const point of points) {
    byType.set(point.type, [...(byType.get(point.type) ?? []), point])
  }

  return Array.from(byType.entries())
    .map(([type, groupedPoints]): SurveyFindingGroup => ({
      id: `${groupedPoints[0]?.category ?? 'surface'}:${type}`,
      type,
      category: groupedPoints[0]?.category ?? 'surface',
      count: groupedPoints.length,
      points: groupedPoints.sort((left, right) => left.z - right.z || left.x - right.x)
    }))
    .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type))
}

function surveyStatus(maphewStatus: Awaited<ReturnType<typeof getMaphewStatus>> | null, sampledTiles: number, totalTiles: number): SurveySummary['status'] {
  if (maphewStatus?.survey.status) {
    return maphewStatus.survey.status
  }

  if (sampledTiles >= totalTiles && totalTiles > 0) {
    return 'complete'
  }

  return sampledTiles ? 'paused' : 'idle'
}

function latestMap(records: SurveySampleRecord[]) {
  const latest = new Map<string, SurveySampleRecord>()
  let duplicateCoordinates = 0

  for (const record of records) {
    const key = routeKey(record.x, record.z)

    if (latest.has(key)) {
      duplicateCoordinates += 1
    }

    latest.set(key, record)
  }

  return {
    latest,
    duplicateCoordinates
  }
}

export async function getSurveyMapPayload(): Promise<SurveyMapPayload> {
  const config = getSurveyConfig()
  const route = routePoints()
  const routeByKey = new Map(route.map((point) => [routeKey(point.x, point.z), point]))
  const [{ records, skippedLines }, maphewStatus] = await Promise.all([
    readSamples(),
    getMaphewStatus().catch(() => null)
  ])
  const { latest, duplicateCoordinates } = latestMap(records)
  const tiles: SurveyMapTile[] = []

  for (const [key, record] of latest.entries()) {
    const routePoint = routeByKey.get(key)

    if (!routePoint) {
      continue
    }

    routePoint.sampled = true
    tiles.push({
      ...record,
      gridX: routePoint.gridX,
      gridZ: routePoint.gridZ,
      routeIndex: routePoint.routeIndex,
      latestForCoordinate: true
    })
  }

  tiles.sort((left, right) => left.routeIndex - right.routeIndex)

  const hazardPoints = tiles.flatMap((tile) => tile.hazards.map((hazard) => findingPoint(tile, hazard, 'hazard')))
  const landmarkPoints = tiles.flatMap((tile) => tile.landmarks.map((landmark) => findingPoint(tile, landmark, 'landmark')))
  const surfacePoints = tiles
    .filter((tile) => tile.surfaceBlock)
    .map((tile) => findingPoint(tile, tile.surfaceBlock!, 'surface'))
  const errorPoints = tiles
    .filter((tile) => tile.error)
    .map((tile) => findingPoint(tile, tile.error ?? 'sample error', 'error'))
  const sampledTiles = tiles.length
  const totalTiles = route.length
  const walkableTiles = tiles.filter((tile) => tile.walkable).length
  const surfaceHeights = tiles
    .map((tile) => tile.surfaceY)
    .filter((height): height is number => typeof height === 'number')
  const lastSurveyAt = tiles.at(-1)?.timestamp ?? null
  const startX = config.area.center.x - Math.floor(config.area.size.x / 2)
  const startZ = config.area.center.z - Math.floor(config.area.size.z / 2)
  const columns = Math.ceil(config.area.size.x / config.area.sampleInterval)
  const rows = Math.ceil(config.area.size.z / config.area.sampleInterval)

  return {
    surveyId: config.surveyId,
    status: surveyStatus(maphewStatus, sampledTiles, totalTiles),
    area: config.area,
    bounds: {
      minX: startX,
      maxX: startX + (columns - 1) * config.area.sampleInterval,
      minZ: startZ,
      maxZ: startZ + (rows - 1) * config.area.sampleInterval
    },
    grid: {
      columns,
      rows,
      totalTiles,
      sampledTiles,
      sampleInterval: config.area.sampleInterval
    },
    progressPercent: totalTiles ? Math.min(100, Math.round((sampledTiles / totalTiles) * 100)) : 0,
    lastSurveyAt,
    maphewPosition: maphewStatus?.position as MaphewPosition | null,
    route,
    tiles,
    findings: {
      hazards: grouped(hazardPoints),
      landmarks: grouped(landmarkPoints),
      surfaceBlocks: grouped(surfacePoints),
      errors: grouped(errorPoints)
    },
    stats: {
      hazardsFound: hazardPoints.length,
      landmarksFound: landmarkPoints.length,
      walkableTiles,
      walkablePercent: sampledTiles ? Math.round((walkableTiles / sampledTiles) * 100) : 0,
      minSurfaceY: surfaceHeights.length ? Math.min(...surfaceHeights) : null,
      maxSurfaceY: surfaceHeights.length ? Math.max(...surfaceHeights) : null
    },
    parsing: {
      skippedLines,
      duplicateCoordinates,
      storagePath: formatLocalPath(config.logPath),
      gitIgnored: relative(process.cwd(), config.logPath).startsWith('state')
    }
  }
}

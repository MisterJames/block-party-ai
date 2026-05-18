<template>
  <div
    ref="mapShell"
    class="relative aspect-square w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950"
  >
    <canvas
      ref="canvas"
      class="pixelated size-full"
      :width="canvasSize"
      :height="canvasSize"
      role="img"
      aria-label="Maphew survey pixel map"
      @mousemove="handlePointerMove"
      @mouseleave="emit('hover-point', null)"
    />

    <div
      v-if="hoverPoint"
      class="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 border border-cyan-200 bg-cyan-300/20"
      :style="pointStyle(hoverPoint)"
      data-testid="world-map-hover"
    />

    <div
      v-if="selectedPoint"
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
      :style="pointStyle(selectedPoint)"
      data-testid="world-map-pin"
    >
      <div class="rounded-md border border-cyan-300 bg-slate-950/95 px-2 py-1 text-xs text-cyan-100 shadow-lg shadow-slate-950/40">
        <div class="flex items-center gap-1">
          <UIcon name="i-lucide-map-pin" class="size-3 text-cyan-300" />
          <span class="font-medium">{{ selectedPoint.type }}</span>
        </div>
        <p class="mt-0.5 text-slate-400">{{ selectedPoint.x }}, {{ selectedPoint.z }}</p>
      </div>
      <div class="mx-auto h-3 w-px bg-cyan-300" />
    </div>

    <div
      v-if="maphewOverlay"
      class="pointer-events-none absolute z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-100 bg-sky-400 shadow-sm shadow-sky-400/60"
      :style="maphewOverlay"
      title="Maphew"
    />

    <div class="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap gap-2 text-xs">
      <span class="rounded bg-slate-950/85 px-2 py-1 text-slate-300">{{ payload.grid.sampledTiles }}/{{ payload.grid.totalTiles }} sampled</span>
      <span class="rounded bg-slate-950/85 px-2 py-1 text-amber-300">{{ payload.stats.hazardsFound }} hazards</span>
      <span class="rounded bg-slate-950/85 px-2 py-1 text-cyan-300">{{ payload.stats.landmarksFound }} landmarks</span>
      <span class="rounded bg-slate-950/85 px-2 py-1 text-emerald-300">{{ payload.stats.walkablePercent }}% walkable</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SurveyFindingPoint, SurveyMapLayerState, SurveyMapPayload, SurveyMapTile } from '~/types/dashboard'

const props = defineProps<{
  payload: SurveyMapPayload
  layers: SurveyMapLayerState
  hoverPoint: SurveyFindingPoint | null
  selectedPoint: SurveyFindingPoint | null
}>()

const emit = defineEmits<{
  'hover-point': [point: SurveyFindingPoint | null]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const mapShell = ref<HTMLElement | null>(null)
const canvasSize = 768

const tileByGrid = computed(() => {
  const map = new Map<string, SurveyMapTile>()

  for (const tile of props.payload.tiles) {
    map.set(`${tile.gridX},${tile.gridZ}`, tile)
  }

  return map
})

const allFindingPoints = computed(() => [
  ...props.payload.findings.hazards.flatMap((group) => group.points),
  ...props.payload.findings.landmarks.flatMap((group) => group.points),
  ...props.payload.findings.errors.flatMap((group) => group.points)
])

const maphewOverlay = computed(() => {
  const position = props.payload.maphewPosition

  if (!position) {
    return null
  }

  const gridX = (position.x - props.payload.bounds.minX) / props.payload.area.sampleInterval
  const gridZ = (position.z - props.payload.bounds.minZ) / props.payload.area.sampleInterval

  return {
    left: `${(gridX / Math.max(1, props.payload.grid.columns - 1)) * 100}%`,
    top: `${(gridZ / Math.max(1, props.payload.grid.rows - 1)) * 100}%`
  }
})

watch(
  () => [props.payload, props.layers],
  () => drawMap(),
  { deep: true }
)

onMounted(() => {
  drawMap()
})

function pointStyle(point: SurveyFindingPoint) {
  return {
    left: `${((point.gridX + 0.5) / props.payload.grid.columns) * 100}%`,
    top: `${((point.gridZ + 0.5) / props.payload.grid.rows) * 100}%`
  }
}

function handlePointerMove(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect()
  const gridX = Math.min(props.payload.grid.columns - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * props.payload.grid.columns)))
  const gridZ = Math.min(props.payload.grid.rows - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * props.payload.grid.rows)))
  const finding = allFindingPoints.value.find((point) => point.gridX === gridX && point.gridZ === gridZ)

  emit('hover-point', finding ?? null)
}

function drawMap() {
  const context = canvas.value?.getContext('2d')

  if (!context) {
    return
  }

  const tileWidth = canvasSize / props.payload.grid.columns
  const tileHeight = canvasSize / props.payload.grid.rows

  context.imageSmoothingEnabled = false
  context.fillStyle = '#020617'
  context.fillRect(0, 0, canvasSize, canvasSize)

  for (let gridZ = 0; gridZ < props.payload.grid.rows; gridZ += 1) {
    for (let gridX = 0; gridX < props.payload.grid.columns; gridX += 1) {
      const tile = tileByGrid.value.get(`${gridX},${gridZ}`)
      const x = Math.floor(gridX * tileWidth)
      const y = Math.floor(gridZ * tileHeight)
      const width = Math.ceil(tileWidth)
      const height = Math.ceil(tileHeight)

      context.fillStyle = tile ? tileColor(tile, props.payload, props.layers.height) : '#0f172a'
      context.fillRect(x, y, width, height)

      if (tile?.walkable && props.layers.walkable) {
        context.fillStyle = 'rgba(52, 211, 153, 0.16)'
        context.fillRect(x, y, width, height)
      }

      if (!tile) {
        context.fillStyle = 'rgba(148, 163, 184, 0.04)'
        context.fillRect(x + 1, y + 1, Math.max(1, width - 2), Math.max(1, height - 2))
      }
    }
  }

  if (props.layers.route) {
    drawRoute(context, tileWidth, tileHeight)
  }

  if (props.layers.hazards) {
    drawMarkers(context, props.payload.findings.hazards.flatMap((group) => group.points), tileWidth, tileHeight, '#f59e0b')
  }

  if (props.layers.landmarks) {
    drawMarkers(context, props.payload.findings.landmarks.flatMap((group) => group.points), tileWidth, tileHeight, '#22d3ee')
  }

  if (props.payload.findings.errors.length) {
    drawMarkers(context, props.payload.findings.errors.flatMap((group) => group.points), tileWidth, tileHeight, '#f43f5e')
  }
}

function drawRoute(context: CanvasRenderingContext2D, tileWidth: number, tileHeight: number) {
  const sampledRoute = props.payload.route.filter((point) => point.sampled)

  context.fillStyle = 'rgba(168, 85, 247, 0.35)'
  for (const point of sampledRoute) {
    context.fillRect(
      point.gridX * tileWidth + tileWidth * 0.36,
      point.gridZ * tileHeight + tileHeight * 0.36,
      Math.max(2, tileWidth * 0.28),
      Math.max(2, tileHeight * 0.28)
    )
  }
}

function drawMarkers(context: CanvasRenderingContext2D, points: SurveyFindingPoint[], tileWidth: number, tileHeight: number, color: string) {
  context.fillStyle = color
  for (const point of points) {
    context.fillRect(
      point.gridX * tileWidth + tileWidth * 0.22,
      point.gridZ * tileHeight + tileHeight * 0.22,
      Math.max(3, tileWidth * 0.56),
      Math.max(3, tileHeight * 0.56)
    )
  }
}

function tileColor(tile: SurveyMapTile, payload: SurveyMapPayload, useHeight: boolean) {
  const base = blockColor(tile.surfaceBlock, tile.error)
  const heightFactor = useHeight && tile.surfaceY !== null && payload.stats.minSurfaceY !== null && payload.stats.maxSurfaceY !== null
    ? 0.72 + ((tile.surfaceY - payload.stats.minSurfaceY) / Math.max(1, payload.stats.maxSurfaceY - payload.stats.minSurfaceY)) * 0.34
    : 1

  return scaleHex(base, heightFactor)
}

function blockColor(block: string | null, error: string | null) {
  if (error) return '#92400e'
  if (!block) return '#334155'
  if (block.includes('water') || block.includes('seagrass')) return '#1d6c88'
  if (block.includes('sand')) return '#c2a15a'
  if (block.includes('grass') || block.includes('moss') || block.includes('fern')) return '#4d7c2f'
  if (block.includes('leaves')) return '#2f6f3e'
  if (block.includes('log') || block.includes('wood')) return '#785735'
  if (block.includes('ore')) return '#7c838f'
  if (block.includes('stone') || block.includes('deepslate') || block.includes('gravel')) return '#6b7280'
  if (block.includes('lava') || block.includes('magma')) return '#dc2626'
  return '#64748b'
}

function scaleHex(hex: string, factor: number) {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, Math.round(((value >> 16) & 255) * factor)))
  const g = Math.min(255, Math.max(0, Math.round(((value >> 8) & 255) * factor)))
  const b = Math.min(255, Math.max(0, Math.round((value & 255) * factor)))

  return `rgb(${r}, ${g}, ${b})`
}
</script>

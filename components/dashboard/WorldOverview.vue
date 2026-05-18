<template>
  <DashboardPanel title="World Overview" body-class="p-2">
    <template #header>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400">Day {{ summary.day }}, {{ summary.time }}</span>
        <UButton label="Open Map" to="/world" color="neutral" variant="soft" size="xs" />
      </div>
    </template>

    <div class="relative h-[270px] overflow-hidden rounded-md border border-slate-800 bg-emerald-950">
      <svg
        class="pixelated size-full"
        viewBox="0 0 720 270"
        role="img"
        aria-label="Placeholder pixelated world overview map"
      >
        <defs>
          <pattern id="forest-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#155e36" />
            <rect x="2" y="3" width="8" height="7" fill="#1f7a43" />
            <rect x="14" y="9" width="7" height="8" fill="#0f4c2d" />
            <rect x="8" y="17" width="8" height="5" fill="#237a4a" />
          </pattern>
          <pattern id="plains-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#487b36" />
            <rect x="4" y="4" width="6" height="5" fill="#5f9444" />
            <rect x="13" y="13" width="5" height="4" fill="#386a30" />
          </pattern>
        </defs>

        <rect width="720" height="270" fill="url(#forest-grid)" />
        <path d="M0 182 C80 150 135 191 210 160 C282 129 355 151 433 132 C536 108 610 119 720 75 L720 270 L0 270 Z" fill="url(#plains-grid)" opacity="0.92" />
        <path d="M520 0 C542 45 585 54 622 76 C660 99 664 144 720 159 L720 0 Z" fill="#1d6c88" />
        <path d="M24 214 C53 197 86 206 92 229 C79 253 38 252 15 239 Z" fill="#1d6c88" />
        <path d="M270 198 C296 185 324 191 337 211 C323 234 287 235 263 219 Z" fill="#1d6c88" />

        <g opacity="0.7">
          <rect x="442" y="166" width="116" height="12" fill="#5b4032" />
          <rect x="558" y="154" width="34" height="12" fill="#4d4b57" />
          <rect x="592" y="142" width="28" height="12" fill="#4d4b57" />
        </g>

        <path d="M222 181 L575 181 L601 158" fill="none" stroke="#d946ef" stroke-width="4" stroke-dasharray="8 5" />
        <path d="M127 144 L222 181 L330 126" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 5" opacity="0.9" />

        <g>
          <rect x="102" y="136" width="58" height="42" fill="#8b5e34" stroke="#d8b174" stroke-width="2" />
          <rect x="112" y="126" width="38" height="18" fill="#654321" stroke="#d8b174" stroke-width="2" />
          <rect x="122" y="154" width="14" height="24" fill="#3b2615" />
          <text x="131" y="193" text-anchor="middle" class="fill-slate-100 text-[12px] font-semibold">Workshop</text>
        </g>

        <g>
          <rect x="214" y="152" width="62" height="44" fill="#76512e" stroke="#d8b174" stroke-width="2" />
          <rect x="222" y="138" width="46" height="18" fill="#4f3420" stroke="#d8b174" stroke-width="2" />
          <text x="245" y="213" text-anchor="middle" class="fill-slate-100 text-[12px] font-semibold">Base Camp</text>
        </g>

        <g>
          <rect x="305" y="94" width="76" height="46" fill="#77746d" stroke="#d4d4d8" stroke-width="2" />
          <rect x="313" y="82" width="60" height="16" fill="#4b5563" stroke="#d4d4d8" stroke-width="2" />
          <text x="343" y="156" text-anchor="middle" class="fill-slate-100 text-[12px] font-semibold">Workshop</text>
        </g>

        <g>
          <rect x="164" y="80" width="66" height="44" fill="#7c5b35" stroke="#d8b174" stroke-width="2" />
          <rect x="173" y="66" width="48" height="18" fill="#5b422b" stroke="#d8b174" stroke-width="2" />
          <text x="197" y="58" text-anchor="middle" class="fill-slate-100 text-[12px] font-semibold">Storage</text>
        </g>

        <g>
          <rect x="570" y="127" width="42" height="32" fill="#64748b" stroke="#c4b5fd" stroke-width="2" />
          <rect x="581" y="113" width="20" height="16" fill="#475569" stroke="#c4b5fd" stroke-width="2" />
          <text x="597" y="104" text-anchor="middle" class="fill-slate-100 text-[12px] font-semibold">Tunnel Project</text>
          <text x="597" y="179" text-anchor="middle" class="fill-violet-200 text-[12px] font-semibold">Y 54</text>
        </g>

        <g>
          <circle cx="222" cy="181" r="10" fill="#0ea5e9" stroke="#dbeafe" stroke-width="3" />
          <circle cx="222" cy="181" r="3" fill="#082f49" />
        </g>

        <g>
          <circle cx="127" cy="144" r="8" fill="#facc15" stroke="#78350f" stroke-width="2" />
          <text x="127" y="148" text-anchor="middle" class="fill-slate-950 text-[9px] font-bold">!</text>
        </g>

        <g>
          <rect x="314" y="42" width="80" height="22" rx="4" fill="#0f172a" opacity="0.82" />
          <text x="354" y="57" text-anchor="middle" class="fill-slate-100 text-[12px] font-semibold">Forest</text>
        </g>
      </svg>

      <div class="absolute bottom-3 left-3 grid grid-cols-4 gap-2 text-xs">
        <div class="rounded-md bg-slate-950/80 px-2 py-1 text-slate-300">
          Survey {{ summary.surveyProgress }}%
        </div>
        <div class="rounded-md bg-slate-950/80 px-2 py-1 text-amber-300">
          {{ summary.hazards }} hazards
        </div>
        <div class="rounded-md bg-slate-950/80 px-2 py-1 text-cyan-300">
          {{ summary.landmarks }} landmarks
        </div>
        <div class="rounded-md bg-slate-950/80 px-2 py-1 text-emerald-300">
          {{ summary.walkablePercent }}% walkable
        </div>
      </div>
    </div>
  </DashboardPanel>
</template>

<script setup lang="ts">
import type { WorldSummary } from '~/types/dashboard'

defineProps<{
  summary: WorldSummary
}>()
</script>

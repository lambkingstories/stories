<template>
  <figure ref="root" class="viz-root" :class="{ 'is-stale': loading }">
    <figcaption class="viz-caption">
      Geöffnete Buchseiten pro Tag<span v-if="timezone" class="viz-caption-note"> · Tagesgrenze {{ timezone }}</span>
    </figcaption>

    <div v-if="!hasActivity" class="viz-empty">
      Noch keine Aktivität in diesem Zeitraum aufgezeichnet.
    </div>

    <div v-else class="viz-plot">
      <svg
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        tabindex="0"
        :aria-label="ariaLabel"
        @pointermove="onPointerMove"
        @pointerleave="active = null"
        @focus="onFocus"
        @blur="active = null"
        @keydown="onKeydown"
      >
        <!-- Gridlines: solid hairlines, one step off the surface. -->
        <g>
          <line
            v-for="t in yTicks"
            :key="`grid-${t}`"
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="yOf(t)"
            :y2="yOf(t)"
            :stroke="t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'"
            stroke-width="1"
            shape-rendering="crispEdges"
          />
          <text
            v-for="t in yTicks"
            :key="`ytick-${t}`"
            :x="PAD.left - 8"
            :y="yOf(t) + 4"
            class="viz-tick"
            text-anchor="end"
          >{{ t }}
          </text>
        </g>

        <!--
          Columns for short ranges, a line + area wash for long ones: 365
          daily columns would be 2px slivers, and the line reads the trend
          better at that density.
        -->
        <template v-if="asBars">
          <path
            v-for="p in points"
            :key="`bar-${p.day}`"
            :d="barPath(p)"
            :fill="active === p.index ? 'var(--viz-series-strong)' : 'var(--viz-series)'"
          />
        </template>
        <template v-else>
          <path :d="areaPath" fill="var(--viz-series)" fill-opacity="0.1" />
          <path
            :d="linePath"
            fill="none"
            stroke="var(--viz-series)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <!-- End marker, ringed in the surface colour so it stays legible
               where it crosses the line it terminates. -->
          <circle
            v-if="lastPoint"
            :cx="lastPoint.x"
            :cy="lastPoint.y"
            r="4"
            fill="var(--viz-series)"
            stroke="var(--viz-surface)"
            stroke-width="2"
          />
        </template>

        <!-- Crosshair + marker for the hovered / focused day. -->
        <g v-if="activePoint">
          <line
            :x1="activePoint.x"
            :x2="activePoint.x"
            :y1="PAD.top"
            :y2="yOf(0)"
            stroke="var(--viz-axis)"
            stroke-width="1"
            shape-rendering="crispEdges"
          />
          <circle
            v-if="!asBars"
            :cx="activePoint.x"
            :cy="activePoint.y"
            r="4"
            fill="var(--viz-series)"
            stroke="var(--viz-surface)"
            stroke-width="2"
          />
        </g>

        <!--
          Selective direct labels — the latest day and the peak, never a
          number on every point. The rest of the values live on the axis,
          in the tooltip, and in the table view below the chart.
        -->
        <text
          v-for="l in directLabels"
          :key="`label-${l.day}`"
          :x="l.x"
          :y="l.y - 12"
          class="viz-value"
          :text-anchor="l.anchor"
        >{{ l.views }}
        </text>

        <text
          v-for="t in xTicks"
          :key="`xtick-${t.day}`"
          :x="t.x"
          :y="height - 8"
          class="viz-tick"
          :text-anchor="t.anchor"
        >{{ t.label }}
        </text>
      </svg>

      <div v-if="activePoint" class="viz-tooltip" :style="tooltipStyle" role="status">
        <span class="viz-tooltip-value">{{ activePoint.views }}</span>
        <span class="viz-tooltip-label">Aufrufe · {{ longDate(activePoint.day) }}</span>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import type { UsageDayDTO } from '@/types'

const props = withDefaults(
  defineProps<{
    days: UsageDayDTO[]
    timezone?: string
    /** Hold the previous render at reduced opacity while refetching. */
    loading?: boolean
  }>(),
  { timezone: '', loading: false }
)

const PAD = { top: 22, right: 16, bottom: 26, left: 44 }
const height = 260
// Past ~a month, one column per day turns into slivers — switch to a line.
const BAR_LIMIT = 31

const root = ref<HTMLElement | null>(null)
const { width: measured } = useElementSize(root)
// The first paint happens before the ResizeObserver reports, so fall back
// to a sensible desktop width until it does.
const width = computed(() => Math.max(320, Math.round(measured.value || 720)))

const active = ref<number | null>(null)

const hasActivity = computed(() => props.days.some((d) => d.views > 0))
const asBars = computed(() => props.days.length <= BAR_LIMIT)

const plotW = computed(() => width.value - PAD.left - PAD.right)
const plotH = computed(() => height - PAD.top - PAD.bottom)

/** Round the axis top up to a clean number so ticks read 0 / 5 / 10 / 15. */
const yMax = computed(() => {
  const peak = props.days.reduce((m, d) => Math.max(m, d.views), 0)
  if (peak <= 4) return 4
  const rough = peak / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10
  return Math.ceil(peak / step) * step
})

const yTicks = computed(() => {
  const step = yMax.value / 4
  return [0, 1, 2, 3, 4].map((i) => Math.round(step * i))
})

function yOf(views: number): number {
  return PAD.top + plotH.value - (views / yMax.value) * plotH.value
}

const band = computed(() => plotW.value / Math.max(props.days.length, 1))

interface Point extends UsageDayDTO {
  index: number
  x: number
  y: number
}

const points = computed<Point[]>(() =>
  props.days.map((d, index) => ({
    ...d,
    index,
    // Columns sit centred in their band; the line's first / last point hugs
    // the plot edges so the series spans the full width.
    x: asBars.value
      ? PAD.left + band.value * (index + 0.5)
      : PAD.left + (plotW.value * index) / Math.max(props.days.length - 1, 1),
    y: yOf(d.views)
  }))
)

const activePoint = computed(() =>
  active.value === null ? null : (points.value[active.value] ?? null)
)

/** Rounded data-end, square at the baseline. */
function barPath(p: Point): string {
  // Cap the column and leave the band's remainder as air — the 2px the gap
  // takes is what separates neighbouring columns, not a stroke.
  const w = Math.min(24, Math.max(2, band.value - 2))
  const x = p.x - w / 2
  const baseline = yOf(0)
  const h = baseline - p.y
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  const top = baseline - h
  return [
    `M${x} ${baseline}`,
    `L${x} ${top + r}`,
    `Q${x} ${top} ${x + r} ${top}`,
    `L${x + w - r} ${top}`,
    `Q${x + w} ${top} ${x + w} ${top + r}`,
    `L${x + w} ${baseline}`,
    'Z'
  ].join(' ')
}

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
)

const areaPath = computed(() => {
  if (!points.value.length) return ''
  const baseline = yOf(0)
  const first = points.value[0]!
  const last = points.value[points.value.length - 1]!
  return `${linePath.value} L${last.x} ${baseline} L${first.x} ${baseline} Z`
})

const lastPoint = computed(() => points.value[points.value.length - 1] ?? null)

const directLabels = computed<Array<Point & { anchor: 'start' | 'middle' | 'end' }>>(() => {
  const last = lastPoint.value
  if (!last) return []
  const peak = points.value.reduce((best, p) => (p.views > best.views ? p : best), points.value[0]!)
  const chosen = last.views > 0 ? [last] : []
  // Only label the peak when it sits far enough from the last day's label
  // that the two can't collide.
  if (peak.views > 0 && Math.abs(peak.x - last.x) > 28) chosen.unshift(peak)
  // Anchor the labels near either edge inwards — centred text on the last
  // point would hang past the plot and get clipped by the card.
  return chosen.map((p) => ({
    ...p,
    anchor: p.x > width.value - PAD.right - 14 ? 'end' : p.x < PAD.left + 14 ? 'start' : 'middle'
  }))
})

const dayFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })
const monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit' })
const longFormat = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

function parseDay(day: string): Date {
  // Local midnight — a bare `YYYY-MM-DD` parses as UTC, which would shift
  // the printed label by a day for viewers west of Greenwich.
  return new Date(`${day}T00:00:00`)
}

function longDate(day: string): string {
  return longFormat.format(parseDay(day))
}

const xTicks = computed(() => {
  const n = points.value.length
  if (!n) return []
  const wanted = Math.max(2, Math.min(6, Math.floor(plotW.value / 90)))
  const stride = Math.max(1, Math.round((n - 1) / Math.max(wanted - 1, 1)))
  const fmt = n > 120 ? monthFormat : dayFormat
  const idx = new Set<number>()
  for (let i = 0; i < n; i += stride) idx.add(i)
  idx.add(n - 1)
  return [...idx]
    .sort((a, b) => a - b)
    .map((i) => {
      const p = points.value[i]!
      const anchor: 'start' | 'middle' | 'end' = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
      return { day: p.day, x: p.x, label: fmt.format(parseDay(p.day)), anchor }
    })
})

const tooltipStyle = computed(() => {
  const p = activePoint.value
  if (!p) return {}
  // Flip to the pointer's left once past the middle so the card's edge
  // never clips the readout.
  const onRight = p.x > PAD.left + plotW.value / 2
  return {
    left: `${p.x}px`,
    top: `${Math.max(PAD.top, p.y - 12)}px`,
    transform: onRight ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)'
  }
})

const ariaLabel = computed(() => {
  const total = props.days.reduce((sum, d) => sum + d.views, 0)
  return `Diagramm der geöffneten Buchseiten über ${props.days.length} Tage, zusammen ${total} Aufrufe. Die Tabellenansicht unter dem Diagramm enthält alle Einzelwerte.`
})

function indexFromX(clientX: number, target: SVGSVGElement): number {
  const rect = target.getBoundingClientRect()
  const x = clientX - rect.left - PAD.left
  const n = points.value.length
  // Nearest-band lookup: the reader aims at a date, never at a 2px mark.
  const i = asBars.value ? Math.floor(x / band.value) : Math.round((x / plotW.value) * (n - 1))
  return Math.min(Math.max(i, 0), n - 1)
}

function onPointerMove(event: PointerEvent) {
  if (!points.value.length) return
  active.value = indexFromX(event.clientX, event.currentTarget as SVGSVGElement)
}

function onFocus() {
  // Keyboard users land on the most recent day and walk backwards.
  if (active.value === null && points.value.length) active.value = points.value.length - 1
}

function onKeydown(event: KeyboardEvent) {
  const n = points.value.length
  if (!n) return
  const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
  if (!step) return
  event.preventDefault()
  active.value = Math.min(Math.max((active.value ?? n - 1) + step, 0), n - 1)
}
</script>

<style scoped>
/* Chart tokens. The admin UI is light-only, so there is a single palette —
 * the series blue is validated against this card surface (inside the
 * lightness band, above the chroma floor, >= 3:1 contrast). */
.viz-root {
  --viz-surface: #f7fbfe;
  --viz-series: #2a78d6;
  --viz-series-strong: #256abf;
  --viz-grid: #e1e0d9;
  --viz-axis: #c3c2b7;
  --viz-ink: #2a1f10;
  --viz-muted: #898781;

  margin: 0;
  transition: opacity 160ms ease;
}

/* Refetch keeps the frame — hold the previous render instead of flashing a
 * skeleton and jumping the layout. */
.viz-root.is-stale {
  opacity: 0.55;
}

.viz-caption {
  font-size: 12px;
  font-weight: 700;
  color: var(--viz-ink);
  margin-bottom: 6px;
}

.viz-caption-note {
  font-weight: 500;
  color: var(--viz-muted);
}

.viz-plot {
  position: relative;
}

.viz-plot svg {
  display: block;
  outline: none;
  touch-action: pan-y;
}

.viz-plot svg:focus-visible {
  outline: 2px solid rgba(42, 120, 214, 0.6);
  outline-offset: 2px;
  border-radius: 8px;
}

.viz-tick {
  font-size: 11px;
  fill: var(--viz-muted);
  font-variant-numeric: tabular-nums;
}

.viz-value {
  font-size: 12px;
  font-weight: 700;
  fill: var(--viz-ink);
}

.viz-tooltip {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 11px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(200, 160, 110, 0.35);
  box-shadow: 0 10px 26px -14px rgba(20, 60, 100, 0.5);
  white-space: nowrap;
}

.viz-tooltip-value {
  font-size: 15px;
  font-weight: 800;
  color: var(--viz-ink);
  line-height: 1.1;
}

.viz-tooltip-label {
  font-size: 11px;
  color: var(--viz-muted);
}

.viz-empty {
  padding: 48px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--viz-muted);
}
</style>

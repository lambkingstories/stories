<template>
  <div class="usage-view">
    <!-- One filter row above everything it scopes: the chart, the tiles and
         the table all re-render against the same slice. -->
    <div class="usage-filters" role="group" aria-label="Zeitraum">
      <button
        v-for="opt in RANGES"
        :key="opt.value"
        type="button"
        class="range-chip"
        :class="{ 'is-active': range === opt.value }"
        :aria-pressed="range === opt.value"
        @click="select(opt.value)"
      >{{ opt.label }}
      </button>

      <span v-if="report" class="usage-updated">
        Stand: {{ formatDay(report.to) }}
      </span>
    </div>

    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">App-Nutzung</h2>
          <p class="panel-subtitle">
            Gezählt wird, wie oft eine Buchseite geöffnet wurde — ein Zähler pro Tag, sonst
            nichts. Keine Gerätekennung, keine Konten, keine Drittanbieter-Analytics.
          </p>
        </div>
      </header>

      <p v-if="error" class="usage-error" role="alert">{{ error }}</p>

      <div class="stat-row">
        <div class="stat-tile">
          <span class="stat-label">Heute</span>
          <span class="stat-value is-hero">{{ report?.totals.viewsToday ?? '–' }}</span>
        </div>
        <div class="stat-tile">
          <span class="stat-label">Im Zeitraum</span>
          <span class="stat-value">{{ report?.totals.viewsInRange ?? '–' }}</span>
        </div>
        <div class="stat-tile">
          <span class="stat-label">Ø pro Tag</span>
          <span class="stat-value">{{ report ? formatAverage(report.totals.averagePerDay) : '–' }}</span>
        </div>
        <div class="stat-tile">
          <span class="stat-label">Spitzentag</span>
          <span class="stat-value">{{ report?.totals.peak?.views ?? '–' }}</span>
          <span v-if="report?.totals.peak" class="stat-note">{{ formatDay(report.totals.peak.day) }}</span>
        </div>
        <div class="stat-tile">
          <span class="stat-label">Aufrufe insgesamt</span>
          <span class="stat-value">{{ report?.totals.viewsAllTime ?? '–' }}</span>
          <span v-if="report?.totals.firstDay" class="stat-note">seit {{ formatDay(report.totals.firstDay) }}</span>
        </div>
      </div>

      <UsageChart
        v-if="report"
        :days="report.days"
        :timezone="report.timezone"
        :loading="loading"
      />
      <div v-else-if="loading" class="usage-placeholder">Lade Nutzungsdaten …</div>

      <!-- Table twin: every value the chart draws is readable without
           hovering, and it is the WCAG-clean fallback. -->
      <div v-if="report" class="usage-table-wrap">
        <button type="button" class="table-toggle" @click="showTable = !showTable">
          {{ showTable ? 'Tabelle ausblenden' : 'Tabelle anzeigen' }}
        </button>
        <div v-if="showTable" class="usage-table-scroll">
          <table class="usage-table">
            <caption class="sr-only">Geöffnete Buchseiten je Tag</caption>
            <thead>
            <tr>
              <th scope="col">Tag</th>
              <th scope="col" class="is-num">Aufrufe</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="d in tableRows" :key="d.day">
              <td>{{ formatDay(d.day) }}</td>
              <td class="is-num">{{ d.views }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import UsageChart from '@/components/organisms/UsageChart.vue'
import { usageApi } from '@/api/usage'
import type { UsageRange, UsageReportDTO } from '@/types'

const RANGES: ReadonlyArray<{ value: UsageRange; label: string }> = [
  { value: '7', label: '7 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
  { value: '365', label: '365 Tage' },
  { value: 'all', label: 'Gesamt' }
]

const range = ref<UsageRange>('30')
const report = ref<UsageReportDTO | null>(null)
const loading = ref(false)
const error = ref('')
const showTable = ref(false)

// Newest first — the admin opens the table to check the last few days, not
// to scroll a year back to today.
const tableRows = computed(() => (report.value ? [...report.value.days].reverse() : []))

const dayFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

function formatDay(day: string): string {
  return dayFormat.format(new Date(`${day}T00:00:00`))
}

function formatAverage(value: number): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    // The previous report stays on screen while this resolves — the chart
    // dims instead of collapsing to a skeleton.
    report.value = await usageApi.daily(range.value)
  } catch (err) {
    error.value = `Nutzungsdaten konnten nicht geladen werden: ${(err as Error).message}`
  } finally {
    loading.value = false
  }
}

function select(value: UsageRange) {
  if (range.value === value) return
  range.value = value
  void load()
}

onMounted(load)
</script>

<style scoped>
.usage-view {
  max-width: 1100px;
  margin: 0 auto;
}

.usage-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.range-chip {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #2a2a2a;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 6px 18px -14px rgba(20, 60, 100, 0.5);
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.range-chip:hover {
  background: rgba(255, 255, 255, 0.92);
}

.range-chip.is-active {
  background: linear-gradient(135deg, #2471a3 0%, #3498db 100%);
  border-color: rgba(36, 113, 163, 0.6);
  color: #fff;
}

.usage-updated {
  margin-left: auto;
  font-size: 12px;
  color: #8a6a3c;
}

.usage-error {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: #7f1d1d;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.25);
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 22px;
}

.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.75);
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8a6a3c;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  color: #2a1f10;
}

/* The one number the dashboard leads with. */
.stat-value.is-hero {
  font-size: 48px;
  letter-spacing: -0.02em;
}

.stat-note {
  font-size: 11px;
  color: #898781;
}

.usage-placeholder {
  padding: 48px 12px;
  text-align: center;
  font-size: 13px;
  color: #898781;
}

.usage-table-wrap {
  margin-top: 18px;
}

.table-toggle {
  font-size: 12px;
  font-weight: 700;
  color: #2471a3;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.usage-table-scroll {
  margin-top: 10px;
  max-height: 320px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(200, 160, 110, 0.25);
}

.usage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.usage-table th,
.usage-table td {
  padding: 7px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(200, 160, 110, 0.18);
}

.usage-table thead th {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8a6a3c;
}

.usage-table .is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

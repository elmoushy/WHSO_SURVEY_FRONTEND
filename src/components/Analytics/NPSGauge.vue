<template>
  <div :class="[$style.npsGauge, { [$style.compact]: compact }]" :data-theme="currentTheme">
    <!-- Loading / Empty -->
    <div v-if="loading" :class="$style.state">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.stateText">{{ isRTL ? 'جاري التحميل...' : 'Loading…' }}</p>
    </div>
    <div v-else-if="!hasData" :class="$style.state">
      <div :class="$style.emptyIcon"><i class="fas fa-tachometer-alt"></i></div>
      <p :class="$style.stateText">{{ isRTL ? 'لا توجد بيانات NPS' : 'No NPS data' }}</p>
    </div>

    <!-- Content -->
    <div v-else :class="$style.split">
          <!-- Right: Gauge -->
      <section :class="$style.right">
        <header :class="$style.panelHeader">
          <h3 :class="$style.panelTitle">{{ isRTL ? 'المؤشر الحالي' : 'Current score' }}</h3>
        </header>

        <div :class="$style.gaugeWrap">
          <!-- Semi-circle gauge (0..100 mapped from -100..100 visually) -->
          <svg :width="size" :height="size/2" :viewBox="`0 0 ${size} ${size/2}`" role="img" :aria-label="`NPS ${Math.round(npsScore)}`">
            <!-- Background arc -->
            <path :d="arcPath(0, 100)" :class="$style.bgArc" />
            <!-- Detractors arc -->
            <path :d="arcPath(0, detractorsPctNum)" :style="{ stroke: colors.detractors }" :class="$style.arc"/>
            <!-- Passives arc (stacked) -->
            <path :d="arcPath(detractorsPctNum, detractorsPctNum + passivesPctNum)" :style="{ stroke: colors.passives }" :class="$style.arc"/>
            <!-- Promoters arc (stacked) -->
            <path :d="arcPath(detractorsPctNum + passivesPctNum, 100)" :style="{ stroke: colors.promoters }" :class="$style.arc"/>
            
            <!-- Arc labels -->
            <text v-if="detractorsPctNum > 5" :x="getLabelPosition(0, detractorsPctNum).x" :y="getLabelPosition(0, detractorsPctNum).y" :class="$style.arcLabel" :fill="colors.detractors">{{ detractorsPct }}%</text>
            <text v-if="passivesPctNum > 5" :x="getLabelPosition(detractorsPctNum, detractorsPctNum + passivesPctNum).x" :y="getLabelPosition(detractorsPctNum, detractorsPctNum + passivesPctNum).y" :class="$style.arcLabel" :fill="colors.passives">{{ passivesPct }}%</text>
            <text v-if="promotersPctNum > 5" :x="getLabelPosition(detractorsPctNum + passivesPctNum, 100).x" :y="getLabelPosition(detractorsPctNum + passivesPctNum, 100).y" :class="$style.arcLabel" :fill="colors.promoters">{{ promotersPct }}%</text>
          </svg>

          <div :class="$style.scoreBlock" :style="{ color: gaugeColor }">
            <div :class="$style.scoreNum">{{ Math.round(npsScore) }}</div>
            <div :class="$style.scoreSub">{{ isRTL ? 'درجة NPS' : 'NPS score' }}</div>
            <div :class="$style.scoreTotal">{{ props.npsData?.total_responses || 0 }} {{ isRTL ? 'استجابة' : 'responses' }}</div>
          </div>
        </div>

        <!-- Legend -->
        <ul :class="$style.legend">
          <li><span :class="$style.dot" :style="{ backgroundColor: colors.promoters }"></span>{{ isRTL ? '(9-10) المروجون' : 'Promoters (9–10)' }}</li>
          <li><span :class="$style.dot" :style="{ backgroundColor: colors.passives }"></span>{{ isRTL ? '(7-8) المحايدون' : 'Passives (7–8)' }}</li>
          <li><span :class="$style.dot" :style="{ backgroundColor: colors.detractors }"></span>{{ isRTL ? '(0-6) المنتقدون' : 'Detractors (0–6)' }}</li>
        </ul>
      </section>
      <!-- Left: Breakdown -->
      <section :class="$style.left">
        <header :class="$style.panelHeader">
          <h3 :class="$style.panelTitle">{{ isRTL ? 'توزيع الفئات' : 'Category breakdown' }}</h3>
        </header>

        <!-- Promoters -->
        <div :class="$style.row">
          <div :class="$style.meta">
            <span :class="$style.metaPct">{{ promotersPct }}%</span>
            <span :class="$style.metaCount">{{ promotersCount }}</span>
          </div>
          <div :class="$style.track" aria-hidden="true">
            <div :class="$style.fill" :style="{ width: promotersPct + '%', backgroundColor: colors.promoters }">
              <span :class="$style.inBar">{{ promotersPct }}%</span>
            </div>
          </div>
          <div :class="$style.labelWrap">
            <span :class="$style.dot" :style="{ backgroundColor: colors.promoters }"></span>
            <span :class="$style.label">{{ promoterLabel }}</span>
          </div>
        </div>

        <!-- Passives -->
        <div :class="$style.row">
          <div :class="$style.meta">
            <span :class="$style.metaPct">{{ passivesPct }}%</span>
            <span :class="$style.metaCount">{{ passivesCount }}</span>
          </div>
          <div :class="$style.track" aria-hidden="true">
            <div :class="$style.fill" :style="{ width: passivesPct + '%', backgroundColor: colors.passives }">
              <span :class="$style.inBar">{{ passivesPct }}%</span>
            </div>
          </div>
          <div :class="$style.labelWrap">
            <span :class="$style.dot" :style="{ backgroundColor: colors.passives }"></span>
            <span :class="$style.label">{{ passiveLabel }}</span>
          </div>
        </div>

        <!-- Detractors -->
        <div :class="$style.row">
          <div :class="$style.meta">
            <span :class="$style.metaPct">{{ detractorsPct }}%</span>
            <span :class="$style.metaCount">{{ detractorsCount }}</span>
          </div>
          <div :class="$style.track" aria-hidden="true">
            <div :class="$style.fill" :style="{ width: detractorsPct + '%', backgroundColor: colors.detractors }">
              <span :class="$style.inBar">{{ detractorsPct }}%</span>
            </div>
          </div>
          <div :class="$style.labelWrap">
            <span :class="$style.dot" :style="{ backgroundColor: colors.detractors }"></span>
            <span :class="$style.label">{{ detractorLabel }}</span>
          </div>
        </div>
      </section>

  
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

interface Props {
  npsData: {
    score: number
    promoters_count: number
    passives_count: number
    detractors_count: number
    promoters_pct: number
    passives_pct: number
    detractors_pct: number
    total_responses: number
    interpretation?: string
    question_id?: string
    question_text?: string
    scale_min?: number
    scale_max?: number
    detractor_range?: string
    passive_range?: string
    promoter_range?: string
    distribution?: Array<{ score: number; count: number; pct?: number; percentage?: number }>
  } | null
  loading?: boolean
  compact?: boolean
  size?: number
}
const props = withDefaults(defineProps<Props>(), { loading: false, compact: false, size: 320 })

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

const hasData = computed(() => !!props.npsData && props.npsData.total_responses > 0)
const npsScore = computed(() => props.npsData?.score ?? 0)
const promotersCount = computed(() => props.npsData?.promoters_count ?? 0)
const passivesCount = computed(() => props.npsData?.passives_count ?? 0)
const detractorsCount = computed(() => props.npsData?.detractors_count ?? 0)
const promotersPct = computed(() => (props.npsData?.promoters_pct ?? 0).toFixed(0))
const passivesPct = computed(() => (props.npsData?.passives_pct ?? 0).toFixed(0))
const detractorsPct = computed(() => (props.npsData?.detractors_pct ?? 0).toFixed(0))
const promotersPctNum = computed(() => Number(promotersPct.value))
const passivesPctNum = computed(() => Number(passivesPct.value))
const detractorsPctNum = computed(() => Number(detractorsPct.value))

const promoterLabel = computed(() => {
  const r = props.npsData?.promoter_range || '9-10'
  return isRTL.value ? `المروجون (${r})` : `Promoters (${r})`
})
const passiveLabel = computed(() => {
  const r = props.npsData?.passive_range || '7-8'
  return isRTL.value ? `المحايدون (${r})` : `Passives (${r})`
})
const detractorLabel = computed(() => {
  const r = props.npsData?.detractor_range || '0-6'
  return isRTL.value ? `المنتقدون (${r})` : `Detractors (${r})`
})

const colors = computed(() => {
  if (currentTheme.value === 'night') {
    return {
      promoters: '#4ade80',
      passives: '#facc15',
      detractors: '#f87171'
    }
  }
  return {
    promoters: '#4CAF50',
    passives: '#FFC107',
    detractors: '#D24A3D'
  }
})

const gaugeColor = computed(() => {
  const palette = colors.value
  const s = npsScore.value
  if (s >= 50) return palette.promoters
  if (s >= 30) return currentTheme.value === 'night' ? '#6ee7b7' : '#8BC34A'
  if (s >= 10) return palette.passives
  if (s >= -10) return currentTheme.value === 'night' ? '#fbbf24' : '#FF9800'
  return palette.detractors
})

/**
 * Build an SVG semicircle arc path from a percentage range [start,end] on 0..100.
 * Angle spans 180° (π rad). Stroke width is handled in CSS.
 */
function arcPath(startPct: number, endPct: number): string {
  const w = props.size
  const h = props.size / 2
  const r = Math.min(w, props.size) / 2 - 8
  const startAngle = Math.PI * (1 - startPct / 100)
  const endAngle = Math.PI * (1 - endPct / 100)

  const sx = w / 2 + r * Math.cos(startAngle)
  const sy = h + r * Math.sin(startAngle)
  const ex = w / 2 + r * Math.cos(endAngle)
  const ey = h + r * Math.sin(endAngle)
  const large = Math.abs(endPct - startPct) > 50 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 0 ${ex} ${ey}`
}

/**
 * Calculate the position for a label at the midpoint of an arc segment
 */
function getLabelPosition(startPct: number, endPct: number): { x: number; y: number } {
  const w = props.size
  const h = props.size / 2
  const r = Math.min(w, props.size) / 2 - 8
  const midPct = (startPct + endPct) / 2
  const midAngle = Math.PI * (1 - midPct / 100)
  
  // Position label slightly outside the arc
  const labelR = r + 20
  const x = w / 2 + labelR * Math.cos(midAngle)
  const y = h + labelR * Math.sin(midAngle)
  
  return { x, y }
}
</script>
<style module>
.npsGauge {
  --panel-bg: #ffffff;
  --panel-border: #e5e7eb;
  --panel-muted: #f3f4f6;
  --track-bg: #f3f4f6;
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --arc-bg: #e5e7eb;
  --legend-chip: rgba(17, 24, 39, 0.06);
  --legend-border: rgba(17, 24, 39, 0.08);
  --shadow-soft: 0 18px 35px rgba(15, 23, 42, 0.12);

  width: 100%;
  height: 100%;
  padding: 24px;
  color: var(--text-secondary);
  background: transparent;
}

.npsGauge.compact {
  padding: 16px;
}

.npsGauge[data-theme="night"] {
  /* --panel-bg: #111827; */
  --panel-border: rgba(37, 34, 34, 0.9);
    --panel-bg: rgba(37, 34, 34, 0.9);

  --panel-muted: #1f2937;
  --track-bg: #1f2937;
  --text-primary: #f8fafc;
  --text-secondary: #e2e8f0;
  --text-muted: #94a3b8;
  --arc-bg: #1f2937;
  --legend-chip: rgba(148, 163, 184, 0.12);
  --legend-border: rgba(148, 163, 184, 0.22);
  --shadow-soft: 0 24px 48px rgba(0, 0, 0, 0.45);
}

.state {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--panel-border);
  border-top: 3px solid var(--arc-bg);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stateText {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0;
}

.emptyIcon {
  font-size: 42px;
  color: var(--text-muted);
  opacity: 0.5;
}

.split {
  display: flex;
  gap: 24px;
}

.panelHeader {
  margin-bottom: 8px;
}

.panelTitle {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 700;
}

.left,
.right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--panel-bg);
}

.row {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  align-items: center;
  gap: 12px;
}

.meta {
  display: flex;
  gap: 8px;
  white-space: nowrap;
  color: var(--text-secondary);
}

.metaPct {
  font-weight: 700;
  color: var(--text-primary);
}

.metaCount {
  color: var(--text-muted);
}

.track {
  height: 36px;
  background: var(--track-bg);
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

.fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-inline: 10px;
  font-weight: 700;
  color: #fff;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.inBar {
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.labelWrap {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.label {
  color: var(--text-primary);
  font-size: 14px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px var(--panel-bg);
}

.gaugeWrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 8px 0;
}

.bgArc {
  fill: none;
  stroke: var(--arc-bg);
  stroke-width: 16;
  stroke-linecap: round;
}

.arc {
  fill: none;
  stroke-width: 16;
  stroke-linecap: round;
}

.arcLabel {
  font-size: 13px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
}

.scoreBlock {
  position: absolute;
  inset: auto 0 18% 0;
  margin: auto;
  text-align: center;
  color: var(--text-primary);
}

.scoreNum {
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
}

.scoreSub,
.scoreTotal {
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 4px;
}

.scoreTotal {
  font-size: 11px;
  opacity: 0.8;
}

.legend {
  display: flex;
  gap: 24px;
  list-style: none;
  padding: 8px 8px 0;
  margin: 0;
  color: var(--text-primary);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  background: transparent;
}

:global([dir='rtl']) .row {
  grid-template-columns: auto 1fr 96px;
}

:global([dir='rtl']) .fill {
  justify-content: flex-start;
}

:global([dir='rtl']) .inBar {
  margin-inline-start: 10px;
}

@media (max-width: 1024px) {
  .split {
    flex-direction: column;
  }

  .left,
  .right {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .legend {
    gap: 16px;
    flex-wrap: wrap;
  }
}
</style>

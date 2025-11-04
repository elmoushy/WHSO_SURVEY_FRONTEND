<template>
  <div :class="[$style.csatTrackingContainer, { [$style.compact]: compact }]" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div v-if="loading" :class="$style.loadingState">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ isRTL ? 'جاري التحميل...' : 'Loading...' }}</span>
    </div>

    <div v-else-if="isEmpty" :class="$style.emptyState">
      <i class="fas fa-chart-line"></i>
      <p>{{ isRTL ? 'لم يتم العثور على سؤال CSAT' : 'No CSAT question found' }}</p>
    </div>

    <div v-else :class="$style.chartContent">
      <!-- Current Score Card (for single data point) -->
      <div v-if="isSingleDataPoint" :class="$style.singlePointView">
        <div :class="$style.currentScoreCard">
          <!-- <div :class="$style.scoreHeader">
          
          </div>
           -->
          <div :class="$style.scoreDisplay">
              <div :class="$style.scoreIcon">
              <i :class="getScoreIconClass(latestScore)" :style="{ color: getScoreColor(latestScore) }"></i>
            </div>
            <div :class="$style.scoreInfo">
              <div :class="$style.scoreTitle">{{ isRTL ? 'درجة رضا العملاء' : 'Customer Satisfaction Score' }}</div>
              <div :class="$style.scorePeriod">{{ formatPeriodLabel(csatData[0].period) }}</div>
            </div>
            <div :class="$style.scoreBreakdown">
              <div :class="$style.breakdownItem" style="--item-color: #4CAF50">
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="#00A350"/>
</svg>

                <span>{{ csatData[0].satisfied }} {{ isRTL ? 'راضٍ' : 'Satisfied' }}</span>
              </div>
              <div :class="$style.breakdownItem" style="--item-color: #FFC107">
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="#FFC043"/>
</svg>

                <span>{{ csatData[0].neutral }} {{ isRTL ? 'محايد' : 'Neutral' }}</span>
              </div>
              <div :class="$style.breakdownItem" style="--item-color: #F44336">
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z" fill="#D44333"/>
</svg>

                <span>{{ csatData[0].dissatisfied }} {{ isRTL ? 'غير راضٍ' : 'Dissatisfied' }}</span>
              </div>
            </div>
          </div>

          <!-- Visual Bar -->
          <div :class="$style.satisfactionBar">
            <div 
              :class="$style.satisfactionSegment" 
              :style="{ width: `${getPercentage(csatData[0].satisfied, csatData[0].total)}%`, background: '#4CAF50' }"
              :title="`${isRTL ? 'راضٍ' : 'Satisfied'}: ${csatData[0].satisfied} (${getPercentage(csatData[0].satisfied, csatData[0].total).toFixed(1)}%)`"
            ></div>
            <div 
              :class="$style.satisfactionSegment" 
              :style="{ width: `${getPercentage(csatData[0].neutral, csatData[0].total)}%`, background: '#FFC107' }"
              :title="`${isRTL ? 'محايد' : 'Neutral'}: ${csatData[0].neutral} (${getPercentage(csatData[0].neutral, csatData[0].total).toFixed(1)}%)`"
            ></div>
            <div 
              :class="$style.satisfactionSegment" 
              :style="{ width: `${getPercentage(csatData[0].dissatisfied, csatData[0].total)}%`, background: '#F44336' }"
              :title="`${isRTL ? 'غير راضٍ' : 'Dissatisfied'}: ${csatData[0].dissatisfied} (${getPercentage(csatData[0].dissatisfied, csatData[0].total).toFixed(1)}%)`"
            ></div>
          </div>
<!--           
          <div :class="$style.totalResponsesInfo">
            {{ isRTL ? 'إجمالي الردود:' : 'Total Responses:' }} <strong>{{ csatData[0].total }}</strong>
          </div> -->
        </div>
      </div>

      <!-- Multi-point trend view (existing chart) -->
      <div v-else>
      <!-- Summary Stats -->
      <div :class="$style.summaryStats">
        <div :class="$style.statCard">
          <div :class="$style.statValue">{{ latestScore }}%</div>
          <div :class="$style.statLabel">{{ isRTL ? 'أحدث درجة' : 'Latest Score' }}</div>
        </div>
        <div :class="$style.statCard">
          <div :class="$style.statValue">{{ averageScore }}%</div>
          <div :class="$style.statLabel">{{ isRTL ? 'المتوسط' : 'Average' }}</div>
        </div>
        <div :class="$style.statCard">
          <div :class="$style.statValue">{{ totalResponses }}</div>
          <div :class="$style.statLabel">{{ isRTL ? 'إجمالي الردود' : 'Total Responses' }}</div>
        </div>
      </div>

      <!-- Line Chart -->
      <div :class="$style.chartContainer">
        <svg :class="$style.chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`">
          <!-- Grid Lines -->
          <g :class="$style.gridLines">
            <line
              v-for="i in 5"
              :key="`grid-${i}`"
              :x1="padding.left"
              :y1="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * (i - 1)"
              :x2="chartWidth - padding.right"
              :y2="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * (i - 1)"
              :class="$style.gridLine"
            />
          </g>

          <!-- Y-axis labels -->
          <g :class="$style.yAxisLabels">
            <text
              v-for="i in 5"
              :key="`y-label-${i}`"
              :x="padding.left - 10"
              :y="padding.top + ((chartHeight - padding.top - padding.bottom) / 4) * (i - 1) + 5"
              :class="$style.axisLabel"
              text-anchor="end"
            >
              {{ 100 - (i - 1) * 25 }}%
            </text>
          </g>

          <!-- Line Path -->
          <path
            :d="linePath"
            :class="$style.linePath"
            fill="none"
            stroke="#B78A41"
            stroke-width="3"
            stroke-linecap="round"
          />

          <!-- Area Fill -->
          <path
            :d="areaPath"
            :class="$style.areaPath"
            fill="url(#gradient)"
            opacity="0.2"
          />

          <!-- Gradient Definition -->
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#B78A41" stop-opacity="0.8" />
              <stop offset="100%" stop-color="#B78A41" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Data Points -->
          <g :class="$style.dataPoints">
            <circle
              v-for="(point, index) in chartPoints"
              :key="`point-${index}`"
              :cx="point.x"
              :cy="point.y"
              r="5"
              :class="$style.dataPoint"
              @mouseenter="showTooltip(index, $event)"
              @mouseleave="hideTooltip"
            />
          </g>

          <!-- X-axis labels -->
          <g :class="$style.xAxisLabels">
            <text
              v-for="(point, index) in chartPoints"
              :key="`x-label-${index}`"
              :x="point.x"
              :y="chartHeight - padding.bottom + 20"
              :class="$style.axisLabel"
              text-anchor="middle"
            >
              {{ formatPeriodLabel(csatData[index].period) }}
            </text>
          </g>
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltip.visible"
          :class="$style.tooltip"
          :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        >
          <div :class="$style.tooltipPeriod">{{ tooltip.period }}</div>
          <div :class="$style.tooltipScore">{{ isRTL ? 'الدرجة:' : 'Score:' }} {{ tooltip.score }}%</div>
          <div :class="$style.tooltipBreakdown">
            <div :class="$style.tooltipItem">
              <span :class="$style.tooltipDot" style="background: #4CAF50;"></span>
              {{ isRTL ? 'راضٍ:' : 'Satisfied:' }} {{ tooltip.satisfied }}
            </div>
            <div :class="$style.tooltipItem">
              <span :class="$style.tooltipDot" style="background: #FFC107;"></span>
              {{ isRTL ? 'محايد:' : 'Neutral:' }} {{ tooltip.neutral }}
            </div>
            <div :class="$style.tooltipItem">
              <span :class="$style.tooltipDot" style="background: #F44336;"></span>
              {{ isRTL ? 'غير راضٍ:' : 'Dissatisfied:' }} {{ tooltip.dissatisfied }}
            </div>
          </div>
        </div>
      </div>

      <!-- Stacked Bar Chart (Optional Detailed View) -->
      <div :class="$style.stackedBarContainer">
        <div
          v-for="(item, index) in csatData"
          :key="`bar-${index}`"
          :class="$style.barGroup"
        >
          <div :class="$style.stackedBar">
            <div
              :class="$style.barSegment"
              :style="{ width: `${getPercentage(item.satisfied, item.total)}%`, background: '#4CAF50' }"
              :title="`${isRTL ? 'راضٍ' : 'Satisfied'}: ${item.satisfied}`"
            ></div>
            <div
              :class="$style.barSegment"
              :style="{ width: `${getPercentage(item.neutral, item.total)}%`, background: '#FFC107' }"
              :title="`${isRTL ? 'محايد' : 'Neutral'}: ${item.neutral}`"
            ></div>
            <div
              :class="$style.barSegment"
              :style="{ width: `${getPercentage(item.dissatisfied, item.total)}%`, background: '#F44336' }"
              :title="`${isRTL ? 'غير راضٍ' : 'Dissatisfied'}: ${item.dissatisfied}`"
            ></div>
          </div>
          <div :class="$style.barLabel">{{ formatPeriodLabel(item.period) }}</div>
        </div>
      </div>

      <!-- Legend -->
      <div :class="$style.legend">
        <div :class="$style.legendItem">
          <span :class="$style.legendDot" style="background: #4CAF50;"></span>
          <span>{{ isRTL ? 'راضٍ' : 'Satisfied' }}</span>
        </div>
        <div :class="$style.legendItem">
          <span :class="$style.legendDot" style="background: #FFC107;"></span>
          <span>{{ isRTL ? 'محايد' : 'Neutral' }}</span>
        </div>
        <div :class="$style.legendItem">
          <span :class="$style.legendDot" style="background: #F44336;"></span>
          <span>{{ isRTL ? 'غير راضٍ' : 'Dissatisfied' }}</span>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { CSATTrackingPoint } from '../../types/survey.types'

interface Props {
  csatData: CSATTrackingPoint[]
  loading?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

const isEmpty = computed(() => props.csatData.length === 0)

const isSingleDataPoint = computed(() => props.csatData.length === 1)

const chartWidth = 800
const chartHeight = 400
const padding = { top: 20, right: 20, bottom: 60, left: 60 }

const latestScore = computed(() => {
  if (props.csatData.length === 0) return 0
  return Math.round(props.csatData[props.csatData.length - 1].score)
})

const averageScore = computed(() => {
  if (props.csatData.length === 0) return 0
  const sum = props.csatData.reduce((acc, item) => acc + item.score, 0)
  return Math.round(sum / props.csatData.length)
})

const totalResponses = computed(() => {
  return props.csatData.reduce((acc, item) => acc + item.total, 0)
})

const chartPoints = computed(() => {
  const data = props.csatData
  if (data.length === 0) return []

  const xStep = (chartWidth - padding.left - padding.right) / (data.length - 1 || 1)
  const yScale = (chartHeight - padding.top - padding.bottom) / 100

  return data.map((item, index) => ({
    x: padding.left + xStep * index,
    y: chartHeight - padding.bottom - item.score * yScale
  }))
})

const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  const baseY = chartHeight - padding.bottom
  const path = chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  
  const lastPoint = chartPoints.value[chartPoints.value.length - 1]
  const firstPoint = chartPoints.value[0]
  
  return `${path} L ${lastPoint.x} ${baseY} L ${firstPoint.x} ${baseY} Z`
})

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  period: '',
  score: 0,
  satisfied: 0,
  neutral: 0,
  dissatisfied: 0
})

const showTooltip = (index: number, event: MouseEvent) => {
  const item = props.csatData[index]
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  
  tooltip.value = {
    visible: true,
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY - 10,
    period: formatPeriodLabel(item.period),
    score: Math.round(item.score),
    satisfied: item.satisfied,
    neutral: item.neutral,
    dissatisfied: item.dissatisfied
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const formatPeriodLabel = (period: string): string => {
  // Handle different period formats: YYYY-MM-DD, YYYY-W##, YYYY-MM
  if (period.includes('W')) {
    // Week format
    const [year, week] = period.split('-W')
    return isRTL.value ? `أسبوع ${week}، ${year}` : `W${week} ${year}`
  } else if (period.length === 7) {
    // Month format YYYY-MM
    const [year, month] = period.split('-')
    const monthNames = isRTL.value
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[Number.parseInt(month) - 1]} ${year}`
  } else {
    // Day format YYYY-MM-DD
    const date = new Date(period)
    return date.toLocaleDateString(isRTL.value ? 'ar' : 'en', {
      calendar: 'gregory',
      month: 'short',
      day: 'numeric'
    })
  }
}

const getPercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FFC107'
  return '#F44336'
}

const getScoreIconClass = (score: number) => {
  if (score >= 80) return 'fas fa-smile'
  if (score >= 60) return 'fas fa-meh'
  return 'fas fa-frown'
}
</script>

<style module>
.csatTrackingContainer {
  width: 100%;
  padding: 1.5rem;
}

.loadingState,
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #666;
  font-size: 1rem;
}

.loadingState i,
.emptyState i {
  font-size: 3rem;
  color: #B78A41;
}

.chartContent {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summaryStats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.statCard {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  text-align: center;
}

.csatTrackingContainer[data-theme="night"] .statCard {
  background: #2a2a2a;
}

.statValue {
  font-size: 2rem;
  font-weight: 700;
  color: #B78A41;
}

.statLabel {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
}

.chartContainer {
  position: relative;
  width: 100%;
}

.chart {
  width: 100%;
  height: auto;
}

.gridLine {
  stroke: #e0e0e0;
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.csatTrackingContainer[data-theme="night"] .gridLine {
  stroke: #404040;
}

.axisLabel {
  font-size: 0.75rem;
  fill: #666;
}

.linePath {
  stroke: #B78A41;
  stroke-width: 3;
}

.areaPath {
  fill: url(#gradient);
  opacity: 0.2;
}

.dataPoint {
  fill: #B78A41;
  stroke: white;
  stroke-width: 2;
  cursor: pointer;
  transition: r 0.2s;
}

.dataPoint:hover {
  r: 8;
}

.tooltip {
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  min-width: 150px;
}

.csatTrackingContainer[data-theme="night"] .tooltip {
  background: #2a2a2a;
  border-color: #404040;
}

.tooltipPeriod {
  font-weight: 600;
  color: #202124;
  margin-bottom: 0.5rem;
}

.csatTrackingContainer[data-theme="night"] .tooltipPeriod {
  color: #f1f1f1;
}

.tooltipScore {
  font-size: 1.25rem;
  font-weight: 700;
  color: #B78A41;
  margin-bottom: 0.5rem;
}

.tooltipBreakdown {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tooltipItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #666;
}

.tooltipDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stackedBarContainer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.barGroup {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stackedBar {
  flex: 1;
  height: 30px;
  display: flex;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #e0e0e0;
}

.barSegment {
  height: 100%;
  transition: width 0.3s;
}

.barLabel {
  width: 100px;
  font-size: 0.75rem;
  color: #666;
  text-align: right;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.legendDot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* Single Point View Styles */
.singlePointView {
  padding: 8px;
}

.currentScoreCard {
  /* background: var(--surface-variant); */
  border-radius: 16px;
  padding: 24px;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); */
}

.csatTrackingContainer[data-theme="night"] .currentScoreCard {
  background: #2a2a2a;
}

.scoreHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.scoreIcon {
  width: 52px;
  height: 52px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.csatTrackingContainer[data-theme="night"] .scoreIcon {
  background: #1a1a1a;
}

.scoreInfo {
  flex: 1;
}

.scoreTitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 4px;
}

.csatTrackingContainer[data-theme="night"] .scoreTitle {
  color: #f1f1f1;
}

.scorePeriod {
  font-size: 13px;
  color: var(--muted);
}

.scoreDisplay {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.bigScore {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.scoreBreakdown {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.breakdownItem {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--item-color, #666);
  font-weight: 500;
}

.breakdownItem i {
  width: 22px;
  text-align: center;
  font-size: 18px;
}

.satisfactionBar {
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  background: var(--surface);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.csatTrackingContainer[data-theme="night"] .satisfactionBar {
  background: #1a1a1a;
}

.satisfactionSegment {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.satisfactionSegment:hover {
  opacity: 0.9;
}

.totalResponsesInfo {
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.totalResponsesInfo strong {
  color: var(--ink);
  font-weight: 600;
}

.csatTrackingContainer[data-theme="night"] .totalResponsesInfo strong {
  color: #f1f1f1;
}

.compact .csatTrackingContainer {
  padding: 1rem;
}

@media (max-width: 768px) {
  .summaryStats {
    grid-template-columns: 1fr;
  }

  .chart {
    overflow-x: scroll;
  }
  
  .scoreDisplay {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .bigScore {
    font-size: 48px;
  }
  
  .scoreBreakdown {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .currentScoreCard {
    padding: 20px;
  }
  
  .scoreHeader {
    gap: 12px;
  }
  
  .scoreIcon {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  
  .bigScore {
    font-size: 40px;
  }
  
  .satisfactionBar {
    height: 32px;
  }
}
</style>

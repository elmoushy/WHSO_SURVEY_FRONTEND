<template>
  <div :class="$style.csatContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.csatHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-smile"></i>
      </div>
      <div :class="$style.headerContent">
        <h3 :class="$style.headerTitle">{{ isRTL ? 'تتبع رضا العملاء (CSAT)' : 'Customer Satisfaction Tracking' }}</h3>
        <p :class="$style.headerSubtitle">{{ isRTL ? 'تطور نسبة الرضا عبر الزمن' : 'Satisfaction score trends over time' }}</p>
      </div>
    </div>

    <div v-if="!hasData" :class="$style.noData">
      <i class="fas fa-chart-line"></i>
      <p>{{ isRTL ? 'لم يتم العثور على سؤال CSAT' : 'No CSAT question found' }}</p>
      <small>{{ isRTL ? 'قم بتمكين CSAT على أحد الأسئلة لعرض هذه البيانات' : 'Enable CSAT on a question to see this data' }}</small>
    </div>

    <div v-else :class="$style.csatContent">
      <!-- Current Score Summary -->
      <div :class="$style.currentScore">
        <div :class="$style.scoreCircle">
          <div :class="$style.scoreValue">{{ currentScore }}%</div>
          <div :class="$style.scoreLabel">{{ isRTL ? 'النسبة الحالية' : 'Current Score' }}</div>
        </div>
        <div :class="$style.scoreLegend">
          <div :class="$style.legendItem">
            <div :class="[$style.legendDot, $style.satisfied]"></div>
            <span>{{ isRTL ? 'راضون' : 'Satisfied' }}: {{ latestData?.satisfied || 0 }}</span>
          </div>
          <div :class="$style.legendItem">
            <div :class="[$style.legendDot, $style.neutral]"></div>
            <span>{{ isRTL ? 'محايدون' : 'Neutral' }}: {{ latestData?.neutral || 0 }}</span>
          </div>
          <div :class="$style.legendItem">
            <div :class="[$style.legendDot, $style.dissatisfied]"></div>
            <span>{{ isRTL ? 'غير راضين' : 'Dissatisfied' }}: {{ latestData?.dissatisfied || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Line Chart -->
      <div :class="$style.chartWrapper">
        <div :class="$style.chartContainer">
          <svg :class="$style.chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
            <!-- Grid lines -->
            <g :class="$style.gridLines">
              <line 
                v-for="i in 5" 
                :key="`grid-${i}`"
                :x1="padding"
                :y1="padding + ((chartHeight - 2 * padding) / 4) * (i - 1)"
                :x2="chartWidth - padding"
                :y2="padding + ((chartHeight - 2 * padding) / 4) * (i - 1)"
                stroke="#e0e0e0"
                stroke-width="1"
                stroke-dasharray="4"
              />
            </g>

            <!-- Y-axis labels -->
            <g :class="$style.yAxisLabels">
              <text 
                v-for="i in 5" 
                :key="`y-label-${i}`"
                :x="padding - 10"
                :y="padding + ((chartHeight - 2 * padding) / 4) * (i - 1) + 5"
                text-anchor="end"
                font-size="12"
                fill="#5f6368"
              >
                {{ 100 - (i - 1) * 25 }}%
              </text>
            </g>

            <!-- Line path -->
            <path
              :d="linePath"
              fill="none"
              :stroke="lineColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Area fill -->
            <path
              :d="areaPath"
              :fill="`url(#csatGradient)`"
              opacity="0.2"
            />

            <!-- Data points -->
            <g :class="$style.dataPoints">
              <circle
                v-for="(point, index) in chartPoints"
                :key="`point-${index}`"
                :cx="point.x"
                :cy="point.y"
                r="5"
                :fill="lineColor"
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
                :y="chartHeight - padding + 20"
                text-anchor="middle"
                font-size="11"
                fill="#5f6368"
              >
                {{ formatPeriod(csatData[index].period) }}
              </text>
            </g>

            <!-- Gradient definition -->
            <defs>
              <linearGradient id="csatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="lineColor" stop-opacity="0.3" />
                <stop offset="100%" :stop-color="lineColor" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- Tooltip -->
        <div 
          v-if="tooltip.show"
          :class="$style.tooltip"
          :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        >
          <div :class="$style.tooltipPeriod">{{ tooltip.period }}</div>
          <div :class="$style.tooltipScore">{{ isRTL ? 'النسبة' : 'Score' }}: {{ tooltip.score }}%</div>
          <div :class="$style.tooltipBreakdown">
            <div><span :class="[$style.dot, $style.satisfied]"></span> {{ isRTL ? 'راضون' : 'Satisfied' }}: {{ tooltip.satisfied }}</div>
            <div><span :class="[$style.dot, $style.neutral]"></span> {{ isRTL ? 'محايدون' : 'Neutral' }}: {{ tooltip.neutral }}</div>
            <div><span :class="[$style.dot, $style.dissatisfied]"></span> {{ isRTL ? 'غير راضين' : 'Dissatisfied' }}: {{ tooltip.dissatisfied }}</div>
          </div>
          <div :class="$style.tooltipTotal">{{ isRTL ? 'المجموع' : 'Total' }}: {{ tooltip.total }}</div>
        </div>
      </div>

      <!-- Stacked Bar Chart (Optional Alternative View) -->
      <div :class="$style.stackedBars">
        <div :class="$style.barsTitle">{{ isRTL ? 'التوزيع التفصيلي' : 'Detailed Breakdown' }}</div>
        <div :class="$style.barsContainer">
          <div 
            v-for="(item, index) in csatData" 
            :key="`bar-${index}`"
            :class="$style.barGroup"
          >
            <div :class="$style.barLabel">{{ formatPeriodShort(item.period) }}</div>
            <div :class="$style.stackedBar">
              <div 
                :class="[$style.barSegment, $style.satisfied]"
                :style="{ width: `${(item.satisfied / item.total) * 100}%` }"
                :title="`${isRTL ? 'راضون' : 'Satisfied'}: ${item.satisfied}`"
              >
                <span v-if="item.satisfied > 0">{{ item.satisfied }}</span>
              </div>
              <div 
                :class="[$style.barSegment, $style.neutral]"
                :style="{ width: `${(item.neutral / item.total) * 100}%` }"
                :title="`${isRTL ? 'محايدون' : 'Neutral'}: ${item.neutral}`"
              >
                <span v-if="item.neutral > 0">{{ item.neutral }}</span>
              </div>
              <div 
                :class="[$style.barSegment, $style.dissatisfied]"
                :style="{ width: `${(item.dissatisfied / item.total) * 100}%` }"
                :title="`${isRTL ? 'غير راضين' : 'Dissatisfied'}: ${item.dissatisfied}`"
              >
                <span v-if="item.dissatisfied > 0">{{ item.dissatisfied }}</span>
              </div>
            </div>
            <div :class="$style.barScore">{{ item.score }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { CSATTrackingPoint } from '../../types/survey.types'

interface Props {
  csatData: CSATTrackingPoint[]
}

const props = defineProps<Props>()
const store = useAppStore()

const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

const hasData = computed(() => {
  return props.csatData && props.csatData.length > 0
})

const latestData = computed(() => {
  if (!hasData.value) return null
  return props.csatData[props.csatData.length - 1]
})

const currentScore = computed(() => {
  return latestData.value?.score || 0
})

const lineColor = computed(() => {
  const score = currentScore.value
  if (score >= 80) return '#10b981' // green
  if (score >= 60) return '#3b82f6' // blue
  if (score >= 40) return '#f59e0b' // amber
  return '#ef4444' // red
})

// Chart dimensions
const chartWidth = 800
const chartHeight = 300
const padding = 60

const chartPoints = computed(() => {
  if (!hasData.value) return []
  
  const data = props.csatData
  const xStep = (chartWidth - 2 * padding) / Math.max(data.length - 1, 1)
  const yMax = chartHeight - 2 * padding
  
  return data.map((item, index) => ({
    x: padding + index * xStep,
    y: padding + yMax - (item.score / 100) * yMax
  }))
})

const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  
  return chartPoints.value.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')
})

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  
  const firstPoint = chartPoints.value[0]
  const lastPoint = chartPoints.value[chartPoints.value.length - 1]
  const bottom = chartHeight - padding
  
  return `${linePath.value} L ${lastPoint.x} ${bottom} L ${firstPoint.x} ${bottom} Z`
})

const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  period: '',
  score: 0,
  satisfied: 0,
  neutral: 0,
  dissatisfied: 0,
  total: 0
})

const showTooltip = (index: number, _event: MouseEvent) => {
  const item = props.csatData[index]
  const point = chartPoints.value[index]
  
  tooltip.value = {
    show: true,
    x: point.x,
    y: point.y - 10,
    period: formatPeriod(item.period),
    score: item.score,
    satisfied: item.satisfied,
    neutral: item.neutral,
    dissatisfied: item.dissatisfied,
    total: item.total
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const formatPeriod = (period: string): string => {
  // Handle different period formats: YYYY-MM-DD, YYYY-W##, YYYY-MM
  if (period.includes('W')) {
    const [year, week] = period.split('-W')
    return isRTL.value ? `أسبوع ${week}، ${year}` : `Week ${week}, ${year}`
  }
  
  const parts = period.split('-')
  if (parts.length === 3) {
    // Daily format
    const date = new Date(period)
    return date.toLocaleDateString(isRTL.value ? 'ar-SA' : 'en-US', { 
      month: 'short', 
      day: 'numeric',
      calendar: isRTL.value ? 'gregory' : undefined
    })
  }
  
  // Monthly format
  const date = new Date(period + '-01')
  return date.toLocaleDateString(isRTL.value ? 'ar-SA' : 'en-US', { 
    month: 'short', 
    year: 'numeric',
    calendar: isRTL.value ? 'gregory' : undefined
  })
}

const formatPeriodShort = (period: string): string => {
  if (period.includes('W')) {
    const week = period.split('-W')[1]
    return `W${week}`
  }
  
  const parts = period.split('-')
  if (parts.length === 3) {
    return new Date(period).toLocaleDateString(isRTL.value ? 'ar-SA' : 'en-US', { 
      month: 'numeric', 
      day: 'numeric',
      calendar: isRTL.value ? 'gregory' : undefined
    })
  }
  
  return new Date(period + '-01').toLocaleDateString(isRTL.value ? 'ar-SA' : 'en-US', { 
    month: 'short',
    calendar: isRTL.value ? 'gregory' : undefined
  })
}
</script>

<style module>
.csatContainer {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.csatContainer[data-theme="night"] {
  background: #2d2d2d;
}

.csatHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.headerIcon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.headerContent {
  flex: 1;
}

.headerTitle {
  font-size: 1.125rem;
  font-weight: 600;
  color: #202124;
  margin: 0 0 0.25rem 0;
}

.csatContainer[data-theme="night"] .headerTitle {
  color: #f1f1f1;
}

.headerSubtitle {
  font-size: 0.875rem;
  color: #5f6368;
  margin: 0;
}

.csatContainer[data-theme="night"] .headerSubtitle {
  color: #9aa0a6;
}

.noData {
  text-align: center;
  padding: 3rem 1rem;
  color: #9aa0a6;
}

.noData i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.noData p {
  margin: 0 0 0.5rem 0;
  font-size: 0.938rem;
  font-weight: 500;
}

.noData small {
  font-size: 0.813rem;
  opacity: 0.7;
}

.csatContent {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.currentScore {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 0.75rem;
}

.csatContainer[data-theme="night"] .currentScore {
  background: linear-gradient(135deg, #343a40 0%, #2d2d2d 100%);
}

.scoreCircle {
  text-align: center;
}

.scoreValue {
  font-size: 3rem;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
}

.scoreLabel {
  font-size: 0.875rem;
  color: #5f6368;
  margin-top: 0.5rem;
}

.csatContainer[data-theme="night"] .scoreLabel {
  color: #9aa0a6;
}

.scoreLegend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.938rem;
  color: #202124;
}

.csatContainer[data-theme="night"] .legendItem {
  color: #e8e8e8;
}

.legendDot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
}

.legendDot.satisfied {
  background: #10b981;
}

.legendDot.neutral {
  background: #f59e0b;
}

.legendDot.dissatisfied {
  background: #ef4444;
}

.chartWrapper {
  position: relative;
}

.chartContainer {
  width: 100%;
  overflow-x: auto;
}

.chart {
  width: 100%;
  height: auto;
  min-width: 600px;
}

.dataPoint {
  cursor: pointer;
  transition: r 0.2s;
}

.dataPoint:hover {
  r: 7;
}

.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.813rem;
  pointer-events: none;
  transform: translate(-50%, -100%);
  z-index: 100;
  min-width: 150px;
}

.tooltipPeriod {
  font-weight: 600;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.25rem;
}

.tooltipScore {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.tooltipBreakdown {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.tooltipBreakdown .dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-right: 0.25rem;
}

.tooltipBreakdown .dot.satisfied {
  background: #10b981;
}

.tooltipBreakdown .dot.neutral {
  background: #f59e0b;
}

.tooltipBreakdown .dot.dissatisfied {
  background: #ef4444;
}

.tooltipTotal {
  font-size: 0.75rem;
  opacity: 0.8;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 0.25rem;
}

.stackedBars {
  background: #f8f9fa;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.csatContainer[data-theme="night"] .stackedBars {
  background: #1a1a1a;
}

.barsTitle {
  font-size: 1rem;
  font-weight: 600;
  color: #202124;
  margin-bottom: 1rem;
}

.csatContainer[data-theme="night"] .barsTitle {
  color: #f1f1f1;
}

.barsContainer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.barGroup {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  align-items: center;
  gap: 1rem;
}

.barLabel {
  font-size: 0.813rem;
  font-weight: 500;
  color: #5f6368;
  text-align: right;
}

.csatContainer[data-theme="night"] .barLabel {
  color: #9aa0a6;
}

.stackedBar {
  height: 2rem;
  display: flex;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #e9ecef;
}

.csatContainer[data-theme="night"] .stackedBar {
  background: #343a40;
}

.barSegment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  transition: all 0.2s;
}

.barSegment:hover {
  filter: brightness(1.1);
}

.barSegment.satisfied {
  background: #10b981;
}

.barSegment.neutral {
  background: #f59e0b;
}

.barSegment.dissatisfied {
  background: #ef4444;
}

.barScore {
  font-size: 0.875rem;
  font-weight: 600;
  color: #202124;
  text-align: center;
}

.csatContainer[data-theme="night"] .barScore {
  color: #e8e8e8;
}

@media (max-width: 768px) {
  .csatContainer {
    padding: 1rem;
  }
  
  .currentScore {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .barGroup {
    grid-template-columns: 60px 1fr 50px;
    gap: 0.5rem;
  }
  
  .barLabel {
    font-size: 0.75rem;
  }
}
</style>

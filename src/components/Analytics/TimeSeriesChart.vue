<template>
  <div :class="$style.timeSeriesChart" :data-theme="currentTheme">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingChart') }}</p>
    </div>

    <div v-else-if="!data || data.length === 0" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-chart-line"></i>
      </div>
      <p :class="$style.emptyText">{{ t('survey.analytics.noTimeSeriesData') }}</p>
    </div>

    <div v-else :class="$style.chartContainer">
      <!-- Chart SVG -->
      <svg
        :class="$style.chartSvg"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Grid Lines -->
        <g :class="$style.gridLines">
          <!-- Horizontal grid lines -->
          <line
            v-for="y in horizontalGridLines"
            :key="y.value"
            :x1="padding.left"
            :y1="y.position"
            :x2="width - padding.right"
            :y2="y.position"
            :class="$style.gridLine"
          />
          <!-- Vertical grid lines -->
          <line
            v-for="x in verticalGridLines"
            :key="x.index"
            :x1="x.position"
            :y1="padding.top"
            :x2="x.position"
            :y2="height - padding.bottom"
            :class="$style.gridLine"
          />
        </g>

        <!-- Chart Lines -->
        <g :class="$style.chartLines">
          <!-- Responses Line -->
          <path
            :d="responsesPath"
            :class="$style.responsesLine"
            fill="none"
            stroke="#4CAF50"
            stroke-width="3"
          />
          <!-- Completion Rate Line -->
          <path
            :d="completionRatePath"
            :class="$style.completionRateLine"
            fill="none"
            stroke="#2196F3"
            stroke-width="3"
          />
        </g>

        <!-- Data Points -->
        <g :class="$style.dataPoints">
          <!-- Response Points -->
          <circle
            v-for="(point, index) in responsePoints"
            :key="`response-${index}`"
            :cx="point!.x"
            :cy="point!.y"
            r="6"
            :class="$style.responsePoint"
            fill="#4CAF50"
            @click="onPointClick(point, 'responses')"
            @mouseover="onPointHover(point, 'responses', $event)"
            @mouseleave="onPointLeave"
          />
          <!-- Completion Rate Points -->
          <circle
            v-for="(point, index) in completionRatePoints"
            :key="`completion-${index}`"
            :cx="point!.x"
            :cy="point!.y"
            r="6"
            :class="$style.completionRatePoint"
            fill="#2196F3"
            @click="onPointClick(point, 'completion')"
            @mouseover="onPointHover(point, 'completion', $event)"
            @mouseleave="onPointLeave"
          />
        </g>

        <!-- Axes Labels -->
        <g :class="$style.axesLabels">
          <!-- Y-axis labels (left - responses) -->
          <text
            v-for="label in responsesYLabels"
            :key="label.value"
            :x="padding.left - 10"
            :y="label.position + 5"
            :class="$style.yAxisLabel"
            text-anchor="end"
            fill="#4CAF50"
          >
            {{ formatNumber(label.value) }}
          </text>
          
          <!-- Y-axis labels (right - completion rate) -->
          <text
            v-for="label in completionRateYLabels"
            :key="label.value"
            :x="width - padding.right + 10"
            :y="label.position + 5"
            :class="$style.yAxisLabel"
            text-anchor="start"
            fill="#2196F3"
          >
            {{ formatPercentage(label.value) }}
          </text>

          <!-- X-axis labels -->
          <text
            v-for="(label, index) in xLabels"
            :key="index"
            :x="label.position"
            :y="height - padding.bottom + 20"
            :class="$style.xAxisLabel"
            text-anchor="middle"
            fill="currentColor"
          >
            {{ label.text }}
          </text>
        </g>
      </svg>

      <!-- Tooltip -->
      <div
        v-if="tooltip.show"
        :class="$style.tooltip"
        :style="{
          left: tooltip.x + 'px',
          top: tooltip.y + 'px'
        }"
      >
        <div :class="$style.tooltipHeader">
          {{ tooltip.data.label }}
        </div>
        <div :class="$style.tooltipContent">
          <div v-if="tooltip.type === 'responses'" :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" style="background-color: #4CAF50;"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.responses') }}:</span>
            <span :class="$style.tooltipValue">{{ formatNumber(tooltip.data.responses) }}</span>
          </div>
          <div v-if="tooltip.type === 'completion'" :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" style="background-color: #2196F3;"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.completionRate') }}:</span>
            <span :class="$style.tooltipValue">{{ formatPercentage(tooltip.data.completionRate) }}</span>
          </div>
          <div v-if="tooltip.data.uniqueRespondents" :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" style="background-color: #FF9800;"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.uniqueRespondents') }}:</span>
            <span :class="$style.tooltipValue">{{ formatNumber(tooltip.data.uniqueRespondents) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

// Props
interface Props {
  data: Array<{
    period: string
    label: string
    responses: number
    uniqueRespondents: number
    completionRate: number
  }>
  loading?: boolean
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  width: 800,
  height: 400
})

// Emits
const emit = defineEmits<{
  pointClick: [data: any, type: string]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const t = computed(() => store.t)

// Chart configuration
const padding = {
  top: 40,
  right: 60,
  bottom: 60,
  left: 60
}

// Tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  data: null as any,
  type: ''
})

// Chart dimensions
const chartWidth = computed(() => props.width - padding.left - padding.right)
const chartHeight = computed(() => props.height - padding.top - padding.bottom)

// Data scales
const maxResponses = computed(() => {
  if (!props.data || props.data.length === 0) return 1
  const max = Math.max(...props.data.map(d => d?.responses || 0))
  return max > 0 ? max : 1
})

const maxCompletionRate = computed(() => {
  if (!props.data || props.data.length === 0) return 1
  const max = Math.max(...props.data.map(d => d?.completionRate || 0))
  return max > 0 ? max : 1
})

// Scale functions
const xScale = (index: number) => {
  if (!props.data || props.data.length === 0) return padding.left
  const stepWidth = chartWidth.value / Math.max(props.data.length - 1, 1)
  return padding.left + index * stepWidth
}

const yScaleResponses = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) return padding.top + chartHeight.value
  const ratio = value / maxResponses.value
  const result = padding.top + (1 - ratio) * chartHeight.value
  return isNaN(result) ? padding.top + chartHeight.value : result
}

const yScaleCompletionRate = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) return padding.top + chartHeight.value
  const ratio = value / maxCompletionRate.value
  const result = padding.top + (1 - ratio) * chartHeight.value
  return isNaN(result) ? padding.top + chartHeight.value : result
}

// Grid lines
const horizontalGridLines = computed(() => {
  const lines = []
  const steps = 5
  
  // Responses grid lines
  for (let i = 0; i <= steps; i++) {
    const value = (maxResponses.value / steps) * i
    const position = yScaleResponses(value)
    lines.push({ value, position })
  }
  
  return lines
})

const verticalGridLines = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  return props.data.map((_, index) => ({
    index,
    position: xScale(index)
  }))
})

// Chart paths
const responsesPath = computed(() => {
  if (!props.data || props.data.length === 0) return ''
  
  const validData = props.data.filter(d => d && typeof d.responses === 'number' && !isNaN(d.responses))
  if (validData.length === 0) return ''
  
  const pathData = validData.map((d, index) => {
    const originalIndex = props.data.indexOf(d)
    const x = xScale(originalIndex)
    const y = yScaleResponses(d.responses)
    
    if (isNaN(x) || isNaN(y)) return ''
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).filter(segment => segment !== '').join(' ')
  
  return pathData
})

const completionRatePath = computed(() => {
  if (!props.data || props.data.length === 0) return ''
  
  const validData = props.data.filter(d => d && typeof d.completionRate === 'number' && !isNaN(d.completionRate))
  if (validData.length === 0) return ''
  
  const pathData = validData.map((d, index) => {
    const originalIndex = props.data.indexOf(d)
    const x = xScale(originalIndex)
    const y = yScaleCompletionRate(d.completionRate)
    
    if (isNaN(x) || isNaN(y)) return ''
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).filter(segment => segment !== '').join(' ')
  
  return pathData
})

// Data points
const responsePoints = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  return props.data
    .map((d, index) => {
      if (!d || typeof d.responses !== 'number' || isNaN(d.responses)) return null
      
      const x = xScale(index)
      const y = yScaleResponses(d.responses)
      
      if (isNaN(x) || isNaN(y)) return null
      
      return {
        x,
        y,
        data: d,
        index
      }
    })
    .filter(point => point !== null)
})

const completionRatePoints = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  return props.data
    .map((d, index) => {
      if (!d || typeof d.completionRate !== 'number' || isNaN(d.completionRate)) return null
      
      const x = xScale(index)
      const y = yScaleCompletionRate(d.completionRate)
      
      if (isNaN(x) || isNaN(y)) return null
      
      return {
        x,
        y,
        data: d,
        index
      }
    })
    .filter(point => point !== null)
})

// Axis labels
const responsesYLabels = computed(() => {
  const labels = []
  const steps = 5
  const max = maxResponses.value
  
  for (let i = 0; i <= steps; i++) {
    const value = (max / steps) * i
    const position = yScaleResponses(value)
    
    if (!isNaN(position)) {
      labels.push({ value: Math.round(value), position })
    }
  }
  
  return labels
})

const completionRateYLabels = computed(() => {
  const labels = []
  const steps = 5
  const max = maxCompletionRate.value
  
  for (let i = 0; i <= steps; i++) {
    const value = (max / steps) * i
    const position = yScaleCompletionRate(value)
    
    if (!isNaN(position)) {
      labels.push({ value: value.toFixed(2), position })
    }
  }
  
  return labels
})


const xLabels = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  // Show every other label to avoid crowding
  return props.data.map((d, index) => ({
    text: index % 2 === 0 ? d.label : '',
    position: xScale(index)
  })).filter(label => label.text !== '')
})

// Methods
const formatNumber = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(Math.round(value))
}

const formatPercentage = (value: number | string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (!numValue && numValue !== 0 || isNaN(numValue)) return '0%'
  return `${Math.round(numValue * 100)}%`
}

const onPointClick = (point: any, type: string) => {
  emit('pointClick', point.data, type)
}

const onPointHover = async (point: any, type: string, event: MouseEvent) => {
  await nextTick()
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const containerRect = (event.target as HTMLElement).closest('.timeSeriesChart')?.getBoundingClientRect()
  
  if (containerRect) {
    tooltip.value = {
      show: true,
      x: rect.left - containerRect.left + 10,
      y: rect.top - containerRect.top - 10,
      data: point.data,
      type
    }
  }
}

const onPointLeave = () => {
  tooltip.value.show = false
}
</script>

<style module>
.timeSeriesChart {
  width: 100%;
  height: 100%;
  position: relative;
}

.loadingContainer,
.emptyContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loadingText,
.emptyText {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.emptyIcon {
  font-size: 48px;
  color: var(--muted);
  opacity: 0.5;
}

.chartContainer {
  width: 100%;
  height: 100%;
  position: relative;
}

.chartSvg {
  width: 100%;
  height: 100%;
}

.gridLine {
  stroke: var(--border);
  stroke-width: 1;
  opacity: 0.3;
}

.responsesLine,
.completionRateLine {
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.responsePoint,
.completionRatePoint {
  cursor: pointer;
  transition: r 0.2s ease;
}

.responsePoint:hover,
.completionRatePoint:hover {
  r: 8;
}

.yAxisLabel,
.xAxisLabel {
  font-size: 12px;
  font-family: inherit;
  fill: var(--muted);
}

.yAxisLabel {
  font-weight: 600;
}

.tooltip {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
  min-width: 200px;
}

.tooltipHeader {
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 8px;
  font-size: 13px;
}

.tooltipContent {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltipItem {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.tooltipColor {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tooltipLabel {
  color: var(--muted);
  flex: 1;
}

.tooltipValue {
  color: var(--ink);
  font-weight: 600;
}

/* Dark theme */
.timeSeriesChart[data-theme="night"] {
  --surface: #2d3748;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
}

/* Responsive */
@media (max-width: 768px) {
  .chartSvg {
    font-size: 10px;
  }
  
  .tooltip {
    font-size: 11px;
    min-width: 150px;
  }
}
</style>

<template>
  <div :class="$style.horizontalBarChart" :data-theme="currentTheme">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingChart') }}</p>
    </div>

    <div v-else-if="!data || data.length === 0" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-chart-bar"></i>
      </div>
      <p :class="$style.emptyText">{{ t('survey.analytics.noData') }}</p>
    </div>

    <div v-else :class="$style.chartContainer">
      <!-- Chart SVG -->
      <svg
        :class="$style.chartSvg"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Bars -->
        <g :class="$style.barsGroup">
          <g
            v-for="(bar, index) in bars"
            :key="index"
            :class="$style.barGroup"
            @click="onBarClick(bar, index)"
            @mouseover="onBarHover(bar, index, $event)"
            @mouseleave="onBarLeave"
          >
            <!-- Background bar -->
            <rect
              :x="padding.left"
              :y="bar.y"
              :width="chartWidth"
              :height="barHeight"
              :class="$style.barBackground"
            />
            
            <!-- Data bar -->
            <rect
              :x="padding.left"
              :y="bar.y"
              :width="bar.width"
              :height="barHeight"
              :fill="bar.color"
              :class="$style.dataBar"
            />
            
            <!-- Label -->
            <text
              :x="padding.left - 10"
              :y="bar.y + barHeight / 2"
              :class="$style.barLabel"
              text-anchor="end"
              dominant-baseline="middle"
            >
              {{ truncateLabel(bar.label, 20) }}
            </text>
            
            <!-- Value -->
            <text
              :x="padding.left + bar.width + 10"
              :y="bar.y + barHeight / 2"
              :class="$style.barValue"
              text-anchor="start"
              dominant-baseline="middle"
            >
              {{ formatValue(bar.value) }}
            </text>
          </g>
        </g>

        <!-- Grid lines -->
        <g :class="$style.gridLines">
          <line
            v-for="gridLine in verticalGridLines"
            :key="gridLine.value"
            :x1="gridLine.x"
            :y1="padding.top"
            :x2="gridLine.x"
            :y2="height - padding.bottom"
            :class="$style.gridLine"
          />
        </g>

        <!-- Axis labels -->
        <g :class="$style.axisLabels">
          <!-- X-axis labels -->
          <text
            v-for="label in xAxisLabels"
            :key="label.value"
            :x="label.x"
            :y="height - padding.bottom + 20"
            :class="$style.axisLabel"
            text-anchor="middle"
          >
            {{ formatValue(label.value) }}
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
          <div :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" :style="{ backgroundColor: tooltip.data.color }"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.value') }}:</span>
            <span :class="$style.tooltipValue">{{ formatValue(tooltip.data.value) }}</span>
          </div>
          <div v-if="tooltip.data.percentage" :class="$style.tooltipItem">
            <span :class="$style.tooltipColor" :style="{ backgroundColor: tooltip.data.color }"></span>
            <span :class="$style.tooltipLabel">{{ t('survey.analytics.percentage') }}:</span>
            <span :class="$style.tooltipValue">{{ formatPercentage(tooltip.data.percentage) }}</span>
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
    value: number
    percentage?: number
  }>
  colors?: string[]
  labels?: string[]
  loading?: boolean
  width?: number
  height?: number
  showPercentage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  colors: () => ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#795548'],
  labels: () => [],
  loading: false,
  width: 600,
  height: 400,
  showPercentage: false
})

// Emits
const emit = defineEmits<{
  barClick: [data: any, index: number]
  barHover: [data: any, index: number]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const t = computed(() => store.t)

// Chart configuration
const padding = {
  top: 20,
  right: 80,
  bottom: 40,
  left: 150
}

// State
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  data: null as any
})

// Chart dimensions
const chartWidth = computed(() => props.width - padding.left - padding.right)
const chartHeight = computed(() => props.height - padding.top - padding.bottom)

const barHeight = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  const availableHeight = chartHeight.value
  const spacing = Math.min(10, availableHeight * 0.1)
  return Math.max(20, (availableHeight - (props.data.length - 1) * spacing) / props.data.length)
})

// Data processing
const maxValue = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return Math.max(...props.data.map(d => d.value)) || 1
})

const bars = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  const spacing = Math.min(10, chartHeight.value * 0.1)
  
  return props.data.map((item, index) => {
    const y = padding.top + index * (barHeight.value + spacing)
    const width = (item.value / maxValue.value) * chartWidth.value
    const color = props.colors[index % props.colors.length]
    const label = props.labels[index] || `Item ${index + 1}`
    
    return {
      y,
      width: Math.max(2, width), // Minimum width for visibility
      color,
      label,
      value: item.value,
      percentage: item.percentage,
      index
    }
  })
})

// Grid lines
const verticalGridLines = computed(() => {
  const lines = []
  const steps = 5
  
  for (let i = 0; i <= steps; i++) {
    const value = (maxValue.value / steps) * i
    const x = padding.left + (value / maxValue.value) * chartWidth.value
    lines.push({ value, x })
  }
  
  return lines
})

// Axis labels
const xAxisLabels = computed(() => {
  const labels = []
  const steps = 5
  
  for (let i = 0; i <= steps; i++) {
    const value = (maxValue.value / steps) * i
    const x = padding.left + (value / maxValue.value) * chartWidth.value
    labels.push({ value, x })
  }
  
  return labels
})

// Methods
const formatValue = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(Math.round(value))
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${Math.round(value * 100)}%`
}

const truncateLabel = (label: string, maxLength: number) => {
  if (label.length <= maxLength) return label
  return label.substring(0, maxLength - 3) + '...'
}

const onBarClick = (bar: any, index: number) => {
  emit('barClick', bar, index)
}

const onBarHover = async (bar: any, index: number, event: MouseEvent) => {
  emit('barHover', bar, index)
  
  await nextTick()
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const containerRect = (event.target as HTMLElement).closest('.horizontalBarChart')?.getBoundingClientRect()
  
  if (containerRect) {
    tooltip.value = {
      show: true,
      x: rect.right - containerRect.left + 10,
      y: rect.top - containerRect.top,
      data: bar
    }
  }
}

const onBarLeave = () => {
  tooltip.value.show = false
}
</script>

<style module>
.horizontalBarChart {
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

.barGroup {
  cursor: pointer;
}

.barBackground {
  fill: var(--surface-variant);
  opacity: 0.3;
}

.dataBar {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.barGroup:hover .dataBar {
  opacity: 0.8;
  transform: scaleX(1.02);
  transform-origin: left center;
}

.barLabel {
  font-size: 12px;
  font-family: inherit;
  fill: var(--ink);
  font-weight: 500;
}

.barValue {
  font-size: 11px;
  font-family: inherit;
  fill: var(--muted);
  font-weight: 600;
}

.gridLine {
  stroke: var(--border);
  stroke-width: 1;
  opacity: 0.3;
}

.axisLabel {
  font-size: 10px;
  font-family: inherit;
  fill: var(--muted);
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
  min-width: 180px;
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
.horizontalBarChart[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
}

/* Responsive */
@media (max-width: 768px) {
  .barLabel {
    font-size: 10px;
  }
  
  .barValue {
    font-size: 9px;
  }
  
  .tooltip {
    font-size: 11px;
    min-width: 150px;
  }
}
</style>

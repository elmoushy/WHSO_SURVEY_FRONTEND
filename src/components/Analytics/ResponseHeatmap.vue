<template>
  <div :class="$style.heatmapWrapper" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Loading State -->
    <div v-if="loading" :class="$style.loadingState">
      <div :class="$style.loadingSpinner"></div>
      <span :class="$style.loadingText">{{ isRTL ? 'جاري تحميل البيانات...' : 'Loading data...' }}</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" :class="$style.emptyState">
      <div :class="$style.emptyIcon">
        <i class="fas fa-chart-area"></i>
      </div>
      <h3 :class="$style.emptyTitle">{{ isRTL ? 'لا توجد بيانات' : 'No Data Available' }}</h3>
      <p :class="$style.emptyDescription">{{ isRTL ? 'لم يتم تسجيل أي ردود حتى الآن' : 'No responses have been recorded yet' }}</p>
    </div>

    <!-- Heatmap Content -->
    <div v-else :class="$style.heatmapContainer">
      <!-- Stats Summary Bar -->
      <!-- <div :class="$style.statsBar">
        <div :class="$style.statCard">
          <i class="fas fa-comments"></i>
          <div :class="$style.statContent">
            <span :class="$style.statValue">{{ grandTotal.toLocaleString() }}</span>
            <span :class="$style.statLabel">{{ isRTL ? 'إجمالي الردود' : 'Total Responses' }}</span>
          </div>
        </div>
        <div :class="$style.statCard">
          <i class="fas fa-fire"></i>
          <div :class="$style.statContent">
            <span :class="$style.statValue">{{ peakHour }}</span>
            <span :class="$style.statLabel">{{ isRTL ? 'ذروة النشاط' : 'Peak Hour' }}</span>
          </div>
        </div>
        <div :class="$style.statCard">
          <i class="fas fa-calendar-day"></i>
          <div :class="$style.statContent">
            <span :class="$style.statValue">{{ peakDay }}</span>
            <span :class="$style.statLabel">{{ isRTL ? 'أنشط يوم' : 'Busiest Day' }}</span>
          </div>
        </div>
      </div> -->

      <!-- Main Heatmap Grid -->
      <div :class="$style.gridContainer">
        <!-- Time Labels (Top) -->
        <div :class="$style.timeLabels">
          <div :class="$style.cornerLabel"></div>
          <div
            v-for="hour in 24"
            :key="`hour-${hour}`"
            :class="$style.timeLabel"
          >
            {{ formatHourLabel(hour - 1) }}
          </div>
        </div>

        <!-- Days + Heatmap Cells -->
        <div :class="$style.gridBody">
          <div
            v-for="(dayRow, dayIndex) in heatmapData.matrix"
            :key="`day-${dayIndex}`"
            :class="$style.dayRow"
          >
            <!-- Day Label -->
            <div :class="$style.dayLabel">
              <span :class="$style.dayName">{{ dayNames[dayIndex] }}</span>
              <span :class="$style.dayTotal">{{ heatmapData.totals_by_day[dayIndex] }}</span>
            </div>

            <!-- Hour Cells -->
            <div :class="$style.cellsRow">
              <div
                v-for="(value, hourIndex) in dayRow"
                :key="`cell-${dayIndex}-${hourIndex}`"
                :class="[$style.cell, { [$style.cellActive]: value > 0 }]"
                :data-intensity="getIntensityLevel(value)"
                @mouseenter="showTooltip($event, dayIndex, hourIndex, value)"
                @mouseleave="hideTooltip"
              >
                <div :class="$style.cellInner" :style="getCellStyle(value)">
                  <span v-if="value > 0 && value >= maxValue * 0.3" :class="$style.cellText">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
  

      <!-- Tooltip -->
      <Transition name="tooltip">
        <div
          v-if="tooltip.visible"
          :class="$style.tooltip"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <div :class="$style.tooltipHeader">
            <i class="fas fa-clock"></i>
            <strong>{{ tooltip.day }} at {{ tooltip.hour }}</strong>
          </div>
          <div :class="$style.tooltipBody">
            <span :class="$style.tooltipValue">{{ tooltip.value }}</span>
            <span :class="$style.tooltipLabel">{{ tooltip.value === 1 ? (isRTL ? 'رد' : 'response') : (isRTL ? 'ردود' : 'responses') }}</span>
          </div>
          <div :class="$style.tooltipFooter">
            <span :class="$style.tooltipPercentage">{{ tooltip.percentage }}% {{ isRTL ? 'من الإجمالي' : 'of total' }}</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { HeatmapData } from '../../types/survey.types'

interface Props {
  heatmapData: HeatmapData
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// Tooltip state
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  day: '',
  hour: '',
  value: 0,
  percentage: 0
})

// Day names
const dayNames = computed(() => {
  if (isRTL.value) {
    return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  }
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
})

// Check if data is empty
const isEmpty = computed(() => {
  return props.heatmapData.matrix.every(row => row.every(cell => cell === 0))
})

// Calculate grand total
const grandTotal = computed(() => {
  return props.heatmapData.totals_by_day.reduce((sum, val) => sum + val, 0)
})

// Calculate max value for intensity scaling
const maxValue = computed(() => {
  const flatValues = props.heatmapData.matrix.flat()
  return Math.max(...flatValues, 1) // Ensure minimum of 1 to avoid division by zero
})

// Calculate min value for legend (currently unused but may be needed for future legend implementation)
// const minValue = computed(() => {
//   const flatValues = props.heatmapData.matrix.flat().filter(v => v > 0)
//   return flatValues.length > 0 ? Math.min(...flatValues) : 0
// })

// Find peak hour (used in template)
const peakHour = computed(() => {
  const maxHourValue = Math.max(...props.heatmapData.totals_by_hour)
  const hourIndex = props.heatmapData.totals_by_hour.indexOf(maxHourValue)
  return formatHour(hourIndex)
})

// Find peak day (used in template)
const peakDay = computed(() => {
  const maxDayValue = Math.max(...props.heatmapData.totals_by_day)
  const dayIndex = props.heatmapData.totals_by_day.indexOf(maxDayValue)
  return dayNames.value[dayIndex]
})

// Tell TypeScript these are used in template
void peakHour
void peakDay

// Format hour for display
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

// Format hour label (only show specific hours: 0, 3, 6, 9, 12, 15, 18, 21)
const formatHourLabel = (hour: number): string => {
  const displayHours = [0, 3, 6, 9, 12, 15, 18, 21]
  
  if (!displayHours.includes(hour)) {
    return ''
  }
  
  if (isRTL.value) {
    // Arabic format
    if (hour === 0) return '12ص'
    if (hour === 3) return '3ص'
    if (hour === 6) return '6ص'
    if (hour === 9) return '9ص'
    if (hour === 12) return '12م'
    if (hour === 15) return '3م'
    if (hour === 18) return '6م'
    if (hour === 21) return '9م'
  } else {
    // English format
    if (hour === 0) return '12 AM'
    if (hour === 3) return '3 AM'
    if (hour === 6) return '6 AM'
    if (hour === 9) return '9 AM'
    if (hour === 12) return '12 PM'
    if (hour === 15) return '3 PM'
    if (hour === 18) return '6 PM'
    if (hour === 21) return '9 PM'
  }
  
  return ''
}

// Get color based on intensity (0-1 scale)
const getColorForIntensity = (intensity: number): string => {
  const isDark = currentTheme.value === 'night'
  
  if (isDark) {
    // Dark theme: Gold/Brown palette (darker = more intense)
    const colors = [
      '#F5F7FA', // Very light (low intensity)
      '#F3D6A7', // Light gold
      '#EBC47A', // Medium gold
      '#E5B960', // Medium-light gold
      '#DFB04A', // Medium gold
      '#CFA135', // Medium-dark gold
      '#A17D23', // Brand gold
      '#8B6A1E', // Dark gold
      '#6D5217', // Darker gold
      '#59400D'  // Darkest (high intensity)
    ]
    const index = Math.min(Math.floor(intensity * 10), 9)
    return colors[index]
  } else {
    // Light theme: Gold/Brown palette (darker = more intense)
    const colors = [
      '#F5F7FA', // Very light (low intensity)
      '#F3D6A7', // Light gold
      '#EBC47A', // Medium gold
      '#E5B960', // Medium-light gold
      '#DFB04A', // Medium gold
      '#CFA135', // Medium-dark gold
      '#A17D23', // Brand gold
      '#8B6A1E', // Dark gold
      '#6D5217', // Darker gold
      '#59400D'  // Darkest (high intensity)
    ]
    const index = Math.min(Math.floor(intensity * 10), 9)
    return colors[index]
  }
}

// Get cell background style
const getCellStyle = (value: number) => {
  if (value === 0) {
    return {}
  }
  
  const intensity = value / maxValue.value
  const color = getColorForIntensity(intensity)
  
  return {
    background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -10)} 100%)`,
    border: '1px solid ' + adjustBrightness(color, -15),
    boxShadow: value > maxValue.value * 0.7 ? `0 0 8px ${adjustBrightness(color, 20)}` : 'none'
  }
}

// Get intensity level (0-10) for data attribute
const getIntensityLevel = (value: number): number => {
  if (value === 0) return 0
  return Math.min(Math.ceil((value / maxValue.value) * 10), 10)
}

// Adjust color brightness
const adjustBrightness = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

// Show tooltip
const showTooltip = (event: MouseEvent, dayIndex: number, hourIndex: number, value: number) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const containerRect = target.closest('[class*="heatmapWrapper"]')?.getBoundingClientRect()
  
  if (containerRect) {
    tooltip.x = rect.left - containerRect.left + rect.width / 2
    tooltip.y = rect.top - containerRect.top - 10
  }
  
  tooltip.day = dayNames.value[dayIndex]
  tooltip.hour = formatHour(hourIndex)
  tooltip.value = value
  tooltip.percentage = grandTotal.value > 0 ? parseFloat(((value / grandTotal.value) * 100).toFixed(1)) : 0
  tooltip.visible = true
}

// Hide tooltip
const hideTooltip = () => {
  tooltip.visible = false
}
</script>

<style module>
/* Wrapper */
.heatmapWrapper {
  /* Light theme tokens */
  --brand: #a17d23;
  --surface: #ffffff;
  --surface-alt: rgba(255, 255, 255, 0.82);
  --surface-muted: rgba(161, 125, 35, 0.06);
  --surface-raised: rgba(255, 255, 255, 0.92);
  --border: rgba(161, 125, 35, 0.18);
  --border-strong: rgba(161, 125, 35, 0.32);
  --text-primary: #231f20;
  --text-secondary: #4d4d4f;
  --text-subtle: rgba(72, 78, 94, 0.75);
  --muted: #4d4d4f;
  --ink: #231f20;
  --cell-empty-bg: #f5f7fa;
  --cell-empty-border: rgba(161, 125, 35, 0.16);
  --cell-glow: rgba(161, 125, 35, 0.35);
  --grid-track: rgba(0, 0, 0, 0.05);
  --scrollbar-track: rgba(0, 0, 0, 0.05);
  --scrollbar-thumb: linear-gradient(135deg, rgba(161, 125, 35, 0.9), rgba(183, 138, 65, 0.9));
  --tooltip-surface: #ffffff;
  --tooltip-border: rgba(161, 125, 35, 0.15);
  --tooltip-text: #231f20;
  --tooltip-footer-bg: rgba(161, 125, 35, 0.08);
  --ring-muted: rgba(161, 125, 35, 0.15);
  --ring-strong: rgba(161, 125, 35, 0.35);
  --shadow-soft: rgba(15, 23, 42, 0.05);
  --shadow-strong: rgba(15, 23, 42, 0.12);
  --highlight: #ffd700;

  width: 100%;
  max-width: 100%;
  flex: 1 1 100%;
  min-width: 0;
  padding: 2rem;
  position: relative;
  background: var(--surface);
  border-radius: 16px;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px var(--shadow-soft);
  transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.heatmapWrapper[data-theme="night"] {
  --surface: rgba(27, 26, 24, 0.95);
  --surface-alt: rgba(38, 34, 31, 0.88);
  --surface-muted: rgba(94, 78, 63, 0.18);
  --surface-raised: rgba(32, 29, 25, 0.92);
  --border: rgba(229, 232, 225, 0.14);
  --border-strong: rgba(229, 232, 225, 0.24);
  --text-primary: #f5f3ee;
  --text-secondary: rgba(229, 232, 225, 0.82);
  --text-subtle: rgba(229, 232, 225, 0.65);
  --muted: rgba(229, 232, 225, 0.7);
  --ink: #f5f3ee;
  --cell-empty-bg: rgba(34, 31, 29, 0.92);
  --cell-empty-border: rgba(229, 232, 225, 0.12);
  --cell-glow: rgba(247, 208, 117, 0.4);
  --grid-track: rgba(229, 232, 225, 0.08);
  --scrollbar-track: rgba(229, 232, 225, 0.07);
  --scrollbar-thumb: linear-gradient(135deg, rgba(183, 138, 65, 0.8), rgba(161, 125, 35, 0.8));
  --tooltip-surface: rgba(32, 29, 25, 0.98);
  --tooltip-border: rgba(229, 232, 225, 0.18);
  --tooltip-text: #f5f3ee;
  --tooltip-footer-bg: rgba(229, 232, 225, 0.08);
  --ring-muted: rgba(229, 232, 225, 0.2);
  --ring-strong: rgba(229, 232, 225, 0.35);
  --shadow-soft: rgba(0, 0, 0, 0.45);
  --shadow-strong: rgba(0, 0, 0, 0.6);
  --highlight: #ffe58a;
}

/* Loading State */
.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  min-height: 400px;
}

.loadingSpinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--ring-muted);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loadingText {
  font-size: 0.95rem;
  color: var(--muted);
  font-weight: 500;
}

/* Empty State */
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 400px;
  text-align: center;
}

.emptyIcon {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--surface-muted), rgba(161, 125, 35, 0.08));
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.emptyIcon i {
  font-size: 3rem;
  color: var(--brand);
  opacity: 0.6;
}

.emptyTitle {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.emptyDescription {
  margin: 0;
  font-size: 1rem;
  color: var(--muted);
  max-width: 400px;
}

/* Stats Bar */
.statsBar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.statCard {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--surface-alt) 0%, var(--surface) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px var(--shadow-soft);
}

.statCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-strong);
  border-color: var(--border-strong);
}

.statCard i {
  font-size: 1.75rem;
  color: var(--brand);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.statCard:hover i {
  transform: scale(1.1);
  opacity: 1;
}

.statContent {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.statValue {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--ink);
  line-height: 1;
  letter-spacing: -0.5px;
}

.statLabel {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted);
  font-weight: 600;
}

/* Main Container */
.heatmapContainer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Grid Container */
.gridContainer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--surface-alt);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow-x: auto;
}

/* Time Labels (Top) */
.timeLabels {
  display: flex;
  gap: 4px;
  margin-bottom: 0.5rem;
}

.cornerLabel {
  width: 120px;
  flex-shrink: 0;
}

.timeLabel {
  width: 32px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-subtle);
  opacity: 0.85;
  text-align: center;
}
/* Grid Body */
.gridBody {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Day Row */
.dayRow {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dayLabel {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  flex-shrink: 0;
  gap: 0.5rem;
}

.dayName {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dayTotal {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--brand);
  background: var(--surface-muted);
  border: 1px solid var(--border);
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
}

/* Cells Row */
.cellsRow {
  display: flex;
  gap: 4px;
  flex: 1;
}

/* Cell */
.cell {
  width: 32px;
  height: 32px;
  position: relative;
  border-radius: 6px;
  background: var(--cell-empty-bg);
  border: 1px solid var(--cell-empty-border);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.cell:hover {
  transform: scale(1.15);
  z-index: 10;
  border-color: var(--border-strong);
  box-shadow: 0 8px 18px var(--cell-glow);
}

.cellInner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cellActive .cellInner {
  animation: cellPulse 2s ease-in-out infinite;
}

@keyframes cellPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.cellText {
  font-size: 0.7rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

/* Tooltip */
.tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: var(--tooltip-surface);
  color: var(--tooltip-text);
  padding: 0;
  border-radius: 10px;
  border: 1px solid var(--tooltip-border);
  box-shadow: 0 12px 28px var(--shadow-soft);
  pointer-events: none;
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
}

.tooltipHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--brand) 0%, #9a7335 100%);
  font-size: 0.8rem;
  font-weight: 600;
  color: #ffffff;
}

.tooltipHeader i {
  font-size: 0.85rem;
}

.tooltipBody {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  gap: 0.25rem;
}

.tooltipValue {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, var(--highlight), var(--brand));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: var(--highlight);
}

.tooltipLabel {
  font-size: 0.75rem;
  opacity: 0.8;
}

.tooltipFooter {
  padding: 0.5rem 1rem;
  background: var(--tooltip-footer-bg);
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--tooltip-text);
}

/* Tooltip Transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}

/* Scrollbar */
.gridContainer::-webkit-scrollbar {
  height: 10px;
}

.gridContainer::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 5px;
}

.gridContainer::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 5px;
  transition: background 0.3s ease;
}

.gridContainer::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .heatmapWrapper {
    padding: 1.5rem;
  }

  .cell {
    width: 28px;
    height: 28px;
  }

  .timeLabel {
    width: 28px;
  }

  .dayLabel {
    width: 100px;
  }
}

@media (max-width: 768px) {
  .heatmapWrapper {
    padding: 1rem;
  }

  .statsBar {
    grid-template-columns: 1fr;
  }

  .cell {
    width: 24px;
    height: 24px;
  }

  .timeLabel {
    width: 24px;
    font-size: 0.6rem;
  }

  .dayLabel {
    width: 80px;
    padding: 0 0.5rem;
  }

  .dayName {
    font-size: 0.7rem;
  }

  .dayTotal {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }

  .cellText {
    font-size: 0.6rem;
  }

  .gridContainer {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .cell {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .timeLabel {
    width: 20px;
    font-size: 0.55rem;
  }

  .dayLabel {
    width: 70px;
  }

  .dayName {
    font-size: 0.65rem;
  }

  .cellText {
    font-size: 0.55rem;
  }

  .gradientStep {
    width: 20px;
    height: 20px;
  }

  .statValue {
    font-size: 1.5rem;
  }

  .statCard {
    padding: 1rem;
  }
}

/* RTL Support */
.heatmapWrapper[dir="rtl"] .dayLabel {
  flex-direction: row-reverse;
}

.heatmapWrapper[dir="rtl"] .statCard {
  flex-direction: row-reverse;
}

.heatmapWrapper[dir="rtl"] .legendScale {
  flex-direction: row-reverse;
}
</style>

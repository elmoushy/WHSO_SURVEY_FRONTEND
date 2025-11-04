<template>
  <div :class="$style.heatmapContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.heatmapHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-fire"></i>
      </div>
      <div :class="$style.headerContent">
        <h3 :class="$style.headerTitle">{{ isRTL ? 'خريطة النشاط الحرارية' : 'Response Heatmap' }}</h3>
        <p :class="$style.headerSubtitle">{{ isRTL ? 'توزيع الردود حسب اليوم والساعة' : 'Response distribution by day and hour' }}</p>
      </div>
    </div>

    <div v-if="!hasData" :class="$style.noData">
      <i class="fas fa-chart-bar"></i>
      <p>{{ isRTL ? 'لا توجد بيانات كافية لعرض الخريطة الحرارية' : 'No data available for heatmap' }}</p>
    </div>

    <div v-else :class="$style.heatmapContent">
      <!-- Heatmap Grid -->
      <div :class="$style.heatmapWrapper">
        <div :class="$style.heatmapGrid">
          <!-- Hour labels (top) -->
          <div :class="$style.hourLabels">
            <div :class="$style.cornerCell"></div>
            <div 
              v-for="hour in 24" 
              :key="`hour-${hour-1}`" 
              :class="$style.hourLabel"
              :title="`${hour-1}:00`"
            >
              {{ formatHour(hour - 1) }}
            </div>
            <div :class="$style.totalLabel">{{ isRTL ? 'المجموع' : 'Total' }}</div>
          </div>

          <!-- Day rows -->
          <div 
            v-for="(day, dayIndex) in dayNames" 
            :key="`day-${dayIndex}`"
            :class="$style.dayRow"
          >
            <div :class="$style.dayLabel">{{ day }}</div>
            <div 
              v-for="hour in 24" 
              :key="`cell-${dayIndex}-${hour-1}`"
              :class="[$style.heatCell, $style[getHeatClass(heatmap.matrix[dayIndex][hour - 1])]]"
              :title="getTooltip(dayIndex, hour - 1)"
            >
              <span v-if="heatmap.matrix[dayIndex][hour - 1] > 0">
                {{ heatmap.matrix[dayIndex][hour - 1] }}
              </span>
            </div>
            <div :class="$style.totalCell">
              {{ heatmap.totals_by_day[dayIndex] }}
            </div>
          </div>

          <!-- Hour totals (bottom) -->
          <div :class="$style.totalRow">
            <div :class="$style.totalLabel">{{ isRTL ? 'المجموع' : 'Total' }}</div>
            <div 
              v-for="hour in 24" 
              :key="`total-${hour-1}`"
              :class="$style.totalCell"
            >
              {{ heatmap.totals_by_hour[hour - 1] }}
            </div>
            <div :class="$style.grandTotal">
              {{ grandTotal }}
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div :class="$style.legend">
        <div :class="$style.legendTitle">{{ isRTL ? 'كثافة الردود' : 'Response Intensity' }}</div>
        <div :class="$style.legendScale">
          <div :class="[$style.legendItem, $style.none]">
            <div :class="$style.legendBox"></div>
            <span>{{ isRTL ? 'لا شيء' : 'None' }}</span>
          </div>
          <div :class="[$style.legendItem, $style.low]">
            <div :class="$style.legendBox"></div>
            <span>{{ isRTL ? 'قليل' : 'Low' }}</span>
          </div>
          <div :class="[$style.legendItem, $style.medium]">
            <div :class="$style.legendBox"></div>
            <span>{{ isRTL ? 'متوسط' : 'Medium' }}</span>
          </div>
          <div :class="[$style.legendItem, $style.high]">
            <div :class="$style.legendBox"></div>
            <span>{{ isRTL ? 'عالي' : 'High' }}</span>
          </div>
          <div :class="[$style.legendItem, $style.veryHigh]">
            <div :class="$style.legendBox"></div>
            <span>{{ isRTL ? 'عالي جداً' : 'Very High' }}</span>
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div :class="$style.insights">
        <div :class="$style.insightCard">
          <i class="fas fa-calendar-day"></i>
          <div>
            <div :class="$style.insightLabel">{{ isRTL ? 'أكثر يوم نشاطاً' : 'Busiest Day' }}</div>
            <div :class="$style.insightValue">{{ busiestDay }}</div>
          </div>
        </div>
        <div :class="$style.insightCard">
          <i class="fas fa-clock"></i>
          <div>
            <div :class="$style.insightLabel">{{ isRTL ? 'أكثر ساعة نشاطاً' : 'Peak Hour' }}</div>
            <div :class="$style.insightValue">{{ peakHour }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { HeatmapData } from '../../types/survey.types'

interface Props {
  heatmap: HeatmapData
}

const props = defineProps<Props>()
const store = useAppStore()

const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

const dayNames = computed(() => {
  if (isRTL.value) {
    return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  }
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
})

const hasData = computed(() => {
  return props.heatmap?.matrix && 
         props.heatmap.matrix.length === 7 && 
         props.heatmap.matrix.some(row => row.some(val => val > 0))
})

const grandTotal = computed(() => {
  return props.heatmap?.totals_by_day?.reduce((sum, val) => sum + val, 0) || 0
})

const maxValue = computed(() => {
  if (!props.heatmap?.matrix) return 0
  return Math.max(...props.heatmap.matrix.flat())
})

const busiestDay = computed(() => {
  if (!props.heatmap?.totals_by_day) return '-'
  const maxDayValue = Math.max(...props.heatmap.totals_by_day)
  const dayIndex = props.heatmap.totals_by_day.indexOf(maxDayValue)
  return dayNames.value[dayIndex] || '-'
})

const peakHour = computed(() => {
  if (!props.heatmap?.totals_by_hour) return '-'
  const maxHourValue = Math.max(...props.heatmap.totals_by_hour)
  const hourIndex = props.heatmap.totals_by_hour.indexOf(maxHourValue)
  return formatHourFull(hourIndex)
})

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  if (hour < 12) return `${hour}am`
  return `${hour - 12}pm`
}

const formatHourFull = (hour: number): string => {
  if (isRTL.value) {
    return `${hour}:00`
  }
  if (hour === 0) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

const getHeatClass = (value: number): string => {
  if (value === 0) return ''
  if (maxValue.value === 0) return ''
  
  const percentage = (value / maxValue.value) * 100
  
  if (percentage >= 80) return 'veryHigh'
  if (percentage >= 60) return 'high'
  if (percentage >= 40) return 'medium'
  if (percentage >= 20) return 'low'
  return 'veryLow'
}

const getTooltip = (dayIndex: number, hour: number): string => {
  const count = props.heatmap.matrix[dayIndex][hour]
  const day = dayNames.value[dayIndex]
  const hourStr = formatHourFull(hour)
  
  if (isRTL.value) {
    return `${day}، ${hourStr}: ${count} ${count === 1 ? 'رد' : 'ردود'}`
  }
  return `${day}, ${hourStr}: ${count} ${count === 1 ? 'response' : 'responses'}`
}
</script>

<style module>
.heatmapContainer {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.heatmapContainer[data-theme="night"] {
  background: #2d2d2d;
}

.heatmapHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.headerIcon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
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

.heatmapContainer[data-theme="night"] .headerTitle {
  color: #f1f1f1;
}

.headerSubtitle {
  font-size: 0.875rem;
  color: #5f6368;
  margin: 0;
}

.heatmapContainer[data-theme="night"] .headerSubtitle {
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
  margin: 0;
  font-size: 0.938rem;
}

.heatmapContent {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.heatmapWrapper {
  overflow-x: auto;
}

.heatmapGrid {
  display: inline-block;
  min-width: 100%;
}

.hourLabels {
  display: grid;
  grid-template-columns: 80px repeat(24, 40px) 60px;
  gap: 2px;
  margin-bottom: 2px;
}

.cornerCell {
  background: transparent;
}

.hourLabel {
  font-size: 0.688rem;
  color: #5f6368;
  text-align: center;
  padding: 0.25rem;
  font-weight: 500;
}

.heatmapContainer[data-theme="night"] .hourLabel {
  color: #9aa0a6;
}

.dayRow {
  display: grid;
  grid-template-columns: 80px repeat(24, 40px) 60px;
  gap: 2px;
  margin-bottom: 2px;
}

.dayLabel {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  font-size: 0.813rem;
  font-weight: 500;
  color: #202124;
}

.heatmapContainer[data-theme="night"] .dayLabel {
  color: #e8e8e8;
}

.heatCell {
  aspect-ratio: 1;
  background: #f0f0f0;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.688rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.heatmapContainer[data-theme="night"] .heatCell {
  background: #1a1a1a;
  color: rgba(255, 255, 255, 0.7);
}

.heatCell:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.heatCell.veryLow {
  background: #fee;
  color: #c00;
}

.heatCell.low {
  background: #fcc;
  color: #900;
}

.heatCell.medium {
  background: #f99;
  color: #600;
}

.heatCell.high {
  background: #f66;
  color: #fff;
}

.heatCell.veryHigh {
  background: #f33;
  color: #fff;
}

.totalRow {
  display: grid;
  grid-template-columns: 80px repeat(24, 40px) 60px;
  gap: 2px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e0e0e0;
}

.heatmapContainer[data-theme="night"] .totalRow {
  border-top-color: #404040;
}

.totalLabel {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #5f6368;
}

.heatmapContainer[data-theme="night"] .totalLabel {
  color: #9aa0a6;
}

.totalCell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #202124;
  background: #f8f9fa;
  border-radius: 0.25rem;
  padding: 0.25rem;
}

.heatmapContainer[data-theme="night"] .totalCell {
  background: #343a40;
  color: #e8e8e8;
}

.grandTotal {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background: #B78A41;
  border-radius: 0.375rem;
  padding: 0.25rem;
}

.legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
}

.heatmapContainer[data-theme="night"] .legend {
  background: #1a1a1a;
}

.legendTitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #202124;
}

.heatmapContainer[data-theme="night"] .legendTitle {
  color: #e8e8e8;
}

.legendScale {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legendBox {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
}

.legendItem.none .legendBox {
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
}

.legendItem.low .legendBox {
  background: #fcc;
}

.legendItem.medium .legendBox {
  background: #f99;
}

.legendItem.high .legendBox {
  background: #f66;
}

.legendItem.veryHigh .legendBox {
  background: #f33;
}

.legendItem span {
  font-size: 0.813rem;
  color: #5f6368;
}

.heatmapContainer[data-theme="night"] .legendItem span {
  color: #9aa0a6;
}

.insights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.insightCard {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  border-left: 3px solid #B78A41;
}

.heatmapContainer[data-theme="night"] .insightCard {
  background: #343a40;
}

.insightCard[dir="rtl"] {
  border-left: none;
  border-right: 3px solid #B78A41;
}

.insightCard i {
  font-size: 1.5rem;
  color: #B78A41;
}

.insightLabel {
  font-size: 0.75rem;
  color: #5f6368;
  margin-bottom: 0.25rem;
}

.heatmapContainer[data-theme="night"] .insightLabel {
  color: #9aa0a6;
}

.insightValue {
  font-size: 1rem;
  font-weight: 600;
  color: #202124;
}

.heatmapContainer[data-theme="night"] .insightValue {
  color: #f1f1f1;
}

@media (max-width: 768px) {
  .heatmapContainer {
    padding: 1rem;
  }
  
  .heatmapWrapper {
    margin: 0 -1rem;
    padding: 0 1rem;
  }
  
  .hourLabels,
  .dayRow,
  .totalRow {
    grid-template-columns: 60px repeat(24, 32px) 48px;
  }
  
  .heatCell,
  .totalCell {
    font-size: 0.625rem;
  }
  
  .insights {
    grid-template-columns: 1fr;
  }
}
</style>

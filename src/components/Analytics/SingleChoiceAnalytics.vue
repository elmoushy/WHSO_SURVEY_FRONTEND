<template>
  <div :class="$style.singleChoiceAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
    </div>

    <div v-else-if="!analytics || !analytics.options" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-dot-circle"></i>
      </div>
      <p :class="$style.emptyText">{{ t('survey.analytics.noAnalyticsData') }}</p>
    </div>

    <div v-else :class="$style.analyticsContent">
      <!-- Summary Stats -->
      <div :class="$style.summarySection">
        <div :class="$style.summaryGrid">
          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-users" style="color: #4CAF50;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatNumber(analytics.total_responses) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.totalResponses') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-star" style="color: #FF9800;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ analytics.top_choice?.option_text || '—' }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.topChoice') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Options Chart and List -->
      <div :class="$style.optionsSection">
        <div :class="$style.chartContainer">
          <DonutChart
            :data="chartData"
            :colors="optionColors"
            :labels="optionLabels"
            :loading="loading"
            @segment-click="onOptionClick"
          />
        </div>

        <div :class="$style.optionsList">
          <div :class="$style.optionsHeader">
            <h4 :class="$style.optionsTitle">{{ t('survey.analytics.responseBreakdown') }}</h4>
          </div>
          
          <div :class="$style.optionsGrid">
            <div
              v-for="(option, index) in sortedOptions"
              :key="option.option_id || index"
              :class="$style.optionItem"
              @click="onOptionClick(option, index)"
            >
              <div :class="$style.optionHeader">
                <div
                  :class="$style.optionColor"
                  :style="{ backgroundColor: optionColors[index] }"
                ></div>
                <div :class="$style.optionText">{{ option.option_text }}</div>
                <div :class="$style.optionBadge">
                  {{ formatPercentage(option.percentage) }}
                </div>
              </div>
              
              <div :class="$style.optionBar">
                <div
                  :class="$style.optionBarFill"
                  :style="{
                    width: `${option.percentage * 100}%`,
                    backgroundColor: optionColors[index]
                  }"
                ></div>
              </div>
              
              <div :class="$style.optionStats">
                <div :class="$style.optionCount">
                  <i class="fas fa-users"></i>
                  <span>{{ formatNumber(option.count) }} {{ t('survey.analytics.responses') }}</span>
                </div>
                <div v-if="option.count > 0" :class="$style.optionRank">
                  #{{ index + 1 }}
                </div>
              </div>
            </div>
          </div>

          <!-- No responses message -->
          <div v-if="sortedOptions.length === 0" :class="$style.noOptions">
            <div :class="$style.noOptionsIcon">
              <i class="fas fa-inbox"></i>
            </div>
            <p :class="$style.noOptionsText">{{ t('survey.analytics.noResponsesYet') }}</p>
          </div>
        </div>
      </div>

      <!-- Insights Section -->
      <div v-if="insights.length > 0" :class="$style.insightsSection">
        <div :class="$style.insightsHeader">
          <h4 :class="$style.insightsTitle">{{ t('survey.analytics.insights') }}</h4>
        </div>
        
        <div :class="$style.insightsGrid">
          <div
            v-for="(insight, index) in insights"
            :key="index"
            :class="$style.insightCard"
          >
            <div :class="$style.insightIcon">
              <i :class="insight.icon" :style="`color: ${insight.color}`"></i>
            </div>
            <div :class="$style.insightContent">
              <h5 :class="$style.insightTitle">{{ insight.title }}</h5>
              <p :class="$style.insightText">{{ insight.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import DonutChart from './DonutChart.vue'

// Props
interface Props {
  analytics: {
    options: Array<{
      option_id: string
      option_text: string
      count: number
      percentage: number
    }>
    total_responses: number
    top_choice?: {
      option_text: string
      count: number
      percentage: number
    }
  }
  question?: any
  loading?: boolean
  detailed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  detailed: false
})

// Emits
const emit = defineEmits<{
  optionClick: [option: any, index: number]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Color palette for options
const optionColors = [
  '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', 
  '#795548', '#607D8B', '#FF5722', '#3F51B5', '#009688',
  '#CDDC39', '#FFC107', '#E91E63', '#8BC34A', '#00BCD4'
]

// Computed data
const sortedOptions = computed(() => {
  if (!props.analytics?.options) return []
  
  return [...props.analytics.options].sort((a, b) => b.count - a.count)
})

const chartData = computed(() => {
  return sortedOptions.value.map(option => ({
    value: option.count,
    percentage: option.percentage
  }))
})

const optionLabels = computed(() => {
  return sortedOptions.value.map(option => option.option_text)
})

const insights = computed(() => {
  if (!props.analytics?.options || props.analytics.options.length === 0) return []
  
  const insights = []
  const options = sortedOptions.value
  const total = props.analytics.total_responses
  
  // Top choice insight
  if (options.length > 0 && options[0].count > 0) {
    const topOption = options[0]
    insights.push({
      icon: 'fas fa-trophy',
      color: '#FF9800',
      title: t.value('survey.analytics.mostPopular'),
      text: `"${topOption.option_text}" ${t.value('survey.analytics.selectedBy')} ${formatPercentage(topOption.percentage)} ${t.value('survey.analytics.ofRespondents')}`
    })
  }

  // Participation rate insight
  if (total > 0) {
    const responseCount = options.reduce((sum, opt) => sum + opt.count, 0)
    const responseRate = responseCount / total
    
    if (responseRate < 0.5) {
      insights.push({
        icon: 'fas fa-exclamation-triangle',
        color: '#F44336',
        title: t.value('survey.analytics.lowResponse'),
        text: t.value('survey.analytics.lowResponseText')
      })
    } else if (responseRate > 0.9) {
      insights.push({
        icon: 'fas fa-check-circle',
        color: '#4CAF50',
        title: t.value('survey.analytics.highResponse'),
        text: t.value('survey.analytics.highResponseText')
      })
    }
  }

  // Distribution insight
  if (options.length >= 2) {
    const topTwo = options.slice(0, 2)
    const difference = topTwo[0].percentage - topTwo[1].percentage
    
    if (difference < 0.05) {
      insights.push({
        icon: 'fas fa-balance-scale',
        color: '#2196F3',
        title: t.value('survey.analytics.closeCompetition'),
        text: t.value('survey.analytics.closeCompetitionText')
      })
    } else if (difference > 0.5) {
      insights.push({
        icon: 'fas fa-chart-line',
        color: '#9C27B0',
        title: t.value('survey.analytics.clearWinner'),
        text: t.value('survey.analytics.clearWinnerText')
      })
    }
  }

  return insights
})

// Methods
const formatNumber = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

const onOptionClick = (option: any, index: number) => {
  emit('optionClick', option, index)
}
</script>

<style module>
.singleChoiceAnalytics {
  padding: 0;
}

.loadingContainer,
.emptyContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
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

.analyticsContent {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Summary Section */
.summarySection {
  background: var(--surface-variant);
  border-radius: 8px;
  padding: 16px;
}

.summaryGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summaryCard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summaryIcon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(161, 125, 35, 0.1);
  font-size: 14px;
}

.summaryContent {
  flex: 1;
  min-width: 0;
}

.summaryNumber {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summaryLabel {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Options Section */
.optionsSection {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 32px;
  align-items: start;
}

.chartContainer {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  height: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.optionsList {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.optionsHeader {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.optionsTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.optionsGrid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.optionItem {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.optionItem:hover {
  border-color: var(--brand);
  background: var(--surface-variant);
  transform: translateX(4px);
}

.optionHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.optionColor {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.optionText {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.optionBadge {
  background: var(--brand);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  flex-shrink: 0;
}

.optionBar {
  width: 100%;
  height: 6px;
  background: var(--surface-variant);
  border-radius: 3px;
  margin-bottom: 8px;
  overflow: hidden;
}

.optionBarFill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.optionStats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.optionCount {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--muted);
}

.optionCount i {
  font-size: 10px;
}

.optionRank {
  color: var(--brand);
  font-weight: 600;
}

.noOptions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--muted);
}

.noOptionsIcon {
  font-size: 32px;
  opacity: 0.5;
}

.noOptionsText {
  margin: 0;
  font-size: 14px;
}

/* Insights Section */
.insightsSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.insightsHeader {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.insightsTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.insightsGrid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insightCard {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 8px;
}

.insightIcon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(161, 125, 35, 0.1);
  border-radius: 50%;
  font-size: 14px;
  flex-shrink: 0;
}

.insightContent {
  flex: 1;
}

.insightTitle {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.insightText {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .optionsSection {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .chartContainer {
    height: 250px;
  }
}

@media (max-width: 768px) {
  .summaryGrid {
    grid-template-columns: 1fr;
  }
  
  .optionItem {
    padding: 12px;
  }
  
  .optionText {
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
  }
  
  .insightCard {
    padding: 12px;
  }
}

/* Dark Theme */
.singleChoiceAnalytics[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
}

/* RTL Support */
.singleChoiceAnalytics[dir="rtl"] .optionItem:hover {
  transform: translateX(-4px);
}

.singleChoiceAnalytics[dir="rtl"] .optionHeader {
  flex-direction: row-reverse;
}

.singleChoiceAnalytics[dir="rtl"] .optionStats {
  flex-direction: row-reverse;
}

.singleChoiceAnalytics[dir="rtl"] .insightCard {
  flex-direction: row-reverse;
}
</style>

<template>
  <div :class="$style.multipleChoiceAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
    </div>

    <div v-else-if="!analytics || !analytics.options" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-check-square"></i>
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
              <i class="fas fa-chart-bar" style="color: #2196F3;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatNumber(analytics.total_selections) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.totalSelections') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-calculator" style="color: #FF9800;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatDecimal(analytics.avg_selections_per_respondent) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.avgSelectionsPerUser') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-star" style="color: #9C27B0;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ analytics.most_popular?.option_text || '—' }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.mostPopular') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Options Chart and List -->
      <div :class="$style.optionsSection">
        <div :class="$style.chartContainer">
          <div :class="$style.chartHeader">
            <h4 :class="$style.chartTitle">{{ t('survey.analytics.selectionFrequency') }}</h4>
          </div>
          <HorizontalBarChart
            :data="chartData"
            :colors="optionColors"
            :labels="optionLabels"
            :loading="loading"
            @bar-click="onOptionClick"
          />
        </div>

        <div :class="$style.optionsList">
          <div :class="$style.optionsHeader">
            <h4 :class="$style.optionsTitle">{{ t('survey.analytics.detailedBreakdown') }}</h4>
            <div :class="$style.sortControls">
              <button 
                :class="[$style.sortButton, { [$style.active]: sortBy === 'popularity' }]"
                @click="sortBy = 'popularity'"
              >
                <i class="fas fa-sort-amount-down"></i>
                {{ t('survey.analytics.byPopularity') }}
              </button>
              <button 
                :class="[$style.sortButton, { [$style.active]: sortBy === 'alphabetical' }]"
                @click="sortBy = 'alphabetical'"
              >
                <i class="fas fa-sort-alpha-down"></i>
                {{ t('survey.analytics.alphabetical') }}
              </button>
            </div>
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
                  {{ formatPercentage(option.selection_percentage) }}
                </div>
              </div>
              
              <div :class="$style.optionStats">
                <div :class="$style.statRow">
                  <span :class="$style.statLabel">{{ t('survey.analytics.timesSelected') }}:</span>
                  <span :class="$style.statValue">{{ formatNumber(option.selection_count) }}</span>
                </div>
                <div :class="$style.statRow">
                  <span :class="$style.statLabel">{{ t('survey.analytics.byUsers') }}:</span>
                  <span :class="$style.statValue">{{ formatNumber(option.respondent_count) }}</span>
                </div>
                <div :class="$style.statRow">
                  <span :class="$style.statLabel">{{ t('survey.analytics.responseRate') }}:</span>
                  <span :class="$style.statValue">{{ formatPercentage(option.respondent_percentage) }}</span>
                </div>
              </div>
              
              <div :class="$style.optionBar">
                <div
                  :class="$style.optionBarFill"
                  :style="{
                    width: `${option.selection_percentage * 100}%`,
                    backgroundColor: optionColors[index]
                  }"
                ></div>
              </div>
              
              <div :class="$style.optionRank">
                #{{ getRank(option, index) }}
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

      <!-- Distribution Analysis -->
      <div :class="$style.distributionSection">
        <div :class="$style.distributionHeader">
          <h4 :class="$style.distributionTitle">{{ t('survey.analytics.selectionDistribution') }}</h4>
        </div>
        
        <div :class="$style.distributionGrid">
          <div :class="$style.distributionCard">
            <div :class="$style.distributionIcon">
              <i class="fas fa-users" style="color: #4CAF50;"></i>
            </div>
            <div :class="$style.distributionContent">
              <div :class="$style.distributionNumber">{{ usersWithSingleSelection }}</div>
              <div :class="$style.distributionLabel">{{ t('survey.analytics.singleSelection') }}</div>
            </div>
          </div>

          <div :class="$style.distributionCard">
            <div :class="$style.distributionIcon">
              <i class="fas fa-layer-group" style="color: #2196F3;"></i>
            </div>
            <div :class="$style.distributionContent">
              <div :class="$style.distributionNumber">{{ usersWithMultipleSelections }}</div>
              <div :class="$style.distributionLabel">{{ t('survey.analytics.multipleSelections') }}</div>
            </div>
          </div>

          <div :class="$style.distributionCard">
            <div :class="$style.distributionIcon">
              <i class="fas fa-crown" style="color: #FF9800;"></i>
            </div>
            <div :class="$style.distributionContent">
              <div :class="$style.distributionNumber">{{ maxSelectionsCount }}</div>
              <div :class="$style.distributionLabel">{{ t('survey.analytics.maxSelections') }}</div>
            </div>
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
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import HorizontalBarChart from './HorizontalBarChart.vue'

// Props
interface Props {
  analytics: {
    options: Array<{
      option_id: string
      option_text: string
      selection_count: number
      selection_percentage: number
      respondent_count: number
      respondent_percentage: number
    }>
    total_responses: number
    total_selections: number
    avg_selections_per_respondent: number
    most_popular?: {
      option_text: string
      selection_count: number
      selection_percentage: number
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

// State
const sortBy = ref<'popularity' | 'alphabetical'>('popularity')

// Color palette for options
const optionColors = [
  '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', 
  '#795548', '#607D8B', '#FF5722', '#3F51B5', '#009688',
  '#CDDC39', '#FFC107', '#E91E63', '#8BC34A', '#00BCD4'
]

// Computed data
const sortedOptions = computed(() => {
  if (!props.analytics?.options) return []
  
  const options = [...props.analytics.options]
  
  if (sortBy.value === 'popularity') {
    return options.sort((a, b) => b.selection_count - a.selection_count)
  } else {
    return options.sort((a, b) => a.option_text.localeCompare(b.option_text))
  }
})

const chartData = computed(() => {
  return sortedOptions.value.map(option => ({
    value: option.selection_count,
    percentage: option.selection_percentage
  }))
})

const optionLabels = computed(() => {
  return sortedOptions.value.map(option => option.option_text)
})

// Distribution calculations
const usersWithSingleSelection = computed(() => {
  if (!props.analytics?.total_responses || !props.analytics?.avg_selections_per_respondent) return 0
  
  // Rough estimate based on available data
  const avgSelections = props.analytics.avg_selections_per_respondent
  const totalResponses = props.analytics.total_responses
  
  if (avgSelections <= 1.1) {
    return Math.round(totalResponses * 0.8) // Most users selected only one
  }
  
  return Math.round(totalResponses * (2 - avgSelections)) // Inverse relationship
})

const usersWithMultipleSelections = computed(() => {
  return props.analytics.total_responses - usersWithSingleSelection.value
})

const maxSelectionsCount = computed(() => {
  if (!props.analytics?.options) return 0
  
  // Find the theoretical maximum based on the highest selection count
  const maxCount = Math.max(...props.analytics.options.map(opt => opt.selection_count))
  const totalResponses = props.analytics.total_responses
  
  // Estimate max selections per user
  return Math.ceil(maxCount / Math.max(totalResponses * 0.1, 1))
})

const insights = computed(() => {
  if (!props.analytics?.options || props.analytics.options.length === 0) return []
  
  const insights = []
  const options = sortedOptions.value
  const avgSelections = props.analytics.avg_selections_per_respondent || 0
  
  // Selection behavior insight
  if (avgSelections < 1.5) {
    insights.push({
      icon: 'fas fa-user-check',
      color: '#4CAF50',
      title: t.value('survey.analytics.selectiveBehavior'),
      text: t.value('survey.analytics.selectiveBehaviorText')
    })
  } else if (avgSelections > 3) {
    insights.push({
      icon: 'fas fa-layer-group',
      color: '#2196F3',
      title: t.value('survey.analytics.comprehensiveBehavior'),
      text: t.value('survey.analytics.comprehensiveBehaviorText')
    })
  }

  // Popular option insight
  if (options.length > 0) {
    const topOption = options[0]
    insights.push({
      icon: 'fas fa-trophy',
      color: '#FF9800',
      title: t.value('survey.analytics.topChoice'),
      text: `"${topOption.option_text}" ${t.value('survey.analytics.selectedBy')} ${formatNumber(topOption.respondent_count)} ${t.value('survey.analytics.users')}`
    })
  }

  // Distribution insight
  if (options.length >= 2) {
    const topTwo = options.slice(0, 2)
    const difference = topTwo[0].selection_count - topTwo[1].selection_count
    
    if (difference < props.analytics.total_responses * 0.05) {
      insights.push({
        icon: 'fas fa-balance-scale',
        color: '#9C27B0',
        title: t.value('survey.analytics.evenDistribution'),
        text: t.value('survey.analytics.evenDistributionText')
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

const formatDecimal = (value: number) => {
  if (!value && value !== 0) return '0.0'
  return value.toFixed(1)
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

const getRank = (option: any, index: number) => {
  if (sortBy.value === 'popularity') {
    return index + 1
  }
  
  // For alphabetical sort, calculate rank based on selection count
  const sortedByPopularity = [...props.analytics.options].sort((a, b) => b.selection_count - a.selection_count)
  return sortedByPopularity.findIndex(opt => opt.option_id === option.option_id) + 1
}

const onOptionClick = (option: any, index: number) => {
  emit('optionClick', option, index)
}
</script>

<style module src="./SingleChoiceAnalytics.vue">
/* Reuse styles from SingleChoiceAnalytics */
</style>

<style module>
/* Additional styles specific to multiple choice */
.sortControls {
  display: flex;
  gap: 8px;
}

.sortButton {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--surface-variant);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.sortButton:hover,
.sortButton.active {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

.statRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.statLabel {
  color: var(--muted);
}

.statValue {
  color: var(--ink);
  font-weight: 600;
}

.distributionSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.distributionHeader {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.distributionTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.distributionGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.distributionCard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.distributionIcon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(161, 125, 35, 0.1);
  font-size: 14px;
}

.distributionContent {
  flex: 1;
}

.distributionNumber {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
}

.distributionLabel {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>

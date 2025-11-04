<template>
  <div :class="$style.yesNoAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
    </div>

    <div v-else-if="!analytics || !analytics.distribution" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-question-circle"></i>
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
              <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ yesCount }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.yesResponses') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-times-circle" style="color: #F44336;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ noCount }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.noResponses') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-percentage" style="color: '#2196F3';"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatPercentage(yesPercentage) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.agreementRate') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visual Representation -->
      <div :class="$style.visualSection">
        <div :class="$style.visualGrid">
          <!-- Large Binary Indicator -->
          <div :class="$style.binaryIndicator">
            <div :class="$style.indicatorHeader">
              <h4 :class="$style.indicatorTitle">{{ t('survey.analytics.overallResult') }}</h4>
            </div>
            
            <div :class="$style.indicatorContent">
              <div 
                :class="[$style.indicatorIcon, majorityIsYes ? $style.iconYes : $style.iconNo]"
              >
                <i :class="majorityIsYes ? 'fas fa-thumbs-up' : 'fas fa-thumbs-down'"></i>
              </div>
              
              <div :class="$style.indicatorText">
                <div :class="$style.indicatorResult">
                  {{ majorityIsYes ? t('survey.analytics.majorityYes') : t('survey.analytics.majorityNo') }}
                </div>
                <div :class="$style.indicatorSubtext">
                  {{ majorityText }}
                </div>
              </div>
            </div>
          </div>

          <!-- Donut Chart -->
          <div :class="$style.chartContainer">
            <DonutChart
              :data="chartData"
              :colors="['#4CAF50', '#F44336']"
              :width="200"
              :height="200"
              :show-legend="true"
              :show-percentages="true"
              @segment-click="onSegmentClick"
            />
          </div>
        </div>
      </div>

      <!-- Detailed Analysis -->
      <div :class="$style.detailsSection">
        <div :class="$style.detailsGrid">
          <!-- Yes Analysis -->
          <div :class="$style.detailCard" :style="{ borderTop: '4px solid #4CAF50' }">
            <div :class="$style.detailHeader">
              <div :class="$style.detailIcon" style="background-color: rgba(76, 175, 80, 0.1);">
                <i class="fas fa-check" style="color: #4CAF50;"></i>
              </div>
              <div :class="$style.detailTitle">{{ t('survey.analytics.yesAnalysis') }}</div>
            </div>
            
            <div :class="$style.detailContent">
              <div :class="$style.detailStat">
                <span :class="$style.detailStatLabel">{{ t('survey.analytics.count') }}:</span>
                <span :class="$style.detailStatValue">{{ formatNumber(yesCount) }}</span>
              </div>
              <div :class="$style.detailStat">
                <span :class="$style.detailStatLabel">{{ t('survey.analytics.percentage') }}:</span>
                <span :class="$style.detailStatValue">{{ formatPercentage(yesPercentage) }}</span>
              </div>
              <div :class="$style.detailStat">
                <span :class="$style.detailStatLabel">{{ t('survey.analytics.confidence') }}:</span>
                <span :class="$style.detailStatValue">{{ getConfidenceLevel(yesPercentage) }}</span>
              </div>
            </div>
          </div>

          <!-- No Analysis -->
          <div :class="$style.detailCard" :style="{ borderTop: '4px solid #F44336' }">
            <div :class="$style.detailHeader">
              <div :class="$style.detailIcon" style="background-color: rgba(244, 67, 54, 0.1);">
                <i class="fas fa-times" style="color: #F44336;"></i>
              </div>
              <div :class="$style.detailTitle">{{ t('survey.analytics.noAnalysis') }}</div>
            </div>
            
            <div :class="$style.detailContent">
              <div :class="$style.detailStat">
                <span :class="$style.detailStatLabel">{{ t('survey.analytics.count') }}:</span>
                <span :class="$style.detailStatValue">{{ formatNumber(noCount) }}</span>
              </div>
              <div :class="$style.detailStat">
                <span :class="$style.detailStatLabel">{{ t('survey.analytics.percentage') }}:</span>
                <span :class="$style.detailStatValue">{{ formatPercentage(noPercentage) }}</span>
              </div>
              <div :class="$style.detailStat">
                <span :class="$style.detailStatLabel">{{ t('survey.analytics.confidence') }}:</span>
                <span :class="$style.detailStatValue">{{ getConfidenceLevel(noPercentage) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistical Significance -->
      <div v-if="analytics.total_responses >= 30" :class="$style.statisticsSection">
        <div :class="$style.statisticsHeader">
          <h4 :class="$style.statisticsTitle">{{ t('survey.analytics.statisticalAnalysis') }}</h4>
        </div>
        
        <div :class="$style.statisticsContent">
          <div :class="$style.statisticsGrid">
            <div :class="$style.statisticCard">
              <div :class="$style.statisticIcon">
                <i class="fas fa-chart-line" style="color: #2196F3;"></i>
              </div>
              <div :class="$style.statisticContent">
                <div :class="$style.statisticLabel">{{ t('survey.analytics.marginOfError') }}</div>
                <div :class="$style.statisticValue">±{{ formatPercentage(marginOfError) }}</div>
              </div>
            </div>

            <div :class="$style.statisticCard">
              <div :class="$style.statisticIcon">
                <i class="fas fa-balance-scale" style="color: #9C27B0;"></i>
              </div>
              <div :class="$style.statisticContent">
                <div :class="$style.statisticLabel">{{ t('survey.analytics.confidenceInterval') }}</div>
                <div :class="$style.statisticValue">95%</div>
              </div>
            </div>

            <div :class="$style.statisticCard">
              <div :class="$style.statisticIcon">
                <i class="fas fa-users" style="color: #FF9800;"></i>
              </div>
              <div :class="$style.statisticContent">
                <div :class="$style.statisticLabel">{{ t('survey.analytics.sampleSize') }}</div>
                <div :class="$style.statisticValue">{{ formatNumber(analytics.total_responses) }}</div>
              </div>
            </div>

            <div :class="$style.statisticCard">
              <div :class="$style.statisticIcon">
                <i class="fas fa-shield-alt" style="color: #4CAF50;"></i>
              </div>
              <div :class="$style.statisticContent">
                <div :class="$style.statisticLabel">{{ t('survey.analytics.reliability') }}</div>
                <div :class="$style.statisticValue">{{ getReliabilityLevel() }}</div>
              </div>
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
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import DonutChart from './DonutChart.vue'

// Props
interface Props {
  analytics: {
    distribution: Array<{
      option: string
      count: number
      percentage: number
    }>
    total_responses: number
    response_rate?: number
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
  segmentClick: [segment: any]
  responseClick: [response: string]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Response calculations
const yesCount = computed(() => {
  if (!props.analytics?.distribution) return 0
  const yesResponse = props.analytics.distribution.find(d => 
    d.option.toLowerCase().includes('yes') || 
    d.option.toLowerCase().includes('true') ||
    d.option.toLowerCase() === '1'
  )
  return yesResponse?.count || 0
})

const noCount = computed(() => {
  if (!props.analytics?.distribution) return 0
  const noResponse = props.analytics.distribution.find(d => 
    d.option.toLowerCase().includes('no') || 
    d.option.toLowerCase().includes('false') ||
    d.option.toLowerCase() === '0'
  )
  return noResponse?.count || 0
})

const totalResponses = computed(() => {
  return props.analytics?.total_responses || (yesCount.value + noCount.value)
})

const yesPercentage = computed(() => {
  if (totalResponses.value === 0) return 0
  return yesCount.value / totalResponses.value
})

const noPercentage = computed(() => {
  if (totalResponses.value === 0) return 0
  return noCount.value / totalResponses.value
})

const majorityIsYes = computed(() => yesPercentage.value > 0.5)

const majorityText = computed(() => {
  const percentage = Math.max(yesPercentage.value, noPercentage.value)
  const strongMajority = percentage > 0.7
  const response = majorityIsYes.value ? t.value('survey.analytics.yes') : t.value('survey.analytics.no')
  
  if (strongMajority) {
    return `${t.value('survey.analytics.strongMajority')} ${response.toLowerCase()}`
  } else {
    return `${t.value('survey.analytics.simpleMajority')} ${response.toLowerCase()}`
  }
})

// Chart data
const chartData = computed(() => {
  return [
    {
      label: t.value('survey.analytics.yes'),
      value: yesCount.value,
      percentage: yesPercentage.value
    },
    {
      label: t.value('survey.analytics.no'),
      value: noCount.value,
      percentage: noPercentage.value
    }
  ]
})

// Statistical calculations
const marginOfError = computed(() => {
  if (totalResponses.value < 30) return 0
  
  // 95% confidence level (z = 1.96)
  const z = 1.96
  const p = yesPercentage.value
  const n = totalResponses.value
  
  // Margin of error formula: z * sqrt((p * (1 - p)) / n)
  return z * Math.sqrt((p * (1 - p)) / n)
})

// Analysis methods
const getConfidenceLevel = (percentage: number) => {
  if (percentage >= 0.8) return t.value('survey.analytics.veryHigh')
  if (percentage >= 0.6) return t.value('survey.analytics.high')
  if (percentage >= 0.4) return t.value('survey.analytics.moderate')
  return t.value('survey.analytics.low')
}

const getReliabilityLevel = () => {
  if (totalResponses.value >= 1000) return t.value('survey.analytics.excellent')
  if (totalResponses.value >= 500) return t.value('survey.analytics.veryGood')
  if (totalResponses.value >= 100) return t.value('survey.analytics.good')
  if (totalResponses.value >= 30) return t.value('survey.analytics.adequate')
  return t.value('survey.analytics.limited')
}

// Insights
const insights = computed(() => {
  if (!props.analytics?.distribution) return []
  
  const insights = []
  
  // Consensus insight
  if (yesPercentage.value > 0.8 || noPercentage.value > 0.8) {
    const strongConsensus = Math.max(yesPercentage.value, noPercentage.value)
    const response = majorityIsYes.value ? t.value('survey.analytics.yes') : t.value('survey.analytics.no')
    
    insights.push({
      icon: 'fas fa-handshake',
      color: '#4CAF50',
      title: t.value('survey.analytics.strongConsensus'),
      text: `${formatPercentage(strongConsensus)} ${t.value('survey.analytics.agreedOn')} "${response}"`
    })
  } else if (Math.abs(yesPercentage.value - noPercentage.value) < 0.1) {
    insights.push({
      icon: 'fas fa-balance-scale',
      color: '#FF9800',
      title: t.value('survey.analytics.dividedOpinion'),
      text: t.value('survey.analytics.dividedOpinionText')
    })
  }
  
  // Sample size insight
  if (totalResponses.value < 30) {
    insights.push({
      icon: 'fas fa-exclamation-triangle',
      color: '#F44336',
      title: t.value('survey.analytics.smallSample'),
      text: t.value('survey.analytics.smallSampleText')
    })
  } else if (totalResponses.value >= 100) {
    insights.push({
      icon: 'fas fa-check-circle',
      color: '#4CAF50',
      title: t.value('survey.analytics.robustSample'),
      text: t.value('survey.analytics.robustSampleText')
    })
  }
  
  // Preference strength insight
  const dominantPercentage = Math.max(yesPercentage.value, noPercentage.value)
  if (dominantPercentage > 0.9) {
    insights.push({
      icon: 'fas fa-trophy',
      color: '#FFD700',
      title: t.value('survey.analytics.overwhelmingPreference'),
      text: `${formatPercentage(dominantPercentage)} ${t.value('survey.analytics.overwhelmingPreferenceText')}`
    })
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

const onSegmentClick = (segment: any) => {
  emit('segmentClick', segment)
}
</script>

<style module>
.yesNoAnalytics {
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
}

.summaryNumber {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  margin-bottom: 4px;
}

.summaryLabel {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Visual Section */
.visualSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.visualGrid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: center;
}

/* Binary Indicator */
.binaryIndicator {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.indicatorHeader {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.indicatorTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.indicatorContent {
  display: flex;
  align-items: center;
  gap: 20px;
}

.indicatorIcon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  transition: transform 0.2s ease;
}

.indicatorIcon:hover {
  transform: scale(1.05);
}

.iconYes {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.iconNo {
  background: linear-gradient(135deg, #F44336, #EF5350);
  color: white;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.indicatorText {
  flex: 1;
}

.indicatorResult {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 4px;
}

.indicatorSubtext {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.4;
}

/* Chart Container */
.chartContainer {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Details Section */
.detailsSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detailsGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detailCard {
  background: var(--surface-variant);
  border-radius: 8px;
  padding: 16px;
  border-top: 4px solid transparent;
}

.detailHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detailIcon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.detailTitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.detailContent {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detailStat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detailStatLabel {
  font-size: 13px;
  color: var(--muted);
}

.detailStatValue {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

/* Statistics Section */
.statisticsSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.statisticsHeader {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.statisticsTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.statisticsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.statisticCard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.statisticIcon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(161, 125, 35, 0.1);
  font-size: 14px;
}

.statisticContent {
  flex: 1;
}

.statisticLabel {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.statisticValue {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
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
@media (max-width: 768px) {
  .visualGrid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .detailsGrid {
    grid-template-columns: 1fr;
  }
  
  .summaryGrid,
  .statisticsGrid {
    grid-template-columns: 1fr;
  }
  
  .indicatorContent {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

/* Dark Theme */
.yesNoAnalytics[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
}

/* RTL Support */
.yesNoAnalytics[dir="rtl"] .indicatorContent {
  flex-direction: row-reverse;
}

.yesNoAnalytics[dir="rtl"] .detailHeader {
  flex-direction: row-reverse;
}

.yesNoAnalytics[dir="rtl"] .insightCard {
  flex-direction: row-reverse;
}
</style>

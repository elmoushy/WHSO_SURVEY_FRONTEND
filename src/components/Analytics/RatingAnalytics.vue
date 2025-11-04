<template>
  <div :class="$style.ratingAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
    </div>

    <div v-else-if="!analytics || !analytics.distribution" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-star"></i>
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
              <i class="fas fa-calculator" style="color: #2196F3;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatDecimal(analytics.avg) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.average') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-chart-line" style="color: #FF9800;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatDecimal(analytics.median) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.median') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-crown" style="color: #9C27B0;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ analytics.mode }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.mode') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rating Distribution Chart -->
      <div :class="$style.distributionSection">
        <div :class="$style.chartHeader">
          <h4 :class="$style.chartTitle">{{ t('survey.analytics.ratingDistribution') }}</h4>
        </div>
        
        <div :class="$style.distributionChart">
          <!-- Star ratings bars -->
          <div :class="$style.ratingBars">
            <div
              v-for="(rating, index) in sortedRatings"
              :key="rating.value"
              :class="$style.ratingBar"
              @click="onRatingClick(rating, index)"
            >
              <div :class="$style.ratingLabel">
                <div :class="$style.ratingStars">
                  <i
                    v-for="star in rating.value"
                    :key="star"
                    class="fas fa-star"
                    :style="{ color: getRatingColor(rating.value) }"
                  ></i>
                  <i
                    v-for="emptyStar in (maxRating - rating.value)"
                    :key="`empty-${emptyStar}`"
                    class="far fa-star"
                    style="color: #ddd;"
                  ></i>
                </div>
                <span :class="$style.ratingText">{{ rating.value }} {{ t('survey.analytics.stars') }}</span>
              </div>
              
              <div :class="$style.ratingBarContainer">
                <div
                  :class="$style.ratingBarFill"
                  :style="{
                    width: `${(rating.count / maxCount) * 100}%`,
                    backgroundColor: getRatingColor(rating.value)
                  }"
                ></div>
              </div>
              
              <div :class="$style.ratingStats">
                <span :class="$style.ratingCount">{{ formatNumber(rating.count) }}</span>
                <span :class="$style.ratingPercentage">({{ formatPercentage(rating.percentage) }})</span>
              </div>
            </div>
          </div>

          <!-- Summary insights -->
          <div :class="$style.distributionInsights">
            <div :class="$style.insightCard">
              <div :class="$style.insightLabel">{{ t('survey.analytics.positiveRatings') }}</div>
              <div :class="$style.insightValue" :style="{ color: '#4CAF50' }">
                {{ formatPercentage(positiveRatingsPercentage) }}
              </div>
            </div>
            
            <div :class="$style.insightCard">
              <div :class="$style.insightLabel">{{ t('survey.analytics.neutralRatings') }}</div>
              <div :class="$style.insightValue" :style="{ color: '#FF9800' }">
                {{ formatPercentage(neutralRatingsPercentage) }}
              </div>
            </div>
            
            <div :class="$style.insightCard">
              <div :class="$style.insightLabel">{{ t('survey.analytics.negativeRatings') }}</div>
              <div :class="$style.insightValue" :style="{ color: '#F44336' }">
                {{ formatPercentage(negativeRatingsPercentage) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistical Details -->
      <div :class="$style.statisticsSection">
        <div :class="$style.statisticsHeader">
          <h4 :class="$style.statisticsTitle">{{ t('survey.analytics.statisticalAnalysis') }}</h4>
        </div>
        
        <div :class="$style.statisticsGrid">
          <div :class="$style.statisticCard">
            <div :class="$style.statisticIcon">
              <i class="fas fa-chart-area" style="color: #2196F3;"></i>
            </div>
            <div :class="$style.statisticContent">
              <div :class="$style.statisticLabel">{{ t('survey.analytics.standardDeviation') }}</div>
              <div :class="$style.statisticValue">{{ formatDecimal(analytics.std_dev) }}</div>
            </div>
          </div>

          <div :class="$style.statisticCard">
            <div :class="$style.statisticIcon">
              <i class="fas fa-arrow-down" style="color: #F44336;"></i>
            </div>
            <div :class="$style.statisticContent">
              <div :class="$style.statisticLabel">{{ t('survey.analytics.minimum') }}</div>
              <div :class="$style.statisticValue">{{ analytics.min }}</div>
            </div>
          </div>

          <div :class="$style.statisticCard">
            <div :class="$style.statisticIcon">
              <i class="fas fa-arrow-up" style="color: #4CAF50;"></i>
            </div>
            <div :class="$style.statisticContent">
              <div :class="$style.statisticLabel">{{ t('survey.analytics.maximum') }}</div>
              <div :class="$style.statisticValue">{{ analytics.max }}</div>
            </div>
          </div>

          <div :class="$style.statisticCard">
            <div :class="$style.statisticIcon">
              <i class="fas fa-percentage" style="color: '#9C27B0';"></i>
            </div>
            <div :class="$style.statisticContent">
              <div :class="$style.statisticLabel">{{ t('survey.analytics.responseRate') }}</div>
              <div :class="$style.statisticValue">{{ formatPercentage(analytics.response_rate || 1) }}</div>
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

// Props
interface Props {
  analytics: {
    distribution: Array<{
      rating: number
      count: number
      percentage: number
    }>
    total_responses: number
    avg: number
    median: number
    mode: number
    min: number
    max: number
    std_dev: number
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
  ratingClick: [rating: any, index: number]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Rating system configuration
const maxRating = computed(() => {
  if (!props.analytics?.distribution) return 5
  return Math.max(...props.analytics.distribution.map(d => d.rating)) || 5
})

const sortedRatings = computed(() => {
  if (!props.analytics?.distribution) return []
  
  // Sort by rating value (descending for better visual flow)
  return [...props.analytics.distribution]
    .sort((a, b) => b.rating - a.rating)
    .map(item => ({
      value: item.rating,
      count: item.count,
      percentage: item.percentage
    }))
})

const maxCount = computed(() => {
  if (!sortedRatings.value.length) return 1
  return Math.max(...sortedRatings.value.map(r => r.count))
})

// Sentiment analysis
const positiveRatingsPercentage = computed(() => {
  if (!props.analytics?.distribution) return 0
  
  const positiveThreshold = Math.ceil(maxRating.value * 0.7) // Top 30% considered positive
  const positiveRatings = props.analytics.distribution
    .filter(d => d.rating >= positiveThreshold)
    .reduce((sum, d) => sum + d.percentage, 0)
  
  return positiveRatings
})

const neutralRatingsPercentage = computed(() => {
  if (!props.analytics?.distribution) return 0
  
  const neutralMin = Math.ceil(maxRating.value * 0.4) // Middle 30%
  const neutralMax = Math.floor(maxRating.value * 0.7)
  
  const neutralRatings = props.analytics.distribution
    .filter(d => d.rating >= neutralMin && d.rating <= neutralMax)
    .reduce((sum, d) => sum + d.percentage, 0)
  
  return neutralRatings
})

const negativeRatingsPercentage = computed(() => {
  if (!props.analytics?.distribution) return 0
  
  const negativeThreshold = Math.floor(maxRating.value * 0.4) // Bottom 40% considered negative
  const negativeRatings = props.analytics.distribution
    .filter(d => d.rating < negativeThreshold)
    .reduce((sum, d) => sum + d.percentage, 0)
  
  return negativeRatings
})

// Insights
const insights = computed(() => {
  if (!props.analytics?.distribution) return []
  
  const insights = []
  const avg = props.analytics.avg || 0
  const stdDev = props.analytics.std_dev || 0
  
  // Average rating insight
  if (avg >= maxRating.value * 0.8) {
    insights.push({
      icon: 'fas fa-thumbs-up',
      color: '#4CAF50',
      title: t.value('survey.analytics.excellentRatings'),
      text: t.value('survey.analytics.excellentRatingsText')
    })
  } else if (avg <= maxRating.value * 0.4) {
    insights.push({
      icon: 'fas fa-thumbs-down',
      color: '#F44336',
      title: t.value('survey.analytics.lowRatings'),
      text: t.value('survey.analytics.lowRatingsText')
    })
  } else {
    insights.push({
      icon: 'fas fa-balance-scale',
      color: '#FF9800',
      title: t.value('survey.analytics.moderateRatings'),
      text: t.value('survey.analytics.moderateRatingsText')
    })
  }

  // Distribution insight
  if (stdDev < 0.5) {
    insights.push({
      icon: 'fas fa-compress-alt',
      color: '#2196F3',
      title: t.value('survey.analytics.consistentRatings'),
      text: t.value('survey.analytics.consistentRatingsText')
    })
  } else if (stdDev > 1.5) {
    insights.push({
      icon: 'fas fa-expand-alt',
      color: '#9C27B0',
      title: t.value('survey.analytics.variedRatings'),
      text: t.value('survey.analytics.variedRatingsText')
    })
  }

  // Sentiment insight
  if (positiveRatingsPercentage.value > 0.6) {
    insights.push({
      icon: 'fas fa-smile',
      color: '#4CAF50',
      title: t.value('survey.analytics.positiveResponse'),
      text: `${formatPercentage(positiveRatingsPercentage.value)} ${t.value('survey.analytics.gavePositiveRatings')}`
    })
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

const getRatingColor = (rating: number) => {
  // Color scale from red (low) to green (high)
  const percentage = rating / maxRating.value
  
  if (percentage >= 0.8) return '#4CAF50'  // Green
  if (percentage >= 0.6) return '#8BC34A'  // Light Green
  if (percentage >= 0.4) return '#FF9800'  // Orange
  if (percentage >= 0.2) return '#FF5722'  // Red Orange
  return '#F44336'  // Red
}

const onRatingClick = (rating: any, index: number) => {
  emit('ratingClick', rating, index)
}
</script>

<style module>
.ratingAnalytics {
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

/* Distribution Section */
.distributionSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chartHeader {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.chartTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.distributionChart {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
}

.ratingBars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ratingBar {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ratingBar:hover {
  background: var(--surface-variant);
}

.ratingLabel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ratingStars {
  display: flex;
  gap: 2px;
}

.ratingStars i {
  font-size: 14px;
}

.ratingText {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.ratingBarContainer {
  background: var(--surface-variant);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.ratingBarFill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.ratingStats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.ratingCount {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.ratingPercentage {
  font-size: 10px;
  color: var(--muted);
}

.distributionInsights {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 150px;
}

.insightCard {
  padding: 12px;
  background: var(--surface-variant);
  border-radius: 6px;
  text-align: center;
}

.insightLabel {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.insightValue {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
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
  .distributionChart {
    grid-template-columns: 1fr;
  }
  
  .ratingBar {
    grid-template-columns: 1fr auto;
    gap: 12px;
  }
  
  .distributionInsights {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    min-width: auto;
  }
  
  .summaryGrid,
  .statisticsGrid {
    grid-template-columns: 1fr;
  }
}

/* Dark Theme */
.ratingAnalytics[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
}

/* RTL Support */
.ratingAnalytics[dir="rtl"] .ratingBar {
  direction: ltr; /* Keep star order consistent */
}

.ratingAnalytics[dir="rtl"] .ratingStats {
  text-align: right;
}

.ratingAnalytics[dir="rtl"] .insightCard {
  flex-direction: row-reverse;
}
</style>

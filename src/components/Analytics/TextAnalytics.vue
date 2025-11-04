<template>
  <div :class="$style.textAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.analytics.loadingAnalytics') }}</p>
    </div>

    <div v-else-if="!analytics || !analytics.responses" :class="$style.emptyContainer">
      <div :class="$style.emptyIcon">
        <i class="fas fa-comment-alt"></i>
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
              <i class="fas fa-align-left" style="color: #2196F3;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatNumber(avgLength) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.avgLength') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-font" style="color: #FF9800;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatNumber(avgWords) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.avgWords') }}</div>
            </div>
          </div>

          <div :class="$style.summaryCard">
            <div :class="$style.summaryIcon">
              <i class="fas fa-file-alt" style="color: #9C27B0;"></i>
            </div>
            <div :class="$style.summaryContent">
              <div :class="$style.summaryNumber">{{ formatNumber(filledResponses) }}</div>
              <div :class="$style.summaryLabel">{{ t('survey.analytics.filledResponses') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Length Distribution -->
      <div :class="$style.distributionSection">
        <div :class="$style.chartHeader">
          <h4 :class="$style.chartTitle">{{ t('survey.analytics.lengthDistribution') }}</h4>
          <div :class="$style.chartControls">
            <button
              :class="[$style.controlButton, lengthUnit === 'characters' && $style.active]"
              @click="lengthUnit = 'characters'"
            >
              {{ t('survey.analytics.characters') }}
            </button>
            <button
              :class="[$style.controlButton, lengthUnit === 'words' && $style.active]"
              @click="lengthUnit = 'words'"
            >
              {{ t('survey.analytics.words') }}
            </button>
          </div>
        </div>
        
        <div :class="$style.distributionChart">
          <!-- Length categories bars -->
          <div :class="$style.lengthBars">
            <div
              v-for="(category, index) in lengthCategories"
              :key="category.label"
              :class="$style.lengthBar"
              @click="onCategoryClick(category, index)"
            >
              <div :class="$style.lengthLabel">
                <span :class="$style.categoryRange">{{ category.label }}</span>
                <span :class="$style.categoryDescription">{{ category.description }}</span>
              </div>
              
              <div :class="$style.lengthBarContainer">
                <div
                  :class="$style.lengthBarFill"
                  :style="{
                    width: `${(category.count / maxCategoryCount) * 100}%`,
                    backgroundColor: getCategoryColor(index)
                  }"
                ></div>
              </div>
              
              <div :class="$style.lengthStats">
                <span :class="$style.categoryCount">{{ formatNumber(category.count) }}</span>
                <span :class="$style.categoryPercentage">({{ formatPercentage(category.percentage) }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Quality Analysis -->
      <div :class="$style.qualitySection">
        <div :class="$style.qualityHeader">
          <h4 :class="$style.qualityTitle">{{ t('survey.analytics.responseQuality') }}</h4>
        </div>
        
        <div :class="$style.qualityGrid">
          <div :class="$style.qualityCard">
            <div :class="$style.qualityIcon">
              <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
            </div>
            <div :class="$style.qualityContent">
              <div :class="$style.qualityLabel">{{ t('survey.analytics.substantialResponses') }}</div>
              <div :class="$style.qualityValue">{{ formatNumber(substantialResponses) }}</div>
              <div :class="$style.qualitySubtext">
                ({{ formatPercentage(substantialResponses / filledResponses) }})
              </div>
            </div>
          </div>

          <div :class="$style.qualityCard">
            <div :class="$style.qualityIcon">
              <i class="fas fa-exclamation-triangle" style="color: #FF9800;"></i>
            </div>
            <div :class="$style.qualityContent">
              <div :class="$style.qualityLabel">{{ t('survey.analytics.briefResponses') }}</div>
              <div :class="$style.qualityValue">{{ formatNumber(briefResponses) }}</div>
              <div :class="$style.qualitySubtext">
                ({{ formatPercentage(briefResponses / filledResponses) }})
              </div>
            </div>
          </div>

          <div :class="$style.qualityCard">
            <div :class="$style.qualityIcon">
              <i class="fas fa-times-circle" style="color: #F44336;"></i>
            </div>
            <div :class="$style.qualityContent">
              <div :class="$style.qualityLabel">{{ t('survey.analytics.emptyResponses') }}</div>
              <div :class="$style.qualityValue">{{ formatNumber(emptyResponses) }}</div>
              <div :class="$style.qualitySubtext">
                ({{ formatPercentage(emptyResponses / analytics.total_responses) }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Responses Sample -->
      <div v-if="displayResponses.length > 0" :class="$style.responsesSection">
        <div :class="$style.responsesHeader">
          <h4 :class="$style.responsesTitle">{{ t('survey.analytics.recentResponses') }}</h4>
          <div :class="$style.responsesControls">
            <select 
              v-model="sortOrder" 
              :class="$style.sortSelect"
              @change="updateDisplayResponses"
            >
              <option value="newest">{{ t('survey.analytics.newest') }}</option>
              <option value="oldest">{{ t('survey.analytics.oldest') }}</option>
              <option value="longest">{{ t('survey.analytics.longest') }}</option>
              <option value="shortest">{{ t('survey.analytics.shortest') }}</option>
            </select>
            <button 
              :class="$style.showMoreButton"
              @click="showMore"
              v-if="displayResponses.length < sortedResponses.length"
            >
              {{ t('survey.analytics.showMore') }}
            </button>
          </div>
        </div>
        
        <div :class="$style.responsesList">
          <div
            v-for="(response, index) in displayResponses"
            :key="index"
            :class="$style.responseItem"
            @click="onResponseClick(response, index)"
          >
            <div :class="$style.responseHeader">
              <div :class="$style.responseStats">
                <span :class="$style.responseStat">
                  <i class="fas fa-font"></i>
                  {{ getResponseWordCount(response.text) }} {{ t('survey.analytics.words') }}
                </span>
                <span :class="$style.responseStat">
                  <i class="fas fa-align-left"></i>
                  {{ response.text.length }} {{ t('survey.analytics.chars') }}
                </span>
              </div>
              <div :class="$style.responseDate" v-if="response.created_at">
                {{ formatDate(response.created_at) }}
              </div>
            </div>
            
            <div :class="$style.responseText">
              {{ truncateText(response.text, 200) }}
            </div>
            
            <div :class="$style.responseFooter" v-if="response.text.length > 200">
              <button :class="$style.expandButton" @click.stop="toggleExpand(index)">
                {{ expandedResponses.has(index) ? t('survey.analytics.showLess') : t('survey.analytics.showMore') }}
              </button>
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
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/useAppStore'

// Props
interface Props {
  analytics: {
    responses: Array<{
      text: string
      created_at?: string
      user_id?: string
    }>
    total_responses: number
    avg_length?: number
    avg_words?: number
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
  categoryClick: [category: any, index: number]
  responseClick: [response: any, index: number]
}>()

// Store
const store = useAppStore()

// Reactive state
const lengthUnit = ref<'characters' | 'words'>('characters')
const sortOrder = ref('newest')
const displayLimit = ref(5)
const expandedResponses = ref(new Set<number>())

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Response analysis
const filledResponses = computed(() => {
  if (!props.analytics?.responses) return 0
  return props.analytics.responses.filter(r => r.text && r.text.trim().length > 0).length
})

const emptyResponses = computed(() => {
  return props.analytics?.total_responses - filledResponses.value
})

const avgLength = computed(() => {
  if (!props.analytics?.responses || filledResponses.value === 0) return 0
  if (props.analytics.avg_length) return props.analytics.avg_length
  
  const totalLength = props.analytics.responses
    .filter(r => r.text && r.text.trim())
    .reduce((sum, r) => sum + r.text.length, 0)
  
  return Math.round(totalLength / filledResponses.value)
})

const avgWords = computed(() => {
  if (!props.analytics?.responses || filledResponses.value === 0) return 0
  if (props.analytics.avg_words) return props.analytics.avg_words
  
  const totalWords = props.analytics.responses
    .filter(r => r.text && r.text.trim())
    .reduce((sum, r) => sum + getResponseWordCount(r.text), 0)
  
  return Math.round(totalWords / filledResponses.value)
})

// Quality analysis
const substantialResponses = computed(() => {
  if (!props.analytics?.responses) return 0
  return props.analytics.responses.filter(r => 
    r.text && r.text.trim().length > 50 && getResponseWordCount(r.text) > 10
  ).length
})

const briefResponses = computed(() => {
  if (!props.analytics?.responses) return 0
  return props.analytics.responses.filter(r => 
    r.text && r.text.trim().length > 0 && r.text.trim().length <= 50
  ).length
})

// Length categories
const lengthCategories = computed(() => {
  if (!props.analytics?.responses) return []
  
  const responses = props.analytics.responses.filter(r => r.text && r.text.trim())
  
  if (lengthUnit.value === 'words') {
    return [
      {
        label: '1-5',
        description: t.value('survey.analytics.veryBrief'),
        count: responses.filter(r => {
          const words = getResponseWordCount(r.text)
          return words >= 1 && words <= 5
        }).length,
        percentage: 0
      },
      {
        label: '6-15',
        description: t.value('survey.analytics.brief'),
        count: responses.filter(r => {
          const words = getResponseWordCount(r.text)
          return words >= 6 && words <= 15
        }).length,
        percentage: 0
      },
      {
        label: '16-50',
        description: t.value('survey.analytics.moderate'),
        count: responses.filter(r => {
          const words = getResponseWordCount(r.text)
          return words >= 16 && words <= 50
        }).length,
        percentage: 0
      },
      {
        label: '51+',
        description: t.value('survey.analytics.detailed'),
        count: responses.filter(r => {
          const words = getResponseWordCount(r.text)
          return words > 50
        }).length,
        percentage: 0
      }
    ].map(category => ({
      ...category,
      percentage: responses.length ? category.count / responses.length : 0
    }))
  } else {
    return [
      {
        label: '1-50',
        description: t.value('survey.analytics.veryBrief'),
        count: responses.filter(r => r.text.length >= 1 && r.text.length <= 50).length,
        percentage: 0
      },
      {
        label: '51-150',
        description: t.value('survey.analytics.brief'),
        count: responses.filter(r => r.text.length >= 51 && r.text.length <= 150).length,
        percentage: 0
      },
      {
        label: '151-300',
        description: t.value('survey.analytics.moderate'),
        count: responses.filter(r => r.text.length >= 151 && r.text.length <= 300).length,
        percentage: 0
      },
      {
        label: '301+',
        description: t.value('survey.analytics.detailed'),
        count: responses.filter(r => r.text.length > 300).length,
        percentage: 0
      }
    ].map(category => ({
      ...category,
      percentage: responses.length ? category.count / responses.length : 0
    }))
  }
})

const maxCategoryCount = computed(() => {
  if (!lengthCategories.value.length) return 1
  return Math.max(...lengthCategories.value.map(c => c.count))
})

// Response sorting and display
const sortedResponses = computed(() => {
  if (!props.analytics?.responses) return []
  
  const responses = [...props.analytics.responses].filter(r => r.text && r.text.trim())
  
  switch (sortOrder.value) {
    case 'oldest':
      return responses.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
    case 'longest':
      return responses.sort((a, b) => b.text.length - a.text.length)
    case 'shortest':
      return responses.sort((a, b) => a.text.length - b.text.length)
    case 'newest':
    default:
      return responses.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }
})

const displayResponses = computed(() => {
  return sortedResponses.value.slice(0, displayLimit.value).map((response, index) => ({
    ...response,
    text: expandedResponses.value.has(index) ? response.text : response.text
  }))
})

// Insights
const insights = computed(() => {
  if (!props.analytics?.responses || !filledResponses.value) return []
  
  const insights = []
  const responseRate = filledResponses.value / props.analytics.total_responses
  
  // Response rate insight
  if (responseRate > 0.8) {
    insights.push({
      icon: 'fas fa-thumbs-up',
      color: '#4CAF50',
      title: t.value('survey.analytics.highEngagement'),
      text: `${formatPercentage(responseRate)} ${t.value('survey.analytics.providedTextResponses')}`
    })
  } else if (responseRate < 0.5) {
    insights.push({
      icon: 'fas fa-exclamation-triangle',
      color: '#FF9800',
      title: t.value('survey.analytics.lowEngagement'),
      text: t.value('survey.analytics.lowEngagementText')
    })
  }
  
  // Response quality insight
  const qualityRate = substantialResponses.value / filledResponses.value
  if (qualityRate > 0.7) {
    insights.push({
      icon: 'fas fa-star',
      color: '#FFD700',
      title: t.value('survey.analytics.highQualityResponses'),
      text: `${formatPercentage(qualityRate)} ${t.value('survey.analytics.gaveDetailedAnswers')}`
    })
  } else if (qualityRate < 0.3) {
    insights.push({
      icon: 'fas fa-edit',
      color: '#2196F3',
      title: t.value('survey.analytics.briefResponses'),
      text: t.value('survey.analytics.briefResponsesText')
    })
  }
  
  // Length analysis insight
  if (avgLength.value > 200) {
    insights.push({
      icon: 'fas fa-align-left',
      color: '#9C27B0',
      title: t.value('survey.analytics.detailedResponses'),
      text: `${t.value('survey.analytics.averageLength')} ${avgLength.value} ${t.value('survey.analytics.characters')}`
    })
  } else if (avgLength.value < 50) {
    insights.push({
      icon: 'fas fa-compress',
      color: '#FF5722',
      title: t.value('survey.analytics.conciseResponses'),
      text: t.value('survey.analytics.conciseResponsesText')
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const locale = isRTL.value ? 'ar-SA' : 'en-US'
  return date.toLocaleDateString(locale, { calendar: 'gregory' })
}

const getResponseWordCount = (text: string) => {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).length
}

const getCategoryColor = (index: number) => {
  const colors = ['#4CAF50', '#8BC34A', '#FF9800', '#F44336']
  return colors[index % colors.length]
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const updateDisplayResponses = () => {
  displayLimit.value = 5
  expandedResponses.value.clear()
}

const showMore = () => {
  displayLimit.value += 5
}

const toggleExpand = (index: number) => {
  if (expandedResponses.value.has(index)) {
    expandedResponses.value.delete(index)
  } else {
    expandedResponses.value.add(index)
  }
}

const onCategoryClick = (category: any, index: number) => {
  emit('categoryClick', category, index)
}

const onResponseClick = (response: any, index: number) => {
  emit('responseClick', response, index)
}
</script>

<style module>
.textAnalytics {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.chartControls {
  display: flex;
  gap: 8px;
}

.controlButton {
  padding: 6px 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.controlButton:hover {
  background: var(--surface-variant);
  color: var(--ink);
}

.controlButton.active {
  background: var(--brand);
  color: white;
  border-color: var(--brand);
}

.distributionChart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lengthBars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lengthBar {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.lengthBar:hover {
  background: var(--surface-variant);
}

.lengthLabel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.categoryRange {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.categoryDescription {
  font-size: 11px;
  color: var(--muted);
}

.lengthBarContainer {
  background: var(--surface-variant);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.lengthBarFill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.lengthStats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.categoryCount {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.categoryPercentage {
  font-size: 10px;
  color: var(--muted);
}

/* Quality Section */
.qualitySection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qualityHeader {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.qualityTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.qualityGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.qualityCard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.qualityIcon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(161, 125, 35, 0.1);
  font-size: 14px;
  flex-shrink: 0;
}

.qualityContent {
  flex: 1;
}

.qualityLabel {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}

.qualityValue {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
}

.qualitySubtext {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

/* Responses Section */
.responsesSection {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.responsesHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.responsesTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.responsesControls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sortSelect {
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font-size: 12px;
}

.showMoreButton {
  padding: 6px 12px;
  border: 1px solid var(--brand);
  background: transparent;
  color: var(--brand);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.showMoreButton:hover {
  background: var(--brand);
  color: white;
}

.responsesList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.responseItem {
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.responseItem:hover {
  background: var(--surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.responseHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.responseStats {
  display: flex;
  gap: 16px;
}

.responseStat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted);
}

.responseStat i {
  font-size: 10px;
}

.responseDate {
  font-size: 12px;
  color: var(--muted);
}

.responseText {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.responseFooter {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.expandButton {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--brand);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.expandButton:hover {
  color: var(--brand-hover);
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
  .chartHeader {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .lengthBar {
    grid-template-columns: 1fr auto;
    gap: 12px;
  }
  
  .summaryGrid,
  .qualityGrid {
    grid-template-columns: 1fr;
  }
  
  .responsesHeader {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

/* Dark Theme */
.textAnalytics[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
  --brand-hover: #c19b3e;
}

/* RTL Support */
.textAnalytics[dir="rtl"] .responseHeader {
  flex-direction: row-reverse;
}

.textAnalytics[dir="rtl"] .responsesHeader {
  flex-direction: row-reverse;
}

.textAnalytics[dir="rtl"] .chartHeader {
  flex-direction: row-reverse;
}

.textAnalytics[dir="rtl"] .insightCard {
  flex-direction: row-reverse;
}
</style>

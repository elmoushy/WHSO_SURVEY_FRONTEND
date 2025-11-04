<template>
  <div :class="$style.analyticsContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section with Survey Info -->
    <section :class="$style.headerSection">
      <div :class="$style.headerContent">
        <div :class="$style.titleSection">
          <button :class="$style.backButton" @click="goBack" :title="t('common.goBack')">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div :class="$style.titleInfo">
            <h1 :class="$style.title">{{ t('survey.analytics.title') }}</h1>
            <div v-if="surveyInfo" :class="$style.surveyMeta">
              <h2 :class="$style.surveyTitle">{{ surveyInfo.title }}</h2>
              <div :class="$style.surveyDetails">
                <span :class="$style.surveyDetail">
                  <i class="fas fa-calendar"></i>
                  {{ formatDate(surveyInfo.created_at) }}
                </span>
                <span :class="$style.surveyDetail">
                  <i class="fas fa-question-circle"></i>
                  {{ `${t('survey.analytics.totalQuestions')}: ${surveyInfo.total_questions}` }}
                </span>
                <span :class="[$style.statusBadge, surveyInfo.is_active ? $style.active : $style.inactive]">
                  <i :class="surveyInfo.is_active ? 'fas fa-play-circle' : 'fas fa-pause-circle'"></i>
                  {{ surveyInfo.is_active ? t('survey.analytics.active') : t('survey.analytics.inactive') }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div :class="$style.headerActions">
          <div :class="$style.dateFilters">
            <div :class="$style.filterGroup">
              <label :class="$style.filterLabel">{{ t('survey.analytics.startDate') }}</label>
              <input
                type="datetime-local"
                v-model="startDate"
                :class="$style.dateInput"
                @change="refreshAnalytics"
              />
            </div>
            <div :class="$style.filterGroup">
              <label :class="$style.filterLabel">{{ t('survey.analytics.endDate') }}</label>
              <input
                type="datetime-local"
                v-model="endDate"
                :class="$style.dateInput"
                @change="refreshAnalytics"
              />
            </div>
            <div :class="$style.filterGroup">
              <label :class="$style.filterLabel">{{ t('survey.analytics.groupBy') }}</label>
              <select v-model="groupBy" :class="$style.selectInput" @change="refreshAnalytics">
                <option value="day">{{ t('survey.analytics.groupBy.day') }}</option>
                <option value="week">{{ t('survey.analytics.groupBy.week') }}</option>
                <option value="month">{{ t('survey.analytics.groupBy.month') }}</option>
              </select>
            </div>
          </div>
          
          <div :class="$style.actionButtons">
            <button :class="$style.exportButton" @click="showExportModal = true" :disabled="isLoading">
              <i class="fas fa-download"></i>
              {{ t('survey.analytics.exportData') }}
            </button>
            <button :class="$style.refreshButton" @click="refreshAnalytics" :disabled="isLoading">
              <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
              {{ t('common.refresh') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="isLoading && !analyticsData" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner">
        <i class="fas fa-chart-line fa-spin"></i>
        <p>{{ t('survey.analytics.loadingAnalytics') }}</p>
      </div>
    </div>

    <!-- Main Analytics Content -->
    <div v-else-if="analyticsData" :class="$style.analyticsContent">
      <!-- KPIs Section -->
      <section :class="$style.kpisSection">
        <div :class="$style.kpisGrid">
          <div :class="$style.kpiCard">
            <div :class="$style.kpiIcon">
              <i class="fas fa-users"></i>
            </div>
            <div :class="$style.kpiContent">
              <div :class="$style.kpiValue">{{ formatNumber(analyticsData.kpis.total_responses) }}</div>
              <div :class="$style.kpiLabel">{{ t('survey.analytics.totalResponses') }}</div>
            </div>
            <div :class="$style.kpiTrend" v-if="analyticsData.kpis.response_rate_trend">
              <i :class="analyticsData.kpis.response_rate_trend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              <span :class="analyticsData.kpis.response_rate_trend > 0 ? $style.trendUp : $style.trendDown">
                {{ Math.abs(analyticsData.kpis.response_rate_trend * 100).toFixed(1) }}%
              </span>
            </div>
          </div>

          <div :class="$style.kpiCard">
            <div :class="$style.kpiIcon">
              <i class="fas fa-user-check"></i>
            </div>
            <div :class="$style.kpiContent">
              <div :class="$style.kpiValue">{{ formatNumber(analyticsData.kpis.unique_respondents) }}</div>
              <div :class="$style.kpiLabel">{{ t('survey.analytics.uniqueRespondents') }}</div>
            </div>
          </div>

          <div :class="$style.kpiCard">
            <div :class="$style.kpiIcon">
              <i class="fas fa-percentage"></i>
            </div>
            <div :class="$style.kpiContent">
              <div :class="$style.kpiValue">{{ (analyticsData.kpis.completion_rate * 100).toFixed(1) }}%</div>
              <div :class="$style.kpiLabel">{{ t('survey.analytics.completionRate') }}</div>
            </div>
            <div :class="$style.progressBar">
              <div :class="$style.progressFill" :style="{ width: `${analyticsData.kpis.completion_rate * 100}%` }"></div>
            </div>
          </div>

          <div :class="$style.kpiCard">
            <div :class="$style.kpiIcon">
              <i class="fas fa-clock"></i>
            </div>
            <div :class="$style.kpiContent">
              <div :class="$style.kpiValue">{{ formatDuration(analyticsData.kpis.average_completion_time) }}</div>
              <div :class="$style.kpiLabel">{{ t('survey.analytics.avgCompletionTime') }}</div>
            </div>
          </div>

          <div :class="$style.kpiCard">
            <div :class="$style.kpiIcon">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div :class="$style.kpiContent">
              <div :class="$style.kpiValue">{{ formatNumber(analyticsData.kpis.authenticated_count) }}</div>
              <div :class="$style.kpiLabel">{{ t('survey.analytics.authenticatedResponses') }}</div>
            </div>
          </div>

          <div :class="$style.kpiCard">
            <div :class="$style.kpiIcon">
              <i class="fas fa-user-secret"></i>
            </div>
            <div :class="$style.kpiContent">
              <div :class="$style.kpiValue">{{ formatNumber(analyticsData.kpis.anonymous_count) }}</div>
              <div :class="$style.kpiLabel">{{ t('survey.analytics.anonymousResponses') }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section :class="$style.chartsSection">
        <div :class="$style.chartsGrid">
          <!-- Time Series Chart -->
          <div :class="$style.chartCard">
            <div :class="$style.chartHeader">
              <h3 :class="$style.chartTitle">
                <i class="fas fa-chart-line"></i>
                {{ t('survey.analytics.responsesTrend') }}
              </h3>
              <div :class="$style.chartActions">
                <button 
                  :class="[$style.chartToggle, timeSeriesView === 'responses' ? $style.active : '']"
                  @click="timeSeriesView = 'responses'"
                >
                  {{ t('survey.analytics.responses') }}
                </button>
                <button 
                  :class="[$style.chartToggle, timeSeriesView === 'completion' ? $style.active : '']"
                  @click="timeSeriesView = 'completion'"
                >
                  {{ t('survey.analytics.completionRate') }}
                </button>
              </div>
            </div>
            <div :class="$style.chartContent">
              <div :class="$style.timeSeriesChart">
                <div 
                  v-for="(point, index) in (analyticsData.time_series || [])" 
                  :key="index"
                  :class="$style.chartBar"
                  :title="`${point.period_label || ''}: ${timeSeriesView === 'responses' ? (point.response_count || 0) : ((point.completion_rate || 0) * 100).toFixed(1) + '%'}`"
                >
                  <div 
                    :class="$style.barFill"
                    :style="{ 
                      height: `${getBarHeight(point, timeSeriesView)}%`,
                      backgroundColor: timeSeriesView === 'responses' ? '#997A51' : '#4CAF50'
                    }"
                  ></div>
                  <div :class="$style.barLabel">{{ formatPeriodLabel(point.period_label) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Segments Chart -->
          <div :class="$style.chartCard">
            <div :class="$style.chartHeader">
              <h3 :class="$style.chartTitle">
                <i class="fas fa-chart-pie"></i>
                {{ t('survey.analytics.responseSegments') }}
              </h3>
            </div>
            <div :class="$style.chartContent">
              <div :class="$style.segmentsGrid">
                <!-- Authentication Segment -->
                <div v-if="analyticsData.segments?.by_authentication?.length" :class="$style.segmentGroup">
                  <h4 :class="$style.segmentTitle">{{ t('survey.analytics.byAuthentication') }}</h4>
                  <div :class="$style.segmentChart">
                    <div 
                      v-for="segment in analyticsData.segments.by_authentication" 
                      :key="segment.type || segment.segment"
                      :class="$style.segmentBar"
                    >
                      <div :class="$style.segmentInfo">
                        <span :class="$style.segmentLabel">
                          <i :class="(segment.type || segment.segment) === 'authenticated' ? 'fas fa-shield-alt' : 'fas fa-user-secret'"></i>
                          {{ t(`survey.analytics.segment.${segment.type || segment.segment}`) }}
                        </span>
                        <span :class="$style.segmentValue">
                          {{ formatNumber(segment.count) }} ({{ (segment.percentage * 100).toFixed(1) }}%)
                        </span>
                      </div>
                      <div :class="$style.segmentProgress">
                        <div 
                          :class="$style.segmentFill"
                          :style="{ 
                            width: `${segment.percentage * 100}%`,
                            backgroundColor: segment.segment === 'authenticated' ? '#4CAF50' : '#FF9800'
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Completion Segment -->
                <div v-if="analyticsData.segments?.by_completion?.length" :class="$style.segmentGroup">
                  <h4 :class="$style.segmentTitle">{{ t('survey.analytics.byCompletion') }}</h4>
                  <div :class="$style.segmentChart">
                    <div 
                      v-for="segment in analyticsData.segments.by_completion" 
                      :key="segment.status || segment.segment"
                      :class="$style.segmentBar"
                    >
                      <div :class="$style.segmentInfo">
                        <span :class="$style.segmentLabel">
                          <i :class="(segment.status || segment.segment) === 'complete' ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                          {{ t(`survey.analytics.segment.${segment.status || segment.segment}`) }}
                        </span>
                        <span :class="$style.segmentValue">
                          {{ formatNumber(segment.count) }} ({{ ((segment.percentage || (segment.count / Math.max(1, analyticsData.kpis?.total_responses || 1))) * 100).toFixed(1) }}%)
                        </span>
                      </div>
                      <div :class="$style.segmentProgress">
                        <div 
                          :class="$style.segmentFill"
                          :style="{ 
                            width: `${((segment.percentage || (segment.count / Math.max(1, analyticsData.kpis?.total_responses || 1))) * 100)}%`,
                            backgroundColor: (segment.status || segment.segment) === 'complete' ? '#4CAF50' : '#F44336'
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Questions Summary Section -->
      <section :class="$style.questionsSection">
        <div :class="$style.sectionHeader">
          <h3 :class="$style.sectionTitle">
            <i class="fas fa-question-circle"></i>
            {{ t('survey.analytics.questionsSummary') }}
          </h3>
          <div :class="$style.sectionActions">
            <button 
              :class="$style.toggleButton" 
              @click="showQuestionDetails = !showQuestionDetails"
            >
              <i :class="showQuestionDetails ? 'fas fa-compress' : 'fas fa-expand'"></i>
              {{ showQuestionDetails ? t('survey.analytics.hideDetails') : t('survey.analytics.showDetails') }}
            </button>
          </div>
        </div>

        <div :class="$style.questionsList">
          <div 
            v-for="question in analyticsData.questions_summary" 
            :key="question.question_id || question.id"
            :class="$style.questionCard"
            @click="showQuestionDetails && viewQuestionAnalytics(question.question_id || question.id)"
          >
            <div :class="$style.questionHeader">
              <div :class="$style.questionInfo">
                <div :class="$style.questionNumber">{{ question.order }}</div>
                <div :class="$style.questionContent">
                  <div :class="$style.questionText">{{ question.text || `${t('survey.analytics.question')} ${question.order}` }}</div>
                  <div :class="$style.questionMeta">
                    <span :class="$style.questionType">
                      <i :class="getQuestionTypeIcon(question.type)"></i>
                      {{ getQuestionTypeLabel(question.type) }}
                    </span>
                    <span v-if="question.is_required" :class="$style.requiredBadge">
                      <i class="fas fa-asterisk"></i>
                      {{ t('survey.analytics.required') }}
                    </span>
                  </div>
                </div>
              </div>
              <div :class="$style.questionStats">
                <div :class="$style.statItem">
                  <div :class="$style.statValue">{{ formatNumber(question.answer_count) }}</div>
                  <div :class="$style.statLabel">{{ t('survey.analytics.answers') }}</div>
                </div>
                <div :class="$style.statItem">
                  <div :class="$style.statValue">{{ (question.answer_rate * 100).toFixed(1) }}%</div>
                  <div :class="$style.statLabel">{{ t('survey.analytics.answerRate') }}</div>
                </div>
              </div>
            </div>

            <div :class="$style.questionProgress">
              <div :class="$style.progressBackground">
                <div 
                  :class="$style.progressFill"
                  :style="{ width: `${question.answer_rate * 100}%` }"
                ></div>
              </div>
              <div :class="$style.progressStats">
                <span :class="$style.progressAnswered">
                  {{ t('survey.analytics.answered') }}: {{ formatNumber(question.answer_count) }}
                </span>
                <span :class="$style.progressSkipped">
                  {{ t('survey.analytics.skipped') }}: {{ formatNumber(question.skipped_count) }}
                </span>
              </div>
            </div>

            <div v-if="question.top_response" :class="$style.questionInsight">
              <div :class="$style.insightLabel">{{ t('survey.analytics.topResponse') }}:</div>
              <div :class="$style.insightValue">{{ question.top_response }}</div>
            </div>

            <!-- Question Analytics Preview -->
            <div v-if="showQuestionDetails && questionAnalytics[question.id]" :class="$style.questionAnalytics">
              <div :class="$style.analyticsPreview">
                <!-- This will be populated by question-specific analytics -->
                <component 
                  :is="getQuestionAnalyticsComponent(question.type)"
                  :question="question"
                  :analytics="questionAnalytics[question.id]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.errorState">
      <div :class="$style.errorContent">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>{{ t('survey.analytics.errorTitle') }}</h3>
        <p>{{ error }}</p>
        <button :class="$style.retryButton" @click="refreshAnalytics">
          <i class="fas fa-redo"></i>
          {{ t('common.tryAgain') }}
        </button>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" :class="$style.modalOverlay" @click="showExportModal = false">
      <div :class="$style.exportModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3>{{ t('survey.analytics.exportData') }}</h3>
          <button :class="$style.modalClose" @click="showExportModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div :class="$style.modalContent">
          <div :class="$style.exportOptions">
            <label :class="$style.exportOption">
              <input type="radio" v-model="exportFormat" value="csv" />
              <span>{{ t('survey.analytics.exportFormat.csv') }}</span>
            </label>
            <label :class="$style.exportOption">
              <input type="radio" v-model="exportFormat" value="json" />
              <span>{{ t('survey.analytics.exportFormat.json') }}</span>
            </label>
            <label :class="$style.exportOption">
              <input type="radio" v-model="exportFormat" value="xlsx" />
              <span>{{ t('survey.analytics.exportFormat.xlsx') }}</span>
            </label>
          </div>
          
          <div :class="$style.exportFilters">
            <label :class="$style.checkboxLabel">
              <input type="checkbox" v-model="includePersonalData" />
              {{ t('survey.analytics.includePersonalData') }}
            </label>
            <label :class="$style.checkboxLabel">
              <input type="checkbox" v-model="includeQuestionAnalytics" />
              {{ t('survey.analytics.includeQuestionAnalytics') }}
            </label>
          </div>
        </div>
        
        <div :class="$style.modalActions">
          <button :class="$style.cancelButton" @click="showExportModal = false">
            {{ t('common.cancel') }}
          </button>
          <button 
            :class="$style.exportButton" 
            @click="performExport" 
            :disabled="isExporting"
          >
            <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
            {{ isExporting ? t('survey.analytics.exporting') : t('survey.analytics.export') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Question Details Modal -->
    <div v-if="selectedQuestionAnalytics" :class="$style.modalOverlay" @click="selectedQuestionAnalytics = null">
      <div :class="$style.questionModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3>{{ t('survey.analytics.questionAnalytics') }}</h3>
          <button :class="$style.modalClose" @click="selectedQuestionAnalytics = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div :class="$style.modalContent">
          <!-- Detailed question analytics will be rendered here -->
          <component 
            :is="getQuestionAnalyticsComponent(selectedQuestionAnalytics.question.type)"
            :question="selectedQuestionAnalytics.question"
            :analytics="selectedQuestionAnalytics.data"
            :detailed="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { apiClient } from '../../services/jwtAuthService'

// Props
interface Props {
  surveyId?: string
  surveyAnalytics?: any
  questionAnalytics?: any[]
}
const props = defineProps<Props>()

// Router
const route = useRoute()
const router = useRouter()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// State
const surveyInfo = ref<any>(null)
const analyticsData = ref<any>(null)
const questionAnalytics = ref<Record<string, any>>({})


const isLoading = ref(false)
const error = ref<string | null>(null)

// Filters
const startDate = ref('')
const endDate = ref('')
const groupBy = ref('day')
const includePersonalData = ref(false)

// UI State
const timeSeriesView = ref<'responses' | 'completion'>('responses')
const showQuestionDetails = ref(false)
const showExportModal = ref(false)
const selectedQuestionAnalytics = ref<any>(null)

// Export State
const exportFormat = ref('csv')
const includeQuestionAnalytics = ref(true)
const isExporting = ref(false)

// Get survey ID from route or props
const surveyId = computed(() => props.surveyId || route.params.surveyId as string)

// Lazy load question analytics components
const SingleChoiceAnalytics = defineAsyncComponent(() => import('../../components/Analytics/SingleChoiceAnalytics.vue'))
const MultipleChoiceAnalytics = defineAsyncComponent(() => import('../../components/Analytics/MultipleChoiceAnalytics.vue'))
const RatingAnalytics = defineAsyncComponent(() => import('../../components/Analytics/RatingAnalytics.vue'))
const YesNoAnalytics = defineAsyncComponent(() => import('../../components/Analytics/YesNoAnalytics.vue'))
const TextAnalytics = defineAsyncComponent(() => import('../../components/Analytics/TextAnalytics.vue'))

// Methods
const loadSurveyAnalytics = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const params = new URLSearchParams()
    if (startDate.value) params.append('start', new Date(startDate.value).toISOString())
    if (endDate.value) params.append('end', new Date(endDate.value).toISOString())
    if (groupBy.value) params.append('group_by', groupBy.value)
    if (includePersonalData.value) params.append('include_personal', 'true')
    params.append('tz', 'Asia/Dubai')
    
    const response = await apiClient.get(`/surveys/admin/surveys/${surveyId.value}/dashboard/?${params.toString()}`)

    if (response.data?.status === 'success') {
      analyticsData.value = response.data.data
      surveyInfo.value = response.data.data.survey
      
      // Load question analytics if details are enabled
      if (showQuestionDetails.value) {
        await loadQuestionAnalytics()
      }
    } else {
      throw new Error(response.data?.message || 'Failed to load analytics')
    }
  } catch (err: any) {
    console.error('Error loading survey analytics:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to load survey analytics'
  } finally {
    isLoading.value = false
  }
}

const loadQuestionAnalytics = async () => {
  if (!analyticsData.value?.questions_summary) return
  
  try {
    const promises = analyticsData.value.questions_summary.map(async (question: any) => {
      const params = new URLSearchParams()
      if (startDate.value) params.append('start', new Date(startDate.value).toISOString())
      if (endDate.value) params.append('end', new Date(endDate.value).toISOString())
      if (includePersonalData.value) params.append('include_personal', 'true')
      
      const response = await apiClient.get(
        `/surveys/admin/surveys/${surveyId.value}/questions/${question.id}/dashboard/?${params.toString()}`
      )

      if (response.data?.status === 'success') {
        return { id: question.id, data: response.data.data }
      }
      return null
    })
    
    const results = await Promise.all(promises)
    const analytics: Record<string, any> = {}
    
    results.forEach(result => {
      if (result) {
        analytics[result.id] = result.data
      }
    })
    
    questionAnalytics.value = analytics
  } catch (err) {
    console.error('Error loading question analytics:', err)
  }
}

const refreshAnalytics = () => {
  loadSurveyAnalytics()
}

const viewQuestionAnalytics = async (questionId: string) => {
  if (questionAnalytics.value[questionId]) {
    const question = analyticsData.value.questions_summary.find((q: any) => q.id === questionId)
    selectedQuestionAnalytics.value = {
      question,
      data: questionAnalytics.value[questionId]
    }
  }
}

const getQuestionAnalyticsComponent = (type: string) => {
  const components = {
    single_choice: SingleChoiceAnalytics,
    multiple_choice: MultipleChoiceAnalytics,
    rating: RatingAnalytics,
    yes_no: YesNoAnalytics,
    text: TextAnalytics,
    textarea: TextAnalytics
  }
  return components[type as keyof typeof components] || TextAnalytics
}

const performExport = async () => {
  try {
    isExporting.value = true
    
    const params = new URLSearchParams()
    params.append('format', exportFormat.value)
    if (startDate.value) params.append('start', new Date(startDate.value).toISOString())
    if (endDate.value) params.append('end', new Date(endDate.value).toISOString())
    if (includePersonalData.value) params.append('include_personal', 'true')
    if (includeQuestionAnalytics.value) params.append('include_questions', 'true')
    
    const response = await apiClient.get(
      `/surveys/admin/surveys/${surveyId.value}/analytics/export/?${params.toString()}`,
      { responseType: 'blob' }
    )
    
    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `survey_analytics_${surveyId.value}_${new Date().toISOString().split('T')[0]}.${exportFormat.value}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    showExportModal.value = false
  } catch (err: any) {
    console.error('Export error:', err)
    alert(t.value('survey.analytics.exportError'))
  } finally {
    isExporting.value = false
  }
}

// Utility functions
const formatNumber = (num: number) => {
  return new Intl.NumberFormat(isRTL.value ? 'ar-SA' : 'en-US').format(num)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const locale = isRTL.value ? 'ar-SA' : 'en-US'
  return date.toLocaleDateString(locale, {
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
}

const formatPeriodLabel = (label: string) => {
  // Handle undefined or null labels
  if (!label || typeof label !== 'string') return ''
  
  // Truncate long period labels for better display
  if (groupBy.value === 'day') return label.slice(0, 6) // "Aug 15"
  return label
}

const getBarHeight = (point: any, view: string) => {
  if (!analyticsData.value?.time_series?.length || !point) return 0
  
  const values = analyticsData.value.time_series.map((p: any) => 
    view === 'responses' ? (p.response_count || 0) : ((p.completion_rate || 0) * 100)
  ).filter((v: any) => typeof v === 'number' && !isNaN(v))
  
  if (values.length === 0) return 0
  
  const maxValue = Math.max(...values)
  const currentValue = view === 'responses' ? (point.response_count || 0) : ((point.completion_rate || 0) * 100)
  
  return maxValue > 0 ? (currentValue / maxValue) * 100 : 0
}

const getQuestionTypeIcon = (type: string) => {
  const icons = {
    text: 'fas fa-font',
    textarea: 'fas fa-align-left',
    single_choice: 'fas fa-dot-circle',
    multiple_choice: 'fas fa-check-square',
    rating: 'fas fa-star',
    yes_no: 'fas fa-toggle-on'
  }
  return icons[type as keyof typeof icons] || 'fas fa-question'
}

const getQuestionTypeLabel = (type: string) => {
  return t.value(`survey.questionTypes.${type}`)
}

const goBack = () => {
  router.go(-1)
}

// Helper function to transform analytics data
const transformAnalyticsData = (data: any) => {
  const transformed = data.data || data
  
  // Transform time_series data to add period_label
  if (transformed.time_series) {
    transformed.time_series = transformed.time_series.map((item: any) => ({
      ...item,
      period_label: item.period_label || item.period,
      response_count: item.response_count || item.responses,
      completion_rate: item.completion_rate || (item.complete / (item.complete + item.incomplete || 1))
    }))
  }
  
  // Transform segments data to match expected structure
  if (transformed.segments) {
    transformed.segments.by_authentication = transformed.segments.by_auth || transformed.segments.by_authentication
    // by_completion should already be correct
  }
  
  return transformed
}

// Watchers
watch(showQuestionDetails, (newValue) => {
  if (newValue && analyticsData.value && Object.keys(questionAnalytics.value).length === 0) {
    loadQuestionAnalytics()
  }
})

// Watch for changes in survey analytics props
watch(() => props.surveyAnalytics, (newData) => {
  if (newData) {
    analyticsData.value = transformAnalyticsData(newData)
    surveyInfo.value = newData.data?.survey || newData.survey
  }
}, { immediate: true })

// Watch for changes in question analytics props
watch(() => props.questionAnalytics, (newData) => {
  if (newData) {
    questionAnalytics.value = {}
    newData.forEach((question: any) => {
      questionAnalytics.value[question.question_id || question.id] = question
    })
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // If survey analytics data is provided via props, use it
  if (props.surveyAnalytics) {
    // Transform the provided data to match component expectations
    analyticsData.value = transformAnalyticsData(props.surveyAnalytics)
    surveyInfo.value = props.surveyAnalytics.data?.survey || props.surveyAnalytics.survey
  }
  
  // If question analytics data is provided via props, use it
  if (props.questionAnalytics) {
    // Transform the provided question data
    props.questionAnalytics.forEach((question: any) => {
      questionAnalytics.value[question.question_id || question.id] = question
    })
  }
  
  // If no data provided via props and we have a survey ID, fetch the data
  if (!props.surveyAnalytics && surveyId.value) {
    loadSurveyAnalytics()
  }
})
</script>

<style module src="./SurveyAnalytics.module.css">
/* CSS Module styles are imported from SurveyAnalytics.module.css */
</style>

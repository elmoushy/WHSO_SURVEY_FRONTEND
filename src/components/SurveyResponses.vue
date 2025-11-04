<template>
  <div :class="$style.responsesContainer">
    <!-- Header Section -->
    <div :class="$style.header">
      <div :class="$style.headerContent">
        <div :class="$style.titleSection">
          <h1 :class="$style.title">{{ t('responses.title') }}</h1>
          <div :class="$style.stats">
            <div :class="$style.statItem">
              <span :class="$style.statValue">{{ totalResponses }}</span>
              <span :class="$style.statLabel">{{ t('responses.totalResponses') }}</span>
            </div>
            <div :class="$style.statItem">
              <span :class="$style.statValue">{{ completedResponses }}</span>
              <span :class="$style.statLabel">{{ t('responses.completed') }}</span>
            </div>
          </div>
        </div>
        <div :class="$style.headerActions">
          <button :class="$style.refreshBtn" @click="fetchResponses" :disabled="loading">
            <span>{{ t('responses.refreshData') }}</span>
          </button>
          <button :class="$style.exportBtn" @click="showExportModal = true">
            <span>{{ t('responses.exportAction') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p>{{ t('responses.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.errorContainer">
      <p>{{ t('responses.error') }}</p>
      <button :class="$style.retryBtn" @click="fetchResponses">
        {{ t('responses.retry') }}
      </button>
    </div>

    <!-- Main Content -->
    <div v-else :class="$style.mainContent">
      <!-- Tab Navigation -->
      <div :class="$style.tabNavigation">
        <button
          :class="[$style.tabButton, activeTab === 'responses' && $style.activeTab]"
          @click="activeTab = 'responses'"
        >
          <i class="fas fa-table"></i>
          {{ t('responses.responsesTab') }}
        </button>
        <button
          :class="[$style.tabButton, activeTab === 'analytics' && $style.activeTab]"
          @click="activeTab = 'analytics'"
        >
          <i class="fas fa-chart-line"></i>
          {{ t('responses.analyticsTab') }}
        </button>
        <button
          :class="[$style.tabButton, activeTab === 'questionAnalytics' && $style.activeTab]"
          @click="activeTab = 'questionAnalytics'"
        >
          <i class="fas fa-chart-bar"></i>
          {{ t('responses.questionAnalyticsTab') }}
        </button>
      </div>

      <!-- Tab Content -->
      <div :class="$style.tabContent">
        <!-- Responses Tab -->
        <div v-if="activeTab === 'responses'" :class="$style.responsesTab">
          <!-- Filters and Search -->
          <div :class="$style.filtersSection">
            <div :class="$style.searchContainer">
              <input
                v-model="searchQuery"
                :class="$style.searchInput"
                :placeholder="t('responses.searchPlaceholder')"
                type="text"
              />
            </div>
            
            <div :class="$style.filtersContainer">
              <div :class="$style.filterGroup">
                <label :class="$style.filterLabel">{{ t('responses.filterBy') }}:</label>
                <select v-model="selectedFilter" :class="$style.filterSelect">
                  <option value="all">{{ t('responses.filters.all') }}</option>
                  <option value="completed">{{ t('responses.filters.completed') }}</option>
                  <option value="incomplete">{{ t('responses.filters.incomplete') }}</option>
                </select>
              </div>
              
              <div :class="$style.filterGroup">
                <label :class="$style.filterLabel">{{ t('responses.sortBy') }}:</label>
                <select v-model="selectedSort" :class="$style.filterSelect">
                  <option value="newest">{{ t('responses.sorting.newest') }}</option>
                  <option value="oldest">{{ t('responses.sorting.oldest') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Responses Table -->
          <div :class="$style.tableContainer">
            <div v-if="filteredResponses.length === 0" :class="$style.noResponsesContainer">
              <h3>{{ t('responses.noResponses') }}</h3>
              <p>{{ t('responses.noResponsesDescription') }}</p>
            </div>

            <table v-else :class="$style.responsesTable">
              <thead>
                <tr>
                  <th>{{ t('responses.responseId') }}</th>
                  <th>{{ t('responses.surveyTitle') }}</th>
                  <th>{{ t('responses.respondent') }}</th>
                  <th>{{ t('responses.submittedAt') }}</th>
                  <th>{{ t('responses.status') }}</th>
                  <th :class="$style.actionsHeader">{{ t('responses.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="response in paginatedResponses" :key="response.id" :class="$style.responseRow">
                  <td :class="$style.responseId">#{{ response.id }}</td>
                  <td :class="$style.surveyTitle">{{ response.survey_title || 'Unknown Survey' }}</td>
                  <td :class="$style.respondent">
                    {{ response.user_email || t('responses.anonymousUser') }}
                  </td>
                  <td :class="$style.submittedAt">
                    {{ formatDate(response.submitted_at) }}
                  </td>
                  <td>
                    <span 
                      :class="[
                        $style.statusBadge,
                        response.is_complete ? $style.completed : $style.incomplete
                      ]"
                    >
                      {{ response.is_complete ? t('responses.completed') : t('responses.incomplete') }}
                    </span>
                  </td>
                  <td :class="$style.actions">
                    <button 
                      :class="$style.viewBtn"
                      @click="viewResponseDetails(response)"
                    >
                      {{ t('responses.viewDetails') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="totalPages > 1" :class="$style.pagination">
              <button 
                :class="$style.pageBtn"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                Previous
              </button>
              
              <span :class="$style.pageInfo">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              
              <button 
                :class="$style.pageBtn"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Survey Analytics Tab -->
        <div v-if="activeTab === 'analytics'" :class="$style.analyticsTab">
          <SurveyAnalytics
            :analytics="surveyAnalytics"
            :survey="survey"
            :loading="analyticsLoading"
            @period-change="onAnalyticsPeriodClick"
            @filters-change="onAnalyticsFiltersChange"
          />
        </div>

        <!-- Question Analytics Tab -->
        <div v-if="activeTab === 'questionAnalytics'" :class="$style.questionAnalyticsTab">
          <div v-if="!selectedQuestion" :class="$style.questionSelector">
            <h3>{{ t('responses.selectQuestion') }}</h3>
            <div :class="$style.questionsList">
              <div
                v-for="question in surveyQuestions"
                :key="question.id"
                :class="$style.questionCard"
                @click="selectQuestion(question)"
              >
                <div :class="$style.questionInfo">
                  <div :class="$style.questionTitle">{{ question.question_text }}</div>
                  <div :class="$style.questionType">{{ getQuestionTypeLabel(question.question_type) }}</div>
                </div>
                <div :class="$style.questionStats">
                  <span :class="$style.responseCount">{{ question.response_count || 0 }} responses</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else :class="$style.questionAnalyticsContainer">
            <div :class="$style.questionAnalyticsHeader">
              <button :class="$style.backButton" @click="selectedQuestion = null">
                <i class="fas fa-arrow-left"></i>
                {{ t('responses.backToQuestions') }}
              </button>
              <h3>{{ selectedQuestion.question_text }}</h3>
            </div>

            <div :class="$style.questionAnalyticsContent">
              <!-- Single Choice Analytics -->
              <SingleChoiceAnalytics
                v-if="selectedQuestion.question_type === 'single_choice' && questionAnalytics"
                :analytics="questionAnalytics"
                :question="selectedQuestion"
                :loading="questionAnalyticsLoading"
                @option-click="onAnalyticsQuestionClick"
              />

              <!-- Multiple Choice Analytics -->
              <MultipleChoiceAnalytics
                v-else-if="selectedQuestion.question_type === 'multiple_choice' && questionAnalytics"
                :analytics="questionAnalytics"
                :question="selectedQuestion"
                :loading="questionAnalyticsLoading"
                @option-click="onAnalyticsQuestionClick"
              />

              <!-- Rating Analytics -->
              <RatingAnalytics
                v-else-if="selectedQuestion.question_type === 'rating' && questionAnalytics"
                :analytics="questionAnalytics"
                :question="selectedQuestion"
                :loading="questionAnalyticsLoading"
                @rating-click="onAnalyticsQuestionClick"
              />

              <!-- Yes/No Analytics -->
              <YesNoAnalytics
                v-else-if="selectedQuestion.question_type === 'yes_no' && questionAnalytics"
                :analytics="questionAnalytics"
                :question="selectedQuestion"
                :loading="questionAnalyticsLoading"
                @segment-click="onAnalyticsQuestionClick"
              />

              <!-- Text Analytics -->
              <TextAnalytics
                v-else-if="['text', 'textarea'].includes(selectedQuestion.question_type) && questionAnalytics"
                :analytics="questionAnalytics"
                :question="selectedQuestion"
                :loading="questionAnalyticsLoading"
                @response-click="onAnalyticsQuestionClick"
              />

              <!-- Loading state -->
              <div v-else-if="questionAnalyticsLoading" :class="$style.loadingState">
                <div :class="$style.loadingSpinner"></div>
                <p>{{ t('responses.loadingAnalytics') }}</p>
              </div>

              <!-- Fallback for unsupported question types -->
              <div v-else :class="$style.unsupportedQuestionType">
                <div :class="$style.unsupportedIcon">
                  <i class="fas fa-question-circle"></i>
                </div>
                <h4>{{ t('responses.unsupportedQuestionType') }}</h4>
                <p>{{ t('responses.unsupportedQuestionTypeDescription') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" :class="$style.modalOverlay" @click="showExportModal = false">
      <div :class="$style.exportModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3>{{ t('responses.exportTitle') }}</h3>
          <button :class="$style.closeBtn" @click="showExportModal = false">×</button>
        </div>
        
        <div :class="$style.modalContent">
          <div :class="$style.exportOptions">
            <div :class="$style.formatSection">
              <h4>{{ t('responses.export.csv') }}</h4>
              <p>{{ t('responses.export.csvDescription') }}</p>
              <button :class="$style.exportFormatBtn" @click="exportData('csv')">
                {{ t('responses.downloadCSV') }}
              </button>
            </div>
            
            <div :class="$style.formatSection">
              <h4>{{ t('responses.export.json') }}</h4>
              <p>{{ t('responses.export.jsonDescription') }}</p>
              <button :class="$style.exportFormatBtn" @click="exportData('json')">
                {{ t('responses.downloadJSON') }}
              </button>
            </div>
          </div>

          <div :class="$style.exportSettings">
            <div :class="$style.settingItem">
              <label>
                <input 
                  v-model="exportSettings.includeHeaders" 
                  type="checkbox" 
                  :class="$style.checkbox"
                />
                {{ t('responses.includeHeaders') }}
              </label>
            </div>
            
            <div :class="$style.settingItem">
              <label>
                <input 
                  v-model="exportSettings.includeDateRange" 
                  type="checkbox" 
                  :class="$style.checkbox"
                />
                {{ t('responses.includeDateRange') }}
              </label>
            </div>

            <div v-if="exportSettings.includeDateRange" :class="$style.dateRange">
              <div :class="$style.dateInput">
                <label>{{ t('responses.fromDate') }}:</label>
                <input 
                  v-model="exportSettings.startDate" 
                  type="date" 
                  :class="$style.dateField"
                />
              </div>
              <div :class="$style.dateInput">
                <label>{{ t('responses.toDate') }}:</label>
                <input 
                  v-model="exportSettings.endDate" 
                  type="date" 
                  :class="$style.dateField"
                />
              </div>
            </div>
          </div>
        </div>

        <div :class="$style.modalActions">
          <button :class="$style.cancelBtn" @click="showExportModal = false">
            {{ t('responses.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Response Details Modal -->
    <div v-if="showDetailsModal" :class="$style.modalOverlay" @click="showDetailsModal = false">
      <div :class="$style.detailsModal" @click.stop>
        <div :class="$style.modalHeader">
          <h3>{{ t('responses.responseDetails') }}</h3>
          <button :class="$style.closeBtn" @click="showDetailsModal = false">×</button>
        </div>
        
        <div :class="$style.modalContent">
          <div v-if="selectedResponse" :class="$style.responseInfo">
            <div :class="$style.infoGrid">
              <div :class="$style.infoItem">
                <label>{{ t('responses.responseId') }}:</label>
                <span>#{{ selectedResponse.id }}</span>
              </div>
              <div :class="$style.infoItem">
                <label>{{ t('responses.submissionDate') }}:</label>
                <span>{{ formatDate(selectedResponse.submitted_at) }}</span>
              </div>
              <div :class="$style.infoItem">
                <label>{{ t('responses.respondent') }}:</label>
                <span>{{ selectedResponse.user_email || t('responses.anonymousUser') }}</span>
              </div>
              <div :class="$style.infoItem">
                <label>{{ t('responses.status') }}:</label>
                <span 
                  :class="[
                    $style.statusBadge,
                    selectedResponse.is_complete ? $style.completed : $style.incomplete
                  ]"
                >
                  {{ selectedResponse.is_complete ? t('responses.completed') : t('responses.incomplete') }}
                </span>
              </div>
            </div>

            <div :class="$style.answersSection">
              <h4>{{ t('responses.answers') }}</h4>
              <div v-if="selectedResponse.responses && selectedResponse.responses.length > 0" :class="$style.answersList">
                <div 
                  v-for="answer in selectedResponse.responses" 
                  :key="answer.question_id" 
                  :class="$style.answerItem"
                >
                  <div :class="$style.questionText">
                    {{ answer.question_text || `Question ${answer.question_id}` }}
                  </div>
                  <div :class="$style.answerValue">
                    {{ answer.answer || t('responses.noAnswer') }}
                  </div>
                </div>
              </div>
              <div v-else :class="$style.noAnswers">
                {{ t('responses.noAnswer') }}
              </div>
            </div>
          </div>
        </div>

        <div :class="$style.modalActions">
          <button :class="$style.cancelBtn" @click="showDetailsModal = false">
            {{ t('responses.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { apiClient } from '@/services/jwtAuthService'
import SurveyAnalytics from './Analytics/SurveyAnalytics.vue'
import SingleChoiceAnalytics from './Analytics/SingleChoiceAnalytics.vue'
import MultipleChoiceAnalytics from './Analytics/MultipleChoiceAnalytics.vue'
import RatingAnalytics from './Analytics/RatingAnalytics.vue'
import YesNoAnalytics from './Analytics/YesNoAnalytics.vue'
import TextAnalytics from './Analytics/TextAnalytics.vue'

const { t } = useI18n()

// Types
interface SurveyResponse {
  id: number
  survey_id: number
  survey_title?: string
  user_email?: string
  user_id?: number
  is_complete: boolean
  submitted_at: string
  responses?: Array<{
    question_id: number
    question_text?: string
    answer: string
  }>
}

interface ExportSettings {
  includeHeaders: boolean
  includeDateRange: boolean
  startDate: string
  endDate: string
}

// Reactive data
const route = useRoute()
const loading = ref(false)
const error = ref(false)
const responses = ref<SurveyResponse[]>([])
const searchQuery = ref('')
const selectedFilter = ref('all')
const selectedSort = ref('newest')
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Modal states
const showExportModal = ref(false)
const showDetailsModal = ref(false)
const selectedResponse = ref<SurveyResponse | null>(null)

// Export settings
const exportSettings = ref<ExportSettings>({
  includeHeaders: true,
  includeDateRange: false,
  startDate: '',
  endDate: ''
})

// Question interface for typing
interface SurveyQuestion {
  id: string
  question_text: string
  question_type: string
  response_count?: number
}

// Tab management
const activeTab = ref('responses')
const selectedQuestion = ref<SurveyQuestion | null>(null)

// Analytics data
const surveyAnalytics = ref(null)
const questionAnalytics = ref(null)
const survey = ref(null)
const surveyQuestions = ref<SurveyQuestion[]>([])
const analyticsLoading = ref(false)
const questionAnalyticsLoading = ref(false)

// Computed properties
const surveyId = computed(() => route.params.surveyId as string)

const totalResponses = computed(() => responses.value.length)

const completedResponses = computed(() => 
  responses.value.filter(r => r.is_complete).length
)

const filteredResponses = computed(() => {
  let filtered = responses.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(response => 
      response.user_email?.toLowerCase().includes(query) ||
      response.survey_title?.toLowerCase().includes(query) ||
      response.id.toString().includes(query)
    )
  }

  // Apply completion filter
  if (selectedFilter.value === 'completed') {
    filtered = filtered.filter(r => r.is_complete)
  } else if (selectedFilter.value === 'incomplete') {
    filtered = filtered.filter(r => !r.is_complete)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime()
    const dateB = new Date(b.submitted_at).getTime()
    
    if (selectedSort.value === 'newest') {
      return dateB - dateA
    } else {
      return dateA - dateB
    }
  })

  return filtered
})

const totalPages = computed(() => 
  Math.ceil(filteredResponses.value.length / itemsPerPage.value)
)

const paginatedResponses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredResponses.value.slice(start, end)
})

// Methods
const fetchResponses = async () => {
  loading.value = true
  error.value = false
  
  try {
    let endpoint = '/api/surveys/admin/responses/'
    
    // If we have a specific survey ID, get responses for that survey
    if (surveyId.value && surveyId.value !== 'all') {
      endpoint = `/api/surveys/admin/surveys/${surveyId.value}/responses/`
    }
    
    const result = await apiClient.get(endpoint)
    responses.value = result.data || []
  } catch (err) {
    // Logging removed for production
    error.value = true
  } finally {
    loading.value = false
  }
}

const viewResponseDetails = async (response: SurveyResponse) => {
  try {
    // Fetch detailed response data if not already loaded
    if (!response.responses) {
      const detailResult = await apiClient.get(`/api/surveys/admin/responses/${response.id}/`)
      selectedResponse.value = detailResult.data
    } else {
      selectedResponse.value = response
    }
    
    showDetailsModal.value = true
  } catch (err) {
    // Logging removed for production
  }
}

const exportData = async (format: 'csv' | 'json') => {
  try {
    let data = filteredResponses.value

    // Apply date range filter if enabled
    if (exportSettings.value.includeDateRange && exportSettings.value.startDate && exportSettings.value.endDate) {
      const startDate = new Date(exportSettings.value.startDate)
      const endDate = new Date(exportSettings.value.endDate)
      
      data = data.filter(response => {
        const responseDate = new Date(response.submitted_at)
        return responseDate >= startDate && responseDate <= endDate
      })
    }

    if (format === 'csv') {
      exportToCSV(data)
    } else {
      exportToJSON(data)
    }
    
    showExportModal.value = false
  } catch (err) {
    // Logging removed for production
  }
}

const exportToCSV = (data: SurveyResponse[]) => {
  const headers = ['Response ID', 'Survey Title', 'Respondent', 'Submitted At', 'Status', 'Completion']
  const csvContent = []
  
  if (exportSettings.value.includeHeaders) {
    csvContent.push(headers.join(','))
  }
  
  data.forEach(response => {
    const row = [
      response.id,
      `"${response.survey_title || 'Unknown'}"`,
      `"${response.user_email || 'Anonymous'}"`,
      response.submitted_at,
      response.is_complete ? 'Complete' : 'Incomplete',
      response.is_complete ? '100%' : '0%'
    ]
    csvContent.push(row.join(','))
  })
  
  downloadFile(csvContent.join('\n'), `survey-responses-${Date.now()}.csv`, 'text/csv')
}

const exportToJSON = (data: SurveyResponse[]) => {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, `survey-responses-${Date.now()}.json`, 'application/json')
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ar-EG', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Analytics methods
const loadAnalytics = async () => {
  if (!surveyId.value || surveyId.value === 'all') return
  
  analyticsLoading.value = true
  try {
    // Load survey analytics
    const surveyResponse = await apiClient.get(`/api/surveys/admin/surveys/${surveyId.value}/dashboard/`)
    surveyAnalytics.value = surveyResponse.data
    
    // Load survey details and questions
    const surveyDetailsResponse = await apiClient.get(`/api/surveys/admin/surveys/${surveyId.value}/`)
    survey.value = surveyDetailsResponse.data
    surveyQuestions.value = surveyDetailsResponse.data.questions || []
  } catch (err) {
    console.error('Error loading analytics:', err)
  } finally {
    analyticsLoading.value = false
  }
}

const loadQuestionAnalytics = async (questionId: string) => {
  if (!surveyId.value || surveyId.value === 'all') return
  
  questionAnalyticsLoading.value = true
  try {
    const response = await apiClient.get(`/api/surveys/admin/surveys/${surveyId.value}/questions/${questionId}/dashboard/`)
    questionAnalytics.value = response.data
  } catch (err) {
    console.error('Error loading question analytics:', err)
  } finally {
    questionAnalyticsLoading.value = false
  }
}

const selectQuestion = (question: SurveyQuestion) => {
  selectedQuestion.value = question
  loadQuestionAnalytics(question.id)
}

const getQuestionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'single_choice': 'Single Choice',
    'multiple_choice': 'Multiple Choice',
    'rating': 'Rating',
    'yes_no': 'Yes/No',
    'text': 'Text',
    'textarea': 'Long Text'
  }
  return labels[type] || type
}

// Analytics event handlers
const onAnalyticsPeriodClick = (_period: any) => {
  // Handle period change logic here
}

const onAnalyticsFiltersChange = (_filters: any) => {
  // Handle filters change logic here
}

const onAnalyticsQuestionClick = (_data: any) => {
  // Handle analytics question click logic here
}

// Lifecycle
onMounted(() => {
  fetchResponses()
  // Load analytics when component is mounted
  if (surveyId.value && surveyId.value !== 'all') {
    loadAnalytics()
  }
})

// Watch for tab changes to load analytics when needed
// const loadAnalyticsIfNeeded = () => {
//   if (activeTab.value === 'analytics' && !surveyAnalytics.value) {
//     loadAnalytics()
//   }
// }

// Expose tab change function to make analytics load when tab is clicked
// const handleTabChange = (tab: string) => {
//   activeTab.value = tab
//   if (tab === 'analytics' && !surveyAnalytics.value) {
//     loadAnalytics()
//   }
// }
</script>

<style module src="./SurveyResponses.module.css"></style>

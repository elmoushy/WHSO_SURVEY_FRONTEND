<template>
  <div :class="$style.surveyAnalytics" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Analytics Header -->
    <!-- <div :class="$style.analyticsHeader">
      <div :class="$style.headerIcon">
        <i class="fas fa-chart-line"></i>
      </div>
      <div :class="$style.headerContent">
        <h2 :class="$style.headerTitle">لوحة التحليلات</h2>
        <p :class="$style.headerSubtitle">نظرة عامة على أداء الاستبيان خلال الفترة المحددة.</p>
      </div>
      <div :class="$style.headerActions">
        <button @click="refreshAnalytics" :class="$style.refreshButton" :disabled="loading">
          <i :class="['fas', 'fa-sync-alt', { [$style.spinning]: loading }]"></i>
          تحديث
        </button>
      </div>
    </div> -->

    <!-- Date Filter Section -->
    <!-- <div :class="$style.filterSection">
      <div :class="$style.dateFilters">
        <div :class="$style.dateGroup">
          <label>تاريخ البداية</label>
          <input
            type="datetime-local"
            v-model="filters.start"
            :class="$style.dateInput"
            @change="onFiltersChange"
          />
        </div>
        <div :class="$style.dateGroup">
          <label>تاريخ النهاية</label>
          <input
            type="datetime-local"
            v-model="filters.end"
            :class="$style.dateInput"
            @change="onFiltersChange"
          />
        </div>
        <div :class="$style.dateGroup">
          <label>تجميع حسب</label>
          <select v-model="filters.group_by" :class="$style.selectInput" @change="onFiltersChange">
            <option value="day">اليوم</option>
            <option value="week">الأسبوع</option>
            <option value="month">الشهر</option>
          </select>
        </div>
      </div>
    </div> -->

    <!-- KPIs Section - REMOVED in v2 -->
    
    <!-- Charts Section -->
    <div :class="$style.chartsSection">
      <!-- Heatmap Row (NEW in v2) -->
      <div :class="$style.heatmapRow">
        <div :class="[$style.chartCard, $style.fullWidthCard]">
          <div :class="$style.chartHeader">
            <div>
              <h3 :class="$style.chartTitle">{{ isRTL ? 'خريطة الحرارة للردود' : 'Response Heatmap' }}</h3>
              <p :class="$style.chartSubtitle">{{ isRTL ? 'توزيع الردود حسب اليوم والساعة' : 'Response distribution by day and hour' }}</p>
            </div>
                <div :class="$style.legendContainer">
        <div :class="$style.legendContent">
          <div :class="$style.legendScale">
                        <span :class="$style.legendLabel">{{ isRTL ? 'مرتفع' : 'High' }}</span>

            <div :class="$style.legendGradient">
              <div
                v-for="i in 10"
                :key="`grad-${i}`"
                :class="$style.gradientStep"
                :style="{ background: getColorForIntensity((i - 1) / 9) }"
              ></div>
            </div>
                        <span :class="$style.legendLabel">{{ isRTL ? 'منخفض' : 'Low' }}</span>
          </div>
       
        </div>
      </div>
          </div>
          <div :class="$style.chartContainer">
            <ResponseHeatmap
              :heatmap-data="heatmapData"
              :loading="loading"
            />
          </div>
        </div>
      </div>

      <!-- NPS & CSAT Row -->
      <div :class="$style.chartsRow" v-if="hasNPSData || hasCSATData">
        <!-- NPS Tracking -->
        <div v-if="hasNPSData" :class="[$style.chartCard, { [$style.fullWidth]: !hasCSATData }]">
          <div :class="$style.chartHeader">
            <div>
              <h3 :class="$style.chartTitle">مؤشر صافي الترويج (NPS)</h3>
              <p :class="$style.chartSubtitle">مقياس ولاء العملاء واحتمالية التوصية</p>
            </div>
          </div>
          <div :class="$style.chartContainer">
            <NPSGauge
              :nps-data="npsData"
              :loading="loading"
              :compact="true"
            />
          </div>
        </div>

        <!-- CSAT Tracking (UPDATED in v2) -->
      
      </div>
        <div v-if="hasCSATData" :class="[$style.chartCard, { [$style.fullWidth]: !hasNPSData }]">
          <div :class="$style.chartHeader">
            <div>
              <h3 :class="$style.chartTitle">رضا العملاء (CSAT)</h3>
              <p :class="$style.chartSubtitle">مستوى رضا العملاء عن الخدمات</p>
            </div>
          </div>
          <div :class="$style.chartContainer">
            <CSATTracking
              :csat-data="csatTrackingData"
              :loading="loading"
              :compact="true"
            />
          </div>
        </div>

      <!-- Segments Charts Row - REMOVED in v2 -->
    </div>

    <!-- Questions Summary Section -->
    <div :class="$style.questionsSection" v-if="questionsSummary.length > 0">
      <div :class="$style.sectionHeader">
        <h3 :class="$style.sectionTitle">ملخص الأسئلة</h3>
        <p :class="$style.sectionDescription">أداء كل سؤال ونسبة الإجابات عليه.</p>
      </div>

      <div :class="$style.questionsGrid">
        <div
          v-for="(question, index) in questionsSummary"
          :key="question.id || index"
          :class="$style.questionSummaryCard"
        >
          <div :class="$style.questionSummaryHeader">
            <div :class="$style.questionNumber">Q{{ index + 1 }}</div>
            <div :class="$style.questionType">
              <i :class="getQuestionTypeIcon(question.type)"></i>
            </div>
          </div>
          
          <div :class="$style.questionSummaryContent">
            <h4 :class="$style.questionTitle">{{ question.question_text }}</h4>
            <div :class="$style.questionMeta">
              <span :class="$style.questionRequired" v-if="question.is_required">
                <i class="fas fa-asterisk"></i>
                مطلوب
              </span>
              <span :class="$style.questionOptional" v-else>
                <i class="fas fa-circle"></i>
                اختياري
              </span>
            </div>
            <div :class="$style.questionStats">
              <div :class="$style.statItem">
                <span :class="$style.statNumber">{{ formatNumber(question.response_count) }}</span>
                <span :class="$style.statLabel">الردود</span>
              </div>
              <div :class="$style.statItem">
                <span :class="$style.statNumber">{{ formatPercentage(question.answer_rate) }}</span>
                <span :class="$style.statLabel">معدل الإجابة</span>
              </div>
              <div :class="$style.statItem" v-if="question.skipped_count > 0">
                <span :class="$style.statNumber">{{ formatNumber(question.skipped_count) }}</span>
                <span :class="$style.statLabel">تم التخطي</span>
              </div>
            </div>
            <div v-if="question.top_response && question.type !== 'text' && question.type !== 'textarea'" :class="$style.topResponse">
              <strong>أكثر إجابة شيوعًا:</strong>
              <span>{{ question.top_response }}</span>
            </div>
            <br v-else-if="question.type === 'text' || question.type === 'textarea'" />
          </div>

          <div :class="$style.questionSummaryActions">
            <button :class="$style.detailsButton" @click.stop="onQuestionDetailsClick(question)">
              <i class="fas fa-chart-bar"></i>
              عرض التفاصيل
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Section - REMOVED in v2 -->

    <!-- Question Details Modal -->
    <QuestionDetailsModal
      :is-visible="showQuestionDetails"
      :question="selectedQuestion"
      :details="questionDetails"
      :loading="questionDetailsLoading"
      @close="closeQuestionDetails"
      @retry="retryQuestionDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import ResponseHeatmap from './ResponseHeatmap.vue'
import NPSGauge from './NPSGauge.vue'
import CSATTracking from './CSATTracking.vue'
import QuestionDetailsModal from './QuestionDetailsModal'
import type { HeatmapData, NPSData, CSATTrackingPoint } from '../../types/survey.types'

// Props
interface Props { analytics?: any; loading?: boolean }
const props = withDefaults(defineProps<Props>(), { loading: false })

// Emits
const emit = defineEmits<{
  refresh: []
  questionDetailsClick: [data: { question: any, details: any }]
  periodClick: [period: any]
  filtersChange: [filters: any]
}>()

// Store (نستخدمه للثيم والاتجاه فقط)
const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// State
const surveyDetails = ref<any>(null)

// Question details modal state
const showQuestionDetails = ref(false)
const selectedQuestion = ref<any>(null)
const questionDetails = ref<any>(null)
const questionDetailsLoading = ref(false)

// Watch for analytics data changes to fetch survey details
watch(() => props.analytics?.data?.survey?.id, async (surveyId) => {
  if (surveyId && !surveyDetails.value) {
    try {
      const response = await surveyService.getSurvey(surveyId)
      if (response.status === 'success') {
        surveyDetails.value = response.data
      }
    } catch (error) {
      console.error('Error fetching survey details:', error)
    }
  }
}, { immediate: true })

// Computed analytics data (v2 API structure)
const heatmapData = computed<HeatmapData>(() => props.analytics?.data?.heatmap || {
  matrix: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0)),
  totals_by_day: Array.from({ length: 7 }, () => 0),
  totals_by_hour: Array.from({ length: 24 }, () => 0)
})

const npsData = computed<NPSData | null>(() => props.analytics?.data?.nps || null)

const csatTrackingData = computed<CSATTrackingPoint[]>(() => props.analytics?.data?.csat_tracking || [])

const hasNPSData = computed(() => {
  return npsData.value && npsData.value.total_responses > 0
})

const hasCSATData = computed(() => {
  return csatTrackingData.value && csatTrackingData.value.length > 0
})

const questionsSummary = computed(() => {
  const rawSummary = props.analytics?.data?.questions_summary || []
  return rawSummary.map((question: any) => ({
    id: question.question_id,
    question_text: getQuestionText(question),
    type: question.type,
    response_count: question.answer_count,
    answer_rate: calculateAnswerRate(question),
    top_response: getTopResponse(question),
    order: question.order,
    is_required: question.is_required,
    skipped_count: question.skipped_count
  }))
})

// Helper functions for question summary processing
const getQuestionText = (question: any) => {
  if (surveyDetails.value?.questions) {
    const questionDetail = surveyDetails.value.questions.find((q: any) => q.id === question.question_id)
    if (questionDetail) {
      return questionDetail.question_text || questionDetail.text || `السؤال ${question.order}`
    }
  }
  return `السؤال ${question.order}`
}

const calculateAnswerRate = (question: any) => {
  const totalResponses = question.answer_count + question.skipped_count
  if (totalResponses === 0) return 0
  return question.answer_count / totalResponses
}

const getTopResponse = (question: any) => {
  const distributions = question.distributions
  
  if (!distributions) return null
  
  // Handle different question types
  switch (question.type) {
    case 'yes_no':
      if (distributions.yes_no) {
        const topChoice = distributions.yes_no.reduce((prev: any, current: any) => 
          prev.count > current.count ? prev : current
        )
        return topChoice.value === 'yes' ? 'نعم' : 'لا'
      }
      break
      
    case 'rating':
      if (distributions.rating) {
        return `متوسط التقييم: ${distributions.rating.avg.toFixed(1)}`
      }
      break
      
    case 'multiple_choice':
    case 'single_choice':
      if (distributions.options) {
        const topOption = distributions.options.reduce((prev: any, current: any) => 
          prev.count > current.count ? prev : current
        )
        return topOption.count > 0 ? topOption.label : 'لا توجد إجابات'
      }
      break
      
    case 'text':
    case 'textarea':
      if (distributions.textual) {
        const avgWords = distributions.textual.avg_words
        return avgWords > 0 ? `متوسط الكلمات: ${avgWords.toFixed(1)}` : 'لا توجد إجابات نصية'
      }
      break
      
    default:
      return null
  }
  
  return null
}

// Helpers
const formatNumber = (value: number) => {
  if (!value && value !== 0) return '0'
  return new Intl.NumberFormat().format(value)
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

const getQuestionTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    text: 'fas fa-font',
    textarea: 'fas fa-align-left',
    single_choice: 'fas fa-dot-circle',
    multiple_choice: 'fas fa-check-square',
    rating: 'fas fa-star',
    yes_no: 'fas fa-toggle-on'
  }
  return icons[type] || 'fas fa-question'
}

// Used in template for refresh button
const refreshAnalytics = () => emit('refresh')
void refreshAnalytics // Tell TypeScript this is used in template

const onQuestionDetailsClick = async (question: any) => {
  console.log('🔵 Question Details Click:', question)
  try {
    selectedQuestion.value = question
    showQuestionDetails.value = true
    questionDetailsLoading.value = true
    questionDetails.value = null
    
    const surveyId = props.analytics?.data?.survey?.id
    const questionId = question.id
    
    console.log('🔵 Survey ID:', surveyId, 'Question ID:', questionId)
    
    if (!surveyId || !questionId) {
      console.error('❌ Missing survey ID or question ID', { surveyId, questionId })
      questionDetailsLoading.value = false
      return
    }
    
    console.log('🔵 Calling API: getQuestionAnalytics')
    const response = await surveyService.getQuestionAnalytics(surveyId, questionId)
    console.log('✅ API Response:', response)
    
    if (response.status === 'success') {
      questionDetails.value = response.data
      emit('questionDetailsClick', {
        question: question,
        details: response.data
      })
    } else {
      console.error('❌ API returned non-success status:', response)
    }
  } catch (error) {
    console.error('❌ Error fetching question details:', error)
    // Keep the modal open to show error state
  } finally {
    questionDetailsLoading.value = false
  }
}

const closeQuestionDetails = () => {
  console.log('🔵 Closing question details modal')
  showQuestionDetails.value = false
  selectedQuestion.value = null
  questionDetails.value = null
}

const retryQuestionDetails = () => {
  console.log('🔵 Retry question details clicked')
  if (selectedQuestion.value) {
    console.log('🔵 Retrying with question:', selectedQuestion.value)
    onQuestionDetailsClick(selectedQuestion.value)
  } else {
    console.error('❌ No selected question to retry')
  }
}

// const onPeriodClick = (period: any) => emit('periodClick', period)

// const onFiltersChange = () => {
//   if (isMounted.value && props.analytics?.data) emit('filtersChange', filters.value)
// }

// Debug watchers
watch(() => questionsSummary.value, (newVal) => {
  console.log('🔵 questionsSummary updated:', newVal)
  if (newVal && newVal.length > 0) {
    console.log('🔵 First question:', newVal[0])
  }
}, { immediate: true })

watch(() => props.analytics, (newVal) => {
  console.log('🔵 Analytics prop updated:', newVal)
  if (newVal?.data?.survey?.id) {
    console.log('🔵 Survey ID from analytics:', newVal.data.survey.id)
  }
}, { immediate: true })
const getColorForIntensity = (intensity: number): string => {
  const lightPalette = [
    '#f5f7fa',
    '#f3d6a7',
    '#ebc47a',
    '#e5b960',
    '#dfb04a',
    '#cfa135',
    '#a17d23',
    '#8b6a1e',
    '#6d5217',
    '#59400d'
  ]

  const darkPalette = [
    '#1f1b16',
    '#2b231c',
    '#3b2f21',
    '#4a3a25',
    '#6d522e',
    '#8f6b35',
    '#b8853d',
    '#d69c44',
    '#edb650',
    '#ffe08a'
  ]

  const palette = currentTheme.value === 'night' ? darkPalette : lightPalette
  const clamped = Math.max(0, Math.min(intensity, 1))
  const index = Math.min(Math.floor(clamped * 9), 9)
  return palette[index]
}
</script>


<style module>
.surveyAnalytics {
  --surface-base: #ffffff;
  --surface-raised: rgba(255, 255, 255, 0.92);
  --surface-muted: rgba(161, 125, 35, 0.08);
  --border-soft: rgba(161, 125, 35, 0.18);
  --border-strong: rgba(161, 125, 35, 0.28);
  --text-primary: #231f20;
  --text-secondary: #4d4d4f;
  --text-subtle: rgba(72, 78, 94, 0.75);
  --accent-brand: #a17d23;
  --accent-brand-strong: #8b6a1e;
  --accent-success: #22c55e;
  --accent-danger: #ef4444;
  --shadow-soft: 0 18px 40px rgba(15, 23, 42, 0.08);
  --shadow-card: 0 12px 28px rgba(15, 23, 42, 0.12);
  --shadow-hover: 0 18px 48px rgba(15, 23, 42, 0.16);
  --scroll-track: rgba(15, 23, 42, 0.08);
  --scroll-thumb: linear-gradient(135deg, rgba(161, 125, 35, 0.8), rgba(183, 138, 65, 0.85));
  --surface-glass: rgba(255, 255, 255, 0.7);
  --surface-glass-strong: rgba(255, 255, 255, 0.88);
  padding: 24px;
  background: var(--surface-base);
  color: var(--text-secondary);
  transition: background 0.3s ease, color 0.3s ease;
}

.surveyAnalytics[data-theme="night"] {
  --surface-base: radial-gradient(circle at top, rgba(34, 31, 27, 0.95), #12100f);
  --surface-raised: rgba(32, 29, 25, 0.92);
  --surface-muted: rgba(94, 78, 63, 0.22);
  --border-soft: rgba(229, 232, 225, 0.18);
  --border-strong: rgba(229, 232, 225, 0.3);
  --text-primary: #f5f3ee;
  --text-secondary: rgba(229, 232, 225, 0.85);
  --text-subtle: rgba(229, 232, 225, 0.65);
  --accent-brand: #d3b079;
  --accent-brand-strong: #f7d075;
  --accent-success: #4ade80;
  --accent-danger: #f87171;
  --shadow-soft: 0 24px 60px rgba(0, 0, 0, 0.55);
  --shadow-card: 0 18px 48px rgba(0, 0, 0, 0.5);
  --shadow-hover: 0 24px 64px rgba(0, 0, 0, 0.6);
  --scroll-track: rgba(15, 15, 17, 0.3);
  --scroll-thumb: linear-gradient(135deg, rgba(247, 208, 117, 0.65), rgba(161, 125, 35, 0.7));
  --surface-glass: rgba(38, 34, 31, 0.8);
  --surface-glass-strong: rgba(46, 40, 35, 0.92);
}

.surveyAnalytics ::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}

.surveyAnalytics ::-webkit-scrollbar-track {
  background: var(--scroll-track);
  border-radius: 999px;
}

.surveyAnalytics ::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 999px;
}

.surveyAnalytics ::-webkit-scrollbar-thumb:hover {
  background: var(--scroll-thumb);
  filter: brightness(1.05);
}

.chartsSection {
  margin-bottom: 32px;
}

.chartCard {
  background: linear-gradient(145deg, var(--surface-raised) 0%, var(--surface-base) 100%);
  border-radius: 16px;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  margin-bottom: 24px;
  backdrop-filter: blur(18px);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.chartCard:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--border-strong);
}

.chartHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 20px 24px 0;
}

.chartTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.chartSubtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-subtle);
}

.chartContainer {
  padding: 12px 20px 20px;
}

.heatmapRow {
  margin-bottom: 24px;
  border-radius: 18px;
}

.legendContainer {
  padding: 1.5rem;
  background: var(--surface-raised);
  border-radius: 14px;
  border: 1px solid var(--border-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
}

.legendScale {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.legendLabel {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.legendGradient {
  display: flex;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.gradientStep {
  width: 10px;
  height: 10px;
  transition: transform 0.2s ease;
}

.gradientStep:hover {
  transform: scaleY(1.25);
}

.questionsSection {
  margin-bottom: 32px;
}

.sectionHeader {
  margin-bottom: 20px;
}

.sectionTitle {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.sectionDescription {
  margin: 0;
  color: var(--text-subtle);
  font-size: 14px;
}

.questionsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.questionSummaryCard {
  background: var(--surface-raised);
  border-radius: 16px;
  border: 1px solid var(--border-soft);
  padding: 20px;
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(18px);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.questionSummaryCard:hover {
  transform: translateY(-4px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-hover);
}

.questionSummaryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.questionNumber {
  background: linear-gradient(135deg, var(--accent-brand) 0%, var(--accent-brand-strong) 100%);
  color: var(--surface-base);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(161, 125, 35, 0.25);
}

.questionType {
  color: var(--text-subtle);
  font-size: 16px;
}

.questionTitle {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.45;
}

.questionMeta {
  margin-bottom: 12px;
}

.questionRequired,
.questionOptional {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
  border: 1px solid transparent;
}

.questionRequired {
  color: var(--accent-danger);
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.22);
}

.questionOptional {
  color: var(--text-subtle);
  background: var(--surface-muted);
  border-color: var(--border-soft);
}

.questionStats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.statItem {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.statNumber {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-brand);
}

.statLabel {
  font-size: 11px;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.topResponse {
  font-size: 13px;
  color: var(--text-subtle);
  margin-bottom: 16px;
  padding: 10px;
  background: var(--surface-muted);
  border-radius: 8px;
  border: 1px solid var(--border-soft);
}

.questionSummaryActions {
  border-top: 1px solid var(--border-soft);
  padding-top: 12px;
}

.detailsButton {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--accent-brand);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.detailsButton:hover {
  color: var(--accent-brand-strong);
}

.questionsSection::-webkit-scrollbar {
  height: 8px;
}

.questionsSection::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
}

.questionsSection::-webkit-scrollbar-track {
  background: var(--scroll-track);
}

@media (max-width: 768px) {
  .surveyAnalytics {
    padding: 16px;
  }

  .chartCard,
  .questionSummaryCard {
    border-radius: 14px;
  }

  .questionsGrid {
    grid-template-columns: 1fr;
  }
}

.surveyAnalytics[dir="rtl"] .questionSummaryHeader {
  flex-direction: row-reverse;
}
</style>

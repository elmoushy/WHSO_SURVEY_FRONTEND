<template>
  <div v-if="isVisible" :class="styles.modalOverlay" @click="closeModal">
    <div :class="styles.modalContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'" @click.stop>
      <!-- Modal Header -->
      <div :class="styles.modalHeader">
        <div :class="styles.headerContent">
          <div :class="styles.questionBadge">
            <i :class="[getQuestionTypeIcon(question?.type), styles.questionIcon]"></i>
            <span>السؤال {{ question?.order }}</span>
          </div>
          <h2 :class="styles.modalTitle">{{ question?.question_text }}</h2>
          <div :class="styles.questionMeta">
            <span :class="styles.questionType">{{ getQuestionTypeLabel(question?.type) }}</span>
            <span :class="question?.is_required ? styles.required : styles.optional">
              {{ question?.is_required ? 'مطلوب' : 'اختياري' }}
            </span>
          </div>
        </div>
        <button :class="styles.closeButton" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Modal Content -->
      <div :class="styles.modalContent">
        <!-- Loading State -->
        <div v-if="loading" :class="styles.loadingContainer">
          <div :class="styles.loadingSpinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>جارٍ تحميل تفاصيل السؤال...</p>
        </div>

        <!-- Content when loaded -->
        <div v-else-if="details" :class="styles.contentContainer">
          <!-- Summary Cards -->
          <div :class="styles.summaryGrid">
            <div :class="styles.summaryCard">
              <div :class="styles.summaryIcon" style="background-color: rgba(76, 175, 80, 0.1);">
                <i class="fas fa-users" style="color: #4CAF50;"></i>
              </div>
              <div :class="styles.summaryContent">
                <div :class="styles.summaryNumber">{{ formatNumber(details.summary?.total_responses || 0) }}</div>
                <div :class="styles.summaryLabel">إجمالي الردود</div>
              </div>
            </div>

            <div :class="styles.summaryCard">
              <div :class="styles.summaryIcon" style="background-color: rgba(33, 150, 243, 0.1);">
                <i class="fas fa-check-circle" style="color: #2196F3;"></i>
              </div>
              <div :class="styles.summaryContent">
                <div :class="styles.summaryNumber">{{ formatNumber(details.summary?.answered_count || 0) }}</div>
                <div :class="styles.summaryLabel">تم الإجابة عليه</div>
              </div>
            </div>

            <div :class="styles.summaryCard">
              <div :class="styles.summaryIcon" style="background-color: rgba(255, 152, 0, 0.1);">
                <i class="fas fa-skip-forward" style="color: #FF9800;"></i>
              </div>
              <div :class="styles.summaryContent">
                <div :class="styles.summaryNumber">{{ formatNumber(details.summary?.skipped_count || 0) }}</div>
                <div :class="styles.summaryLabel">تم التخطي</div>
              </div>
            </div>

            <div :class="styles.summaryCard">
              <div :class="styles.summaryIcon" style="background-color: rgba(156, 39, 176, 0.1);">
                <i class="fas fa-percentage" style="color: #9C27B0;"></i>
              </div>
              <div :class="styles.summaryContent">
                <div :class="styles.summaryNumber">{{ formatPercentage(details.summary?.answer_rate || 0) }}</div>
                <div :class="styles.summaryLabel">معدل الإجابة</div>
              </div>
            </div>
          </div>

          <!-- Charts and Visualizations -->
          <div :class="styles.visualizationsContainer">
            <!-- Multiple Choice / Single Choice -->
            <div v-if="question?.type === 'multiple_choice' || question?.type === 'single_choice'" :class="styles.chartSection">
              <h3 :class="styles.sectionTitle">توزيع الإجابات</h3>
              <div :class="styles.optionsChart">
                <div
                  v-for="option in details.distributions?.by_option || []"
                  :key="option.option_id"
                  :class="styles.optionBar"
                >
                  <div :class="styles.optionInfo">
                    <span :class="styles.optionLabel">{{ option.option_label }}</span>
                    <div :class="styles.optionStats">
                      <span :class="styles.optionCount">{{ formatNumber(option.count) }}</span>
                      <span :class="styles.optionPercent">{{ formatPercentage(option.percentage) }}</span>
                    </div>
                  </div>
                  <div :class="styles.optionBarContainer">
                    <div 
                      :class="styles.optionBarFill" 
                      :style="{ width: `${option.percentage * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rating Questions -->
            <div v-else-if="question?.type === 'rating'" :class="styles.chartSection">
              <h3 :class="styles.sectionTitle">تحليل التقييمات</h3>
              <div :class="styles.ratingStats">
                <div :class="styles.ratingCard">
                  <div :class="styles.ratingValue">{{ formatNumber(details.statistics?.average || 0, 2) }}</div>
                  <div :class="styles.ratingLabel">المتوسط</div>
                </div>
                <div :class="styles.ratingCard">
                  <div :class="styles.ratingValue">{{ formatNumber(details.statistics?.median || 0) }}</div>
                  <div :class="styles.ratingLabel">الوسيط</div>
                </div>
                <div :class="styles.ratingCard">
                  <div :class="styles.ratingValue">{{ formatNumber(details.statistics?.mode || 0) }}</div>
                  <div :class="styles.ratingLabel">المنوال</div>
                </div>
              </div>
              
              <div v-if="details.distributions?.by_rating" :class="styles.ratingChart">
                <div
                  v-for="rating in details.distributions.by_rating"
                  :key="rating.rating"
                  :class="styles.ratingBar"
                >
                  <div :class="styles.ratingInfo">
                    <div :class="styles.ratingStars">
                      <i v-for="n in 5" :key="n" 
                         :class="n <= rating.rating ? 'fas fa-star' : 'far fa-star'"
                         :style="{ color: n <= rating.rating ? '#FFD700' : '#E0E0E0' }">
                      </i>
                    </div>
                    <div :class="styles.ratingStats">
                      <span>{{ formatNumber(rating.count) }}</span>
                      <span>{{ formatPercentage(rating.percentage) }}</span>
                    </div>
                  </div>
                  <div :class="styles.ratingBarContainer">
                    <div 
                      :class="styles.ratingBarFill" 
                      :style="{ width: `${rating.percentage * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Yes/No Questions -->
            <div v-else-if="question?.type === 'yes_no'" :class="styles.chartSection">
              <h3 :class="styles.sectionTitle">توزيع الإجابات</h3>
              <div :class="styles.yesNoChart">
                <div
                  v-for="choice in details.distributions?.by_choice || []"
                  :key="choice.value"
                  :class="styles.yesNoOption"
                >
                  <div :class="styles.yesNoIcon">
                    <i :class="choice.value === 'yes' ? 'fas fa-check' : 'fas fa-times'"
                       :style="{ color: choice.value === 'yes' ? '#4CAF50' : '#F44336' }">
                    </i>
                  </div>
                  <div :class="styles.yesNoInfo">
                    <div :class="styles.yesNoLabel">{{ choice.label }}</div>
                    <div :class="styles.yesNoStats">
                      <span :class="styles.yesNoCount">{{ formatNumber(choice.count) }}</span>
                      <span :class="styles.yesNoPercent">{{ formatPercentage(choice.percentage) }}</span>
                    </div>
                  </div>
                  <div :class="styles.yesNoBar">
                    <div 
                      :class="styles.yesNoBarFill" 
                      :style="{ 
                        width: `${choice.percentage * 100}%`,
                        backgroundColor: choice.value === 'yes' ? '#4CAF50' : '#F44336'
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Text Questions -->
            <!-- <div v-else-if="question?.type === 'text' || question?.type === 'textarea'" :class="styles.chartSection">
              <h3 :class="styles.sectionTitle">تحليل النصوص</h3>
              <div v-if="details.distributions?.textual_analysis" :class="styles.textAnalysis">
                <div :class="styles.textStats">
                  <div :class="styles.textStat">
                    <div :class="styles.textStatValue">{{ formatNumber(details.distributions.textual_analysis.total_words) }}</div>
                    <div :class="styles.textStatLabel">إجمالي الكلمات</div>
                  </div>
                  <div :class="styles.textStat">
                    <div :class="styles.textStatValue">{{ formatNumber(details.distributions.textual_analysis.average_words, 1) }}</div>
                    <div :class="styles.textStatLabel">متوسط الكلمات</div>
                  </div>
                  <div :class="styles.textStat">
                    <div :class="styles.textStatValue">{{ formatNumber(details.distributions.textual_analysis.max_words) }}</div>
                    <div :class="styles.textStatLabel">أقصى كلمات</div>
                  </div>
                </div>
                
                <div v-if="details.distributions.textual_analysis.common_keywords?.length" :class="styles.keywordsSection">
                  <h4 :class="styles.keywordsTitle">الكلمات الشائعة</h4>
                  <div :class="styles.keywords">
                    <div
                      v-for="keyword in details.distributions.textual_analysis.common_keywords"
                      :key="keyword.word"
                      :class="styles.keyword"
                    >
                      <span :class="styles.keywordText">{{ keyword.word }}</span>
                      <span :class="styles.keywordCount">{{ keyword.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div> -->
          </div>

          <!-- Recent Responses -->
          <div
            v-if="details.recent_responses?.length && (question?.type !== 'text' && question?.type !== 'textarea')"
            :class="styles.recentSection"
          >         
          <h3 :class="styles.sectionTitle">أحدث الردود</h3>
            <div :class="styles.responsesList">
              <div
                v-for="response in details.recent_responses.slice(0, 5)"
                :key="response.id"
                :class="styles.responseItem"
              >
                <div :class="styles.responseInfo">
                  <div :class="styles.responseAnswer">
                    <span v-if="response.selected_option">{{ response.selected_option.label }}</span>
                    <span v-else-if="response.text_excerpt">{{ response.text_excerpt }}</span>
                    <span v-else>{{ response.rating || 'غير محدد' }}</span>
                  </div>
                  <div :class="styles.responseMeta">
                    <span :class="styles.responseTime">{{ formatDateTime(response.response_time) }}</span>
                    <span :class="response.is_authenticated ? styles.authenticated : styles.anonymous">
                      {{ response.is_authenticated ? 'موثق' : 'مجهول' }}
                    </span>
                  </div>
                </div>
                <!-- <div v-if="response.completion_time_seconds" :class="styles.completionTime">
                  {{ formatDuration(response.completion_time_seconds) }}
                </div> -->
              </div>
            </div>
          </div>

          <!-- Insights -->
          <div v-if="details.insights?.length" :class="styles.insightsSection">
            <h3 :class="styles.sectionTitle">الاستبصارات</h3>
            <div :class="styles.insightsList">
              <div
                v-for="insight in details.insights"
                :key="insight.type"
                :class="[styles.insightCard, styles[`insight-${insight.severity}`]]"
              >
                <div :class="styles.insightIcon">
                  <i :class="getInsightIcon(insight.type)"></i>
                </div>
                <div :class="styles.insightContent">
                  <div :class="styles.insightTitle">{{ insight.title }}</div>
                  <div :class="styles.insightDescription">{{ insight.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else :class="styles.errorContainer">
          <div :class="styles.errorIcon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>حدث خطأ في تحميل تفاصيل السؤال</p>
          <button :class="styles.retryButton" @click="handleRetry">
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../../stores/useAppStore'
import styles from './QuestionDetailsModal.module.css'

// Props
interface Props {
  isVisible: boolean
  question: any
  details: any
  loading: boolean
}

withDefaults(defineProps<Props>(), {
  isVisible: false,
  loading: false
})

// Emits
const emit = defineEmits<{
  close: []
  retry: []
}>()

// Store
const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// Methods
const closeModal = () => {
  console.log('🔵 QuestionDetailsModal: Close button clicked')
  emit('close')
}

const handleRetry = () => {
  console.log('🔵 QuestionDetailsModal: Retry button clicked')
  emit('retry')
}

const formatNumber = (value: number, decimals = 0) => {
  if (!value && value !== 0) return '0'
  if (decimals > 0) {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }
  return new Intl.NumberFormat('ar-SA').format(value)
}

const formatPercentage = (value: number) => {
  if (!value && value !== 0) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return 'غير محدد'
  const date = new Date(dateString)
  return date.toLocaleString('ar-SA', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// const formatDuration = (seconds: number) => {
//   if (!seconds && seconds !== 0) return '0s'
//   const minutes = Math.floor(seconds / 60)
//   const remainingSeconds = Math.floor(seconds % 60)
//   if (minutes > 0) return `${minutes}د ${remainingSeconds}ث`
//   return `${remainingSeconds}ث`
// }

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

const getQuestionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    text: 'نص قصير',
    textarea: 'نص طويل',
    single_choice: 'اختيار واحد',
    multiple_choice: 'اختيارات متعددة',
    rating: 'تقييم',
    yes_no: 'نعم/لا'
  }
  return labels[type] || 'غير محدد'
}

const getInsightIcon = (type: string) => {
  const icons: Record<string, string> = {
    popular_choice: 'fas fa-crown',
    low_response_option: 'fas fa-exclamation-triangle',
    skip_rate: 'fas fa-check-circle',
    high_engagement: 'fas fa-heart',
    low_engagement: 'fas fa-heart-broken'
  }
  return icons[type] || 'fas fa-lightbulb'
}
</script>

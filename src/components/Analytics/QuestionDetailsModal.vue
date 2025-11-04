<template>
  <div v-if="isVisible" :class="$style.modalOverlay" @click="closeModal">
    <div :class="$style.modalContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'" @click.stop>
      <!-- Modal Header -->
      <div :class="$style.modalHeader">
        <div :class="$style.headerContent">
          <div :class="$style.questionBadge">
            <i :class="[getQuestionTypeIcon(question?.type), $style.questionIcon]"></i>
            <span>السؤال {{ question?.order }}</span>
          </div>
          <h2 :class="$style.modalTitle">{{ question?.question_text }}</h2>
          <div :class="$style.questionMeta">
            <span :class="$style.questionType">{{ getQuestionTypeLabel(question?.type) }}</span>
            <span :class="question?.is_required ? $style.required : $style.optional">
              {{ question?.is_required ? 'مطلوب' : 'اختياري' }}
            </span>
          </div>
        </div>
        <button :class="$style.closeButton" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Modal Content -->
      <div :class="$style.modalContent">
        <!-- Loading State -->
        <div v-if="loading" :class="$style.loadingContainer">
          <div :class="$style.loadingSpinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>جارٍ تحميل تفاصيل السؤال...</p>
        </div>

        <!-- Content when loaded -->
        <div v-else-if="details" :class="$style.contentContainer">
          <!-- Summary Cards -->
          <div :class="$style.summaryGrid">
            <div :class="$style.summaryCard">
              <div :class="$style.summaryIcon" style="background-color: rgba(76, 175, 80, 0.1);">
                <i class="fas fa-users" style="color: #4CAF50;"></i>
              </div>
              <div :class="$style.summaryContent">
                <div :class="$style.summaryNumber">{{ formatNumber(details.summary?.total_responses || 0) }}</div>
                <div :class="$style.summaryLabel">إجمالي الردود</div>
              </div>
            </div>

            <div :class="$style.summaryCard">
              <div :class="$style.summaryIcon" style="background-color: rgba(33, 150, 243, 0.1);">
                <i class="fas fa-check-circle" style="color: #2196F3;"></i>
              </div>
              <div :class="$style.summaryContent">
                <div :class="$style.summaryNumber">{{ formatNumber(details.summary?.answered_count || 0) }}</div>
                <div :class="$style.summaryLabel">تم الإجابة عليه</div>
              </div>
            </div>

            <div :class="$style.summaryCard">
              <div :class="$style.summaryIcon" style="background-color: rgba(255, 152, 0, 0.1);">
                <i class="fas fa-skip-forward" style="color: #FF9800;"></i>
              </div>
              <div :class="$style.summaryContent">
                <div :class="$style.summaryNumber">{{ formatNumber(details.summary?.skipped_count || 0) }}</div>
                <div :class="$style.summaryLabel">تم التخطي</div>
              </div>
            </div>

            <div :class="$style.summaryCard">
              <div :class="$style.summaryIcon" style="background-color: rgba(156, 39, 176, 0.1);">
                <i class="fas fa-percentage" style="color: #9C27B0;"></i>
              </div>
              <div :class="$style.summaryContent">
                <div :class="$style.summaryNumber">{{ formatPercentage(details.summary?.answer_rate || 0) }}</div>
                <div :class="$style.summaryLabel">معدل الإجابة</div>
              </div>
            </div>
          </div>

          <!-- Charts and Visualizations -->
          <div :class="$style.visualizationsContainer">
            <!-- Multiple Choice / Single Choice -->
            <div v-if="question?.type === 'multiple_choice' || question?.type === 'single_choice'" :class="$style.chartSection">
              <h3 :class="$style.sectionTitle">توزيع الإجابات</h3>
              <div :class="$style.optionsChart">
                <div
                  v-for="option in details.distributions?.by_option || []"
                  :key="option.option_id"
                  :class="$style.optionBar"
                >
                  <div :class="$style.optionInfo">
                    <span :class="$style.optionLabel">{{ option.option_label }}</span>
                    <div :class="$style.optionStats">
                      <span :class="$style.optionCount">{{ formatNumber(option.count) }}</span>
                      <span :class="$style.optionPercent">{{ formatPercentage(option.percentage) }}</span>
                    </div>
                  </div>
                  <div :class="$style.optionBarContainer">
                    <div 
                      :class="$style.optionBarFill" 
                      :style="{ width: `${option.percentage * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rating Questions -->
            <div v-else-if="question?.type === 'rating'" :class="$style.chartSection">
              <h3 :class="$style.sectionTitle">تحليل التقييمات</h3>
              <div :class="$style.ratingStats">
                <div :class="$style.ratingCard">
                  <div :class="$style.ratingValue">{{ formatNumber(details.statistics?.average || 0, 2) }}</div>
                  <div :class="$style.ratingLabel">المتوسط</div>
                </div>
                <div :class="$style.ratingCard">
                  <div :class="$style.ratingValue">{{ formatNumber(details.statistics?.median || 0) }}</div>
                  <div :class="$style.ratingLabel">الوسيط</div>
                </div>
                <div :class="$style.ratingCard">
                  <div :class="$style.ratingValue">{{ formatNumber(details.statistics?.mode || 0) }}</div>
                  <div :class="$style.ratingLabel">المنوال</div>
                </div>
              </div>
              
              <div v-if="details.distributions?.by_rating" :class="$style.ratingChart">
                <div
                  v-for="rating in details.distributions.by_rating"
                  :key="rating.rating"
                  :class="$style.ratingBar"
                >
                  <div :class="$style.ratingInfo">
                    <div :class="$style.ratingStars">
                      <i v-for="n in 5" :key="n" 
                         :class="n <= rating.rating ? 'fas fa-star' : 'far fa-star'"
                         :style="{ color: n <= rating.rating ? '#FFD700' : '#E0E0E0' }">
                      </i>
                    </div>
                    <div :class="$style.ratingStats">
                      <span>{{ formatNumber(rating.count) }}</span>
                      <span>{{ formatPercentage(rating.percentage) }}</span>
                    </div>
                  </div>
                  <div :class="$style.ratingBarContainer">
                    <div 
                      :class="$style.ratingBarFill" 
                      :style="{ width: `${rating.percentage * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Yes/No Questions -->
            <div v-else-if="question?.type === 'yes_no'" :class="$style.chartSection">
              <h3 :class="$style.sectionTitle">توزيع الإجابات</h3>
              <div :class="$style.yesNoChart">
                <div
                  v-for="choice in details.distributions?.by_choice || []"
                  :key="choice.value"
                  :class="$style.yesNoOption"
                >
                  <div :class="$style.yesNoIcon">
                    <i :class="choice.value === 'yes' ? 'fas fa-check' : 'fas fa-times'"
                       :style="{ color: choice.value === 'yes' ? '#4CAF50' : '#F44336' }">
                    </i>
                  </div>
                  <div :class="$style.yesNoInfo">
                    <div :class="$style.yesNoLabel">{{ choice.label }}</div>
                    <div :class="$style.yesNoStats">
                      <span :class="$style.yesNoCount">{{ formatNumber(choice.count) }}</span>
                      <span :class="$style.yesNoPercent">{{ formatPercentage(choice.percentage) }}</span>
                    </div>
                  </div>
                  <div :class="$style.yesNoBar">
                    <div 
                      :class="$style.yesNoBarFill" 
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
            <div v-else-if="question?.type === 'text' || question?.type === 'textarea'" :class="$style.chartSection">
              <h3 :class="$style.sectionTitle">تحليل النصوص</h3>
              <div v-if="details.distributions?.textual_analysis" :class="$style.textAnalysis">
                <div :class="$style.textStats">
                  <div :class="$style.textStat">
                    <div :class="$style.textStatValue">{{ formatNumber(details.distributions.textual_analysis.total_words) }}</div>
                    <div :class="$style.textStatLabel">إجمالي الكلمات</div>
                  </div>
                  <div :class="$style.textStat">
                    <div :class="$style.textStatValue">{{ formatNumber(details.distributions.textual_analysis.average_words, 1) }}</div>
                    <div :class="$style.textStatLabel">متوسط الكلمات</div>
                  </div>
                  <div :class="$style.textStat">
                    <div :class="$style.textStatValue">{{ formatNumber(details.distributions.textual_analysis.max_words) }}</div>
                    <div :class="$style.textStatLabel">أقصى كلمات</div>
                  </div>
                </div>
                
                <div v-if="details.distributions.textual_analysis.common_keywords?.length" :class="$style.keywordsSection">
                  <h4 :class="$style.keywordsTitle">الكلمات الشائعة</h4>
                  <div :class="$style.keywords">
                    <div
                      v-for="keyword in details.distributions.textual_analysis.common_keywords"
                      :key="keyword.word"
                      :class="$style.keyword"
                    >
                      <span :class="$style.keywordText">{{ keyword.word }}</span>
                      <span :class="$style.keywordCount">{{ keyword.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Responses -->
          <div v-if="details.recent_responses?.length" :class="$style.recentSection">
            <h3 :class="$style.sectionTitle">أحدث الردود</h3>
            <div :class="$style.responsesList">
              <div
                v-for="response in details.recent_responses.slice(0, 5)"
                :key="response.id"
                :class="$style.responseItem"
              >
                <div :class="$style.responseInfo">
                  <div :class="$style.responseAnswer">
                    <span v-if="response.selected_option">{{ response.selected_option.label }}</span>
                    <span v-else-if="response.text_excerpt">{{ response.text_excerpt }}</span>
                    <span v-else>{{ response.rating || 'غير محدد' }}</span>
                  </div>
                  <div :class="$style.responseMeta">
                    <span :class="$style.responseTime">{{ formatDateTime(response.response_time) }}</span>
                    <span :class="response.is_authenticated ? $style.authenticated : $style.anonymous">
                      {{ response.is_authenticated ? 'موثق' : 'مجهول' }}
                    </span>
                  </div>
                </div>
                <div v-if="response.completion_time_seconds" :class="$style.completionTime">
                  {{ formatDuration(response.completion_time_seconds) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Insights -->
          <div v-if="details.insights?.length" :class="$style.insightsSection">
            <h3 :class="$style.sectionTitle">الاستبصارات</h3>
            <div :class="$style.insightsList">
              <div
                v-for="insight in details.insights"
                :key="insight.type"
                :class="[$style.insightCard, $style[`insight-${insight.severity}`]]"
              >
                <div :class="$style.insightIcon">
                  <i :class="getInsightIcon(insight.type)"></i>
                </div>
                <div :class="$style.insightContent">
                  <div :class="$style.insightTitle">{{ insight.title }}</div>
                  <div :class="$style.insightDescription">{{ insight.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else :class="$style.errorContainer">
          <div :class="$style.errorIcon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>حدث خطأ في تحميل تفاصيل السؤال</p>
          <button :class="$style.retryButton" @click="$emit('retry')">
            إعادة المحاولة
          </button>
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
const closeModal = () => emit('close')

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

const formatDuration = (seconds: number) => {
  if (!seconds && seconds !== 0) return '0s'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  if (minutes > 0) return `${minutes}د ${remainingSeconds}ث`
  return `${remainingSeconds}ث`
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

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modalContainer {
  background: var(--surface, #ffffff);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modalHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 32px;
  border-bottom: 1px solid var(--border, #e0e0e0);
  background: var(--surface-variant, #f5f5f5);
}

.headerContent {
  flex: 1;
}

.questionBadge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--brand, #a17d23);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

.questionIcon {
  font-size: 14px;
}

.modalTitle {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--ink, #333);
  line-height: 1.3;
}

.questionMeta {
  display: flex;
  gap: 12px;
}

.questionType {
  padding: 4px 8px;
  background: var(--surface, #ffffff);
  color: var(--muted, #666);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.required {
  padding: 4px 8px;
  background: rgba(244, 67, 54, 0.1);
  color: #F44336;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.optional {
  padding: 4px 8px;
  background: rgba(158, 158, 158, 0.1);
  color: #9E9E9E;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.closeButton {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 50%;
  color: var(--muted, #666);
  cursor: pointer;
  transition: all 0.2s ease;
}

.closeButton:hover {
  background: #f5f5f5;
  color: var(--ink, #333);
}

.modalContent {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.loadingContainer,
.errorContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
  color: var(--muted, #666);
}

.loadingSpinner {
  font-size: 32px;
  color: var(--brand, #a17d23);
  margin-bottom: 16px;
}

.errorIcon {
  font-size: 48px;
  color: #F44336;
  margin-bottom: 16px;
}

.retryButton {
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--brand, #a17d23);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retryButton:hover {
  background: var(--brand-dark, #8b6914);
}

.contentContainer {
  padding: 32px;
}

.summaryGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.summaryCard {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summaryCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.summaryIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
}

.summaryContent {
  flex: 1;
}

.summaryNumber {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink, #333);
  line-height: 1;
  margin-bottom: 4px;
}

.summaryLabel {
  font-size: 13px;
  color: var(--muted, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.visualizationsContainer {
  margin-bottom: 40px;
}

.chartSection {
  margin-bottom: 40px;
}

.sectionTitle {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ink, #333);
}

.optionsChart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.optionBar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.optionInfo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.optionLabel {
  font-weight: 500;
  color: var(--ink, #333);
}

.optionStats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.optionCount {
  font-weight: 600;
  color: var(--brand, #a17d23);
}

.optionPercent {
  font-size: 14px;
  color: var(--muted, #666);
}

.optionBarContainer {
  height: 12px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 6px;
  overflow: hidden;
}

.optionBarFill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand, #a17d23), var(--brand-light, #d4af5a));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.ratingStats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.ratingCard {
  text-align: center;
  padding: 20px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 12px;
}

.ratingValue {
  font-size: 32px;
  font-weight: 700;
  color: var(--brand, #a17d23);
  line-height: 1;
  margin-bottom: 8px;
}

.ratingLabel {
  font-size: 14px;
  color: var(--muted, #666);
  font-weight: 500;
}

.ratingChart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ratingBar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratingInfo {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ratingStars {
  display: flex;
  gap: 4px;
  font-size: 16px;
}

.ratingStats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ratingBarContainer {
  height: 12px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 6px;
  overflow: hidden;
}

.ratingBarFill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA000);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.yesNoChart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.yesNoOption {
  display: flex;
  align-items: center;
  gap: 16px;
}

.yesNoIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-variant, #f5f5f5);
  font-size: 18px;
}

.yesNoInfo {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.yesNoLabel {
  font-weight: 500;
  color: var(--ink, #333);
}

.yesNoStats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.yesNoCount {
  font-weight: 600;
  color: var(--ink, #333);
}

.yesNoPercent {
  font-size: 14px;
  color: var(--muted, #666);
}

.yesNoBar {
  flex: 2;
  height: 12px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 6px;
  overflow: hidden;
}

.yesNoBarFill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.textAnalysis {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.textStats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.textStat {
  text-align: center;
  padding: 20px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 12px;
}

.textStatValue {
  font-size: 28px;
  font-weight: 700;
  color: var(--brand, #a17d23);
  line-height: 1;
  margin-bottom: 8px;
}

.textStatLabel {
  font-size: 14px;
  color: var(--muted, #666);
  font-weight: 500;
}

.keywordsSection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.keywordsTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink, #333);
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.keyword {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 20px;
  border: 1px solid var(--border, #e0e0e0);
}

.keywordText {
  font-weight: 500;
  color: var(--ink, #333);
}

.keywordCount {
  background: var(--brand, #a17d23);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.recentSection {
  margin-bottom: 40px;
}

.responsesList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.responseItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--surface-variant, #f5f5f5);
  border-radius: 12px;
  border: 1px solid var(--border, #e0e0e0);
}

.responseInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.responseAnswer {
  font-weight: 500;
  color: var(--ink, #333);
}

.responseMeta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.responseTime {
  font-size: 12px;
  color: var(--muted, #666);
}

.authenticated {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border-radius: 8px;
  font-weight: 500;
}

.anonymous {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(158, 158, 158, 0.1);
  color: #9E9E9E;
  border-radius: 8px;
  font-weight: 500;
}

.completionTime {
  font-size: 12px;
  color: var(--muted, #666);
  font-weight: 500;
}

.insightsSection {
  margin-bottom: 20px;
}

.insightsList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insightCard {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid;
}

.insight-info {
  background: rgba(33, 150, 243, 0.1);
  border-left-color: #2196F3;
}

.insight-success {
  background: rgba(76, 175, 80, 0.1);
  border-left-color: #4CAF50;
}

.insight-warning {
  background: rgba(255, 152, 0, 0.1);
  border-left-color: #FF9800;
}

.insightIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface, #ffffff);
  font-size: 18px;
  flex-shrink: 0;
}

.insight-info .insightIcon {
  color: #2196F3;
}

.insight-success .insightIcon {
  color: #4CAF50;
}

.insight-warning .insightIcon {
  color: #FF9800;
}

.insightContent {
  flex: 1;
}

.insightTitle {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink, #333);
}

.insightDescription {
  margin: 0;
  font-size: 14px;
  color: var(--muted, #666);
  line-height: 1.5;
}

/* Dark Theme */
.modalContainer[data-theme="night"] {
  --surface: #2d3748;
  --surface-variant: #4a5568;
  --ink: #f7fafc;
  --muted: #a0aec0;
  --border: #4a5568;
  --brand: #a17d23;
  --brand-light: #d4af5a;
  --brand-dark: #8b6914;
}

/* RTL Support */
.modalContainer[dir="rtl"] .modalHeader {
  flex-direction: row-reverse;
}

.modalContainer[dir="rtl"] .optionInfo {
  flex-direction: row-reverse;
}

.modalContainer[dir="rtl"] .yesNoOption {
  flex-direction: row-reverse;
}

.modalContainer[dir="rtl"] .responseItem {
  flex-direction: row-reverse;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modalOverlay {
    padding: 10px;
  }
  
  .modalHeader {
    padding: 20px;
  }
  
  .contentContainer {
    padding: 20px;
  }
  
  .summaryGrid {
    grid-template-columns: 1fr;
  }
  
  .ratingStats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .textStats {
    grid-template-columns: 1fr;
  }
}
</style>

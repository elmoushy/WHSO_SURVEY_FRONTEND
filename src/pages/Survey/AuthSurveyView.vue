<template>
  <div :class="$style.publicSurveyContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري تحميل الاستطلاع...</p>
    </div>

    <!-- Access Denied -->
    <div v-else-if="accessDenied" :class="$style.accessDenied">
      <div :class="$style.deniedIcon">
        <i class="fas fa-lock"></i>
      </div>
      <h2 :class="$style.deniedTitle">الوصول مرفوض</h2>
      <p :class="$style.deniedMessage">{{ accessMessage }}</p>
      <button :class="$style.secondaryButton" @click="goBack">
        <i class="fas fa-arrow-left"></i>
        {{ t('common.goBack') }}
      </button>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2 :class="$style.errorTitle">خطأ</h2>
      <p :class="$style.errorMessage">{{ error }}</p>
      <button :class="$style.secondaryButton" @click="loadSurvey">
        <i class="fas fa-redo"></i>
        إعادة المحاولة
      </button>
    </div>

    <!-- Timeout Error State -->
    <div v-else-if="timeoutError" :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i class="fas fa-clock"></i>
      </div>
      <h2 :class="$style.errorTitle">انتهت مهلة الطلب</h2>
      <p :class="$style.errorMessage">فشل في تحميل الاستطلاع خلال 15 ثانية</p>
      <div :class="$style.errorActions">
        <button :class="$style.secondaryButton" @click="loadSurvey">
          <i class="fas fa-redo"></i>
          إعادة المحاولة
        </button>
        <button :class="$style.secondaryButton" @click="refreshPage">
          <i class="fas fa-sync-alt"></i>
          تحديث الصفحة
        </button>
      </div>
    </div>

    <!-- Survey Preview (Before Starting) -->
    <div v-else-if="survey && !surveyStarted" :class="$style.surveyContent">
      <!-- Survey Header -->
      <div :class="$style.surveyHeader">
        <div :class="$style.surveyBranding">
          <div :class="$style.surveyIcon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <h1 :class="$style.surveyTitle">{{ survey.title }}</h1>
          <p v-if="survey.description" :class="$style.surveyDescription">{{ survey.description }}</p>
        </div>
        
        <div :class="$style.surveyMeta">
          <div :class="$style.metaItem">
            <i class="fas fa-question-circle"></i>
            <span>{{ survey.questions_count || survey.questions?.length || 0 }} سؤال</span>
          </div>
          <div :class="$style.metaItem">
            <i class="fas fa-user-shield"></i>
            <span>استطلاع محمي</span>
          </div>
        </div>
      </div>

      <!-- Welcome Section -->
      <div :class="$style.welcomeSection">
        <div :class="$style.welcomeContent">
          <div :class="$style.welcomeIcon">
            <i class="fas fa-heart"></i>
          </div>
          <h3 :class="$style.welcomeTitle">أهلاً وسهلاً بك في الاستطلاع المحمي</h3>
          <p :class="$style.welcomeText">نقدر وقتك وآرائك القيمة. هذا الاستطلاع محمي ويتطلب المصادقة للوصول إليه. إجاباتك ستساعدنا في تحسين خدماتنا وتطوير تجربة أفضل للجميع.</p>
        </div>
      </div>


      <!-- Action Buttons -->
      <div :class="$style.actionButtons">
        <button :class="$style.startButton" @click="startSurvey">
          <i class="fas fa-play"></i>
          <span>ابدأ الاستطلاع الآن</span>
        </button>
        
        <div :class="$style.secondaryActions">
          <button :class="$style.secondaryButton" @click="goBack">
            <i class="fas fa-arrow-left"></i>
            <span>العودة</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Survey Form (When Started) -->
    <div v-else-if="survey && surveyStarted" :class="$style.surveyForm">
      <!-- Survey Form Header -->
      <div :class="$style.formHeader">
        <div :class="$style.formTitleSection">
          <h1 :class="$style.formTitle">{{ survey.title }}</h1>
          <div :class="$style.formSubtitle">
            <i class="fas fa-user-edit"></i>
            <span>يرجى الإجابة على الأسئلة التالية بعناية</span>
          </div>
        </div>
        
        <!-- View Mode Toggle -->
        <div :class="$style.viewModeToggle">
          <button 
            :class="[$style.toggleButton, { [$style.active]: showAllQuestions }]"
            @click="showAllQuestions = true"
          >
            <i class="fas fa-list"></i>
            <span>جميع الأسئلة</span>
          </button>
          <button 
            :class="[$style.toggleButton, { [$style.active]: !showAllQuestions }]"
            @click="showAllQuestions = false"
          >
            <i class="fas fa-step-forward"></i>
            <span>سؤال بسؤال</span>
          </button>
        </div>
        
        <div v-if="!showAllQuestions" :class="$style.progressSection">
          <div :class="$style.progressBar">
            <div :class="$style.progressFill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div :class="$style.progressInfo">
            <span :class="$style.progressText">
              السؤال {{ currentQuestionIndex + 1 }} من {{ survey.questions?.length || 0 }}
            </span>
          </div>
        </div>
      </div>

      <!-- All Questions View (Google Forms Style) -->
      <div v-if="showAllQuestions" :class="$style.allQuestionsContainer">
        <div 
          v-for="(question, qIndex) in survey.questions" 
          :key="question.id"
          :class="$style.currentQuestion"
        >
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <span :class="$style.questionIndex">{{ qIndex + 1 }}</span>
            </div>
            <h2 :class="$style.questionTitle">
              {{ question.text }}
              <span v-if="question.is_required" :class="$style.required">*</span>
            </h2>
            <div v-if="question.is_required" :class="$style.requiredNote">
              <i class="fas fa-star"></i>
              <span>هذا السؤال مطلوب</span>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="question.question_type === 'text'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <input
                :type="getInputConfig(question.validation_type || 'none').type"
                :pattern="getInputConfig(question.validation_type || 'none').pattern"
                :class="[$style.textInput, { [$style.inputError]: getValidationError(question.id) }]"
                v-model="answers[question.id]"
                :maxlength="getMaxLength('text')"
                @blur="handleInputBlur(question)"
                @input="(e) => { clearValidationError(question.id); handleTextInput(question.id, 'text', e); }"
                :placeholder="getInputConfig(question.validation_type || 'none').placeholder || 'اكتب إجابتك هنا...'"
              />
            </div>
            <div :class="$style.characterCount" :data-warning="getRemainingCharacters(question.id, 'text') < 100">
              <span>{{ getCharacterCount(question.id) }} / {{ getMaxLength('text') }}</span>
              <span v-if="getRemainingCharacters(question.id, 'text') < 100" :class="$style.remainingWarning">
                ({{ getRemainingCharacters(question.id, 'text') }} حرف متبقي)
              </span>
            </div>
            <div v-if="getValidationError(question.id)" :class="$style.errorMessage">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ getValidationError(question.id) }}</span>
            </div>
          </div>

          <!-- Textarea Input -->
          <div v-else-if="question.question_type === 'textarea'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <textarea
                :class="$style.textArea"
                v-model="answers[question.id]"
                :maxlength="getMaxLength('textarea')"
                @input="(e) => handleTextInput(question.id, 'textarea', e)"
                placeholder="اكتب إجابتك المفصلة هنا... يمكنك كتابة عدة أسطر"
                rows="4"
              ></textarea>
            </div>
            <div :class="$style.characterCount" :data-warning="getRemainingCharacters(question.id, 'textarea') < 200">
              <span>{{ getCharacterCount(question.id) }} / {{ getMaxLength('textarea') }}</span>
              <span v-if="getRemainingCharacters(question.id, 'textarea') < 200" :class="$style.remainingWarning">
                ({{ getRemainingCharacters(question.id, 'textarea') }} حرف متبقي)
              </span>
            </div>
          </div>

          <!-- Single Choice -->
          <div v-else-if="question.question_type === 'single_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>اختر إجابة واحدة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(question.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: answers[question.id] === option }]"
              @click="answers[question.id] = option"
            >
              <div :class="$style.choiceRadio">
                <div v-if="answers[question.id] === option" :class="$style.radioSelected"></div>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="answers[question.id] === option">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="question.question_type === 'multiple_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-check-square"></i>
              <span>يمكنك اختيار أكثر من إجابة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(question.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.multiSelected]: Array.isArray(answers[question.id]) && answers[question.id].includes(option) }]"
              @click="toggleMultipleChoice(question.id, option)"
            >
              <div :class="$style.choiceCheckbox">
                <i v-if="Array.isArray(answers[question.id]) && answers[question.id].includes(option)" class="fas fa-check"></i>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
            </div>
          </div>

          <!-- Yes/No -->
          <div v-else-if="question.question_type === 'yes_no'" :class="$style.yesNoWrapper">
            <div :class="$style.yesNoContainer">
              <div :class="$style.yesNoButtons">
                <button
                  :class="[$style.yesNoButton, $style.yes, { [$style.selected]: answers[question.id] === 'yes' }]"
                  @click="answers[question.id] = 'yes'"
                  type="button"
                  :aria-pressed="answers[question.id] === 'yes'"
                >
                  <i class="fas fa-check" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">نعم</span>
                  <div :class="$style.yesNoButtonBadge">
                    <i class="fas fa-check"></i>
                  </div>
                </button>
                <button
                  :class="[$style.yesNoButton, $style.no, { [$style.selected]: answers[question.id] === 'no' }]"
                  @click="answers[question.id] = 'no'"
                  type="button"
                  :aria-pressed="answers[question.id] === 'no'"
                >
                  <i class="fas fa-times" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">لا</span>
                  <div :class="$style.yesNoButtonBadge">
                    <i class="fas fa-times"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Rating Scale -->
          <div v-else-if="question.question_type === 'rating'" :class="$style.ratingContainer">
            <div :class="$style.ratingLabels">
              <span>{{ getRatingLabel('min', question.options) }}</span>
              <span>{{ getRatingLabel('max', question.options) }}</span>
            </div>
            <div :class="$style.ratingScale">
              <button
                v-for="rating in getRatingOptions(question.options)"
                :key="rating"
                :class="[$style.ratingButton, { [$style.selected]: answers[question.id] === rating }]"
                @click="answers[question.id] = rating"
              >
                {{ rating }}
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Button Container (All Questions View) -->
        <div :class="$style.submitContainer">
          <button
            :class="[$style.navButton, $style.submit]"
            @click="submitSurvey"
            :disabled="!canSubmit || isSubmitting"
          >
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
            <span>{{ isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستطلاع' }}</span>
          </button>
        </div>
      </div>

      <!-- Single Question View (One-by-one) -->
      <div v-else>
      <!-- Current Question -->
      <div :class="$style.questionContainer">
        <div :class="$style.currentQuestion" v-if="currentQuestion">
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <span :class="$style.questionIndex">{{ currentQuestionIndex + 1 }}</span>
            </div>
            <h2 :class="$style.questionTitle">
              {{ currentQuestion.text }}
              <span v-if="currentQuestion.is_required" :class="$style.required">*</span>
            </h2>
            <div v-if="currentQuestion.is_required" :class="$style.requiredNote">
              <i class="fas fa-star"></i>
              <span>هذا السؤال مطلوب</span>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="currentQuestion.question_type === 'text'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <input
                :type="getInputConfig(currentQuestion.validation_type || 'none').type"
                :pattern="getInputConfig(currentQuestion.validation_type || 'none').pattern"
                :class="[$style.textInput, { [$style.inputError]: getValidationError(currentQuestion.id) }]"
                v-model="answers[currentQuestion.id]"
                :maxlength="getMaxLength('text')"
                @blur="handleInputBlur(currentQuestion)"
                @input="(e) => { if (currentQuestion) { clearValidationError(currentQuestion.id); handleTextInput(currentQuestion.id, 'text', e); } }"
                :placeholder="getInputConfig(currentQuestion.validation_type || 'none').placeholder || 'اكتب إجابتك هنا...'"
              />
            </div>
            <div :class="$style.characterCount" :data-warning="getRemainingCharacters(currentQuestion.id, 'text') < 100">
              <span>{{ getCharacterCount(currentQuestion.id) }} / {{ getMaxLength('text') }}</span>
              <span v-if="getRemainingCharacters(currentQuestion.id, 'text') < 100" :class="$style.remainingWarning">
                ({{ getRemainingCharacters(currentQuestion.id, 'text') }} حرف متبقي)
              </span>
            </div>
            <div v-if="getValidationError(currentQuestion.id)" :class="$style.errorMessage">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ getValidationError(currentQuestion.id) }}</span>
            </div>
          </div>

          <!-- Textarea Input -->
          <div v-else-if="currentQuestion.question_type === 'textarea'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <textarea
                :class="$style.textArea"
                v-model="answers[currentQuestion.id]"
                :maxlength="getMaxLength('textarea')"
                @input="(e) => { if (currentQuestion) handleTextInput(currentQuestion.id, 'textarea', e); }"
                placeholder="اكتب إجابتك المفصلة هنا... يمكنك كتابة عدة أسطر"
                rows="4"
              ></textarea>
            </div>
            <div :class="$style.characterCount" :data-warning="getRemainingCharacters(currentQuestion.id, 'textarea') < 200">
              <span>{{ getCharacterCount(currentQuestion.id) }} / {{ getMaxLength('textarea') }}</span>
              <span v-if="getRemainingCharacters(currentQuestion.id, 'textarea') < 200" :class="$style.remainingWarning">
                ({{ getRemainingCharacters(currentQuestion.id, 'textarea') }} حرف متبقي)
              </span>
            </div>
          </div>

          <!-- Single Choice -->
          <div v-else-if="currentQuestion.question_type === 'single_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>اختر إجابة واحدة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(currentQuestion.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: answers[currentQuestion.id] === option }]"
              @click="answers[currentQuestion.id] = option"
            >
              <div :class="$style.choiceRadio">
                <div v-if="answers[currentQuestion.id] === option" :class="$style.radioSelected"></div>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="answers[currentQuestion.id] === option">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="currentQuestion.question_type === 'multiple_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-check-square"></i>
              <span>يمكنك اختيار أكثر من إجابة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(currentQuestion.options)"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: isOptionSelected(currentQuestion.id, option) }]"
              @click="toggleMultipleChoice(currentQuestion.id, option)"
            >
              <div :class="$style.choiceCheckbox">
                <i v-if="isOptionSelected(currentQuestion.id, option)" class="fas fa-check"></i>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="isOptionSelected(currentQuestion.id, option)">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>

          <!-- Rating -->
          <div v-else-if="currentQuestion.question_type === 'rating'" :class="$style.ratingContainer">
            <div :class="$style.ratingTitle">
              <i class="fas fa-star"></i>
              <span>قيم من {{ getRatingRange(currentQuestion.options) }}:</span>
            </div>
            <div :class="$style.ratingScale">
              <button
                v-for="rating in getRatingOptions(currentQuestion.options)"
                :key="rating"
                :class="[$style.ratingButton, { [$style.selected]: answers[currentQuestion.id] === rating }]"
                @click="answers[currentQuestion.id] = rating"
              >
                <span :class="$style.ratingNumber">{{ rating }}</span>
              </button>
            </div>
            <div :class="$style.ratingLabels">
              <span>{{ getRatingLabel('min') }}</span>
              <span>{{ getRatingLabel('max') }}</span>
            </div>
          </div>

          <!-- Yes/No -->
          <div v-else-if="currentQuestion.question_type === 'yes_no'" :class="$style.yesNoWrapper">
            <div :class="$style.yesNoTitle">
              <i class="fas fa-question-circle" :class="$style.yesNoTitleIcon"></i>
              <span :class="$style.yesNoTitleText">سؤال اختيار</span>
            </div>
            <div :class="$style.yesNoSubtitle">اختر الخيار الذي يناسب رأيك</div>
            <div :class="$style.yesNoContainer">
              <div :class="$style.yesNoButtons">
                <button
                  :class="[$style.yesNoButton, $style.yes, { [$style.selected]: answers[currentQuestion.id] === 'yes' }]"
                  @click="answers[currentQuestion.id] = 'yes'"
                  type="button"
                  :aria-pressed="answers[currentQuestion.id] === 'yes'"
                >
                  <i class="fas fa-check" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">نعم</span>
                  <div :class="$style.yesNoButtonBadge">
                    <i class="fas fa-check"></i>
                  </div>
                </button>
                <button
                  :class="[$style.yesNoButton, $style.no, { [$style.selected]: answers[currentQuestion.id] === 'no' }]"
                  @click="answers[currentQuestion.id] = 'no'"
                  type="button"
                  :aria-pressed="answers[currentQuestion.id] === 'no'"
                >
                  <i class="fas fa-times" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">لا</span>
                  <div :class="$style.yesNoButtonBadge">
                    <i class="fas fa-times"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Validation Error -->
          <!-- <div v-if="questionError" :class="$style.errorMessage">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ questionError }}</span>
          </div> -->
        </div>
      </div>

      <!-- Form Navigation -->
      <div :class="$style.formNavigation">
        <button
          v-if="currentQuestionIndex < (survey.questions?.length || 0) - 1"
          :class="[$style.navButton, $style.next]"
          @click="nextQuestion"
          :disabled="!canProceed"
        >
          <span>السؤال التالي</span>
          <i class="fas fa-arrow-left"></i>
        </button>

        <button
          v-if="currentQuestionIndex === (survey.questions?.length || 0) - 1"
          :class="[$style.navButton, $style.submit]"
          @click="submitSurvey"
          :disabled="!canSubmit || isSubmitting"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          <span>{{ isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستطلاع' }}</span>
        </button>

        <div :class="$style.navSpacer"></div>

        <button
          v-if="currentQuestionIndex > 0"
          :class="$style.navButton"
          @click="previousQuestion"
        >
          <i class="fas fa-arrow-right"></i>
          <span>السؤال السابق</span>
        </button>
      </div>
      </div>
      <!-- End of Single Question View -->
    </div>

    <!-- Thank You Modal -->
    <ThankYouModal 
      :isVisible="showThankYouModal" 
      @close="handleModalClose" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { surveyService } from '@/services/surveyService'
import { ThankYouModal } from '@/components/ThankYouModal'
import { useInputValidation } from '@/composables/useInputValidation'
import Swal from 'sweetalert2'
import type { 
  AuthSurvey, 
  AuthResponseSubmission
} from '@/types/survey.types'

// Composables
const route = useRoute()
const router = useRouter()
const { t, currentTheme, isRTL } = useI18n()
const {
  getInputConfig,
  validateAnswer,
  getValidationError,
  setValidationError,
  clearValidationError,
  handleBackendValidationErrors
} = useInputValidation()

// Constants for character limits
const MAX_TEXT_LENGTH = 400
const MAX_TEXTAREA_LENGTH = 2000

// State
const survey = ref<AuthSurvey | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const timeoutError = ref(false)
const accessDenied = ref(false)
const accessMessage = ref('')
const surveyStarted = ref(false)
const showAllQuestions = ref(true) // Default to showing all questions like Google Forms
const currentQuestionIndex = ref(0)
const answers = ref<Record<string, any>>({})
const questionError = ref('')
const isSubmitting = ref(false)
const showThankYouModal = ref(false)

// Computed
const currentQuestion = computed(() => {
  if (!survey.value || !survey.value.questions) return null
  return survey.value.questions[currentQuestionIndex.value]
})

const progressPercentage = computed(() => {
  if (!survey.value) return 0
  return ((currentQuestionIndex.value + 1) / (survey.value.questions?.length || 1)) * 100
})

const canProceed = computed(() => {
  if (!currentQuestion.value) return false
  
  const answer = answers.value[currentQuestion.value.id]
  
  // If question is required, answer must be provided
  if (currentQuestion.value.is_required) {
    if (currentQuestion.value.question_type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }
  
  // If not required, can always proceed
  return true
})

const canSubmit = computed(() => {
  if (!survey.value) return false
  
  // Check all required questions have answers
  for (const question of survey.value.questions) {
    if (question.is_required) {
      const answer = answers.value[question.id]
      if (question.question_type === 'multiple_choice') {
        if (!Array.isArray(answer) || answer.length === 0) return false
      } else {
        if (answer === undefined || answer === null || answer === '') return false
      }
    }
  }
  
  return true
})

// Methods
const loadSurvey = async () => {
  try {
    isLoading.value = true
    error.value = null
    timeoutError.value = false
    accessDenied.value = false
    
    const surveyId = route.params.id as string

    if (!surveyId) {
      error.value = 'معرف الاستطلاع غير مُتاح'
      await Swal.fire({
        title: 'خطأ',
        text: 'معرف الاستطلاع غير مُتاح',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
      return
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })

    const response = await Promise.race([
      surveyService.getAuthSurvey(surveyId),
      timeoutPromise
    ]) as any
    
    if (response.data && response.data.survey) {
      survey.value = response.data.survey
      initializeAnswers()
    } else {
      error.value = 'الاستطلاع غير موجود'
      await Swal.fire({
        title: 'خطأ',
        text: 'الاستطلاع غير موجود',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    }
  } catch (err: any) {
    // Logging removed for production
    
    // Extract error message from response if available
    let errorMessage = err.message || 'فشل في تحميل الاستطلاع'
    
    // Check if error has a response with message field
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    }
    
    if (err.message === 'TIMEOUT') {
      timeoutError.value = true
      await Swal.fire({
        title: 'انتهت مهلة الطلب',
        text: 'فشل في تحميل الاستطلاع خلال 15 ثانية. يرجى المحاولة مرة أخرى.',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    } else if (err.message?.includes('403') || err.message?.includes('Access denied')) {
      accessDenied.value = true
      accessMessage.value = errorMessage
    } else if (err.message?.includes('404')) {
      error.value = errorMessage
      await Swal.fire({
        title: 'خطأ',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    } else if (err.message?.includes('401')) {
      accessDenied.value = true
      accessMessage.value = errorMessage
    } else {
      error.value = errorMessage
      await Swal.fire({
        title: 'خطأ في تحميل الاستطلاع',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    }
  } finally {
    isLoading.value = false
  }
}

const initializeAnswers = () => {
  if (!survey.value) return
  
  const initialAnswers: Record<string, any> = {}
  survey.value.questions.forEach(question => {
    if (question.question_type === 'multiple_choice') {
      initialAnswers[question.id] = []
    } else {
      initialAnswers[question.id] = ''
    }
  })
  answers.value = initialAnswers
}

const startSurvey = () => {
  surveyStarted.value = true
  currentQuestionIndex.value = 0
}

const nextQuestion = () => {
  if (!canProceed.value) {
    questionError.value = 'يرجى الإجابة على هذا السؤال للمتابعة'
    return
  }
  
  questionError.value = ''
  if (currentQuestionIndex.value < (survey.value!.questions?.length || 0) - 1) {
    currentQuestionIndex.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    questionError.value = ''
  }
}

const handleInputBlur = (question: any) => {
  const answer = answers.value[question.id]
  const validationType = question.validation_type || 'none'
  
  if (validationType === 'none') {
    return
  }
  
  const result = validateAnswer(validationType, answer || '', question.is_required)
  
  if (!result.valid && result.error) {
    setValidationError(question.id, result.error)
  }
}

const submitSurvey = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    // Prepare submission data
    const submissionData: AuthResponseSubmission = {
      survey_id: survey.value!.id,
      answers: []
    }
    
    // Convert answers to API format
    for (const question of survey.value!.questions) {
      const answer = answers.value[question.id]
      if (answer !== undefined && answer !== null && answer !== '') {
        let answerText: string
        
        if (question.question_type === 'multiple_choice') {
          answerText = Array.isArray(answer) ? answer.join(', ') : answer.toString()
        } else {
          answerText = answer.toString()
        }
        
        submissionData.answers.push({
          question_id: question.id,
          answer_text: answerText
        })
      }
    }
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })
    
    await Promise.race([
      surveyService.submitAuthResponse(submissionData),
      timeoutPromise
    ])
    
    // Show success message and then thank you modal
    await Swal.fire({
      title: 'تم الإرسال بنجاح',
      text: 'تم إرسال إجابات الاستطلاع بنجاح. شكراً لمشاركتك!',
      icon: 'success',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#28a745'
    })
    
    // Show thank you modal instead of redirecting immediately
    showThankYouModal.value = true
    
  } catch (err: any) {
    // Handle backend validation errors
    if (err.response?.data?.data?.validation_errors) {
      handleBackendValidationErrors(err.response.data.data.validation_errors)
      await Swal.fire({
        title: 'خطأ في التحقق من صحة البيانات',
        text: 'يرجى تصحيح الأخطاء في الاستطلاع والمحاولة مرة أخرى',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
      return
    }
    
    // Logging removed for production
    
    // Extract error message from response if available
    let errorMessage = err.message || 'فشل في إرسال إجابات الاستطلاع'
    
    // Check if error has a response with message field
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    }
    
    if (err.message === 'TIMEOUT') {
      await Swal.fire({
        title: 'انتهت مهلة الطلب',
        text: 'فشل في إرسال الإجابات خلال 15 ثانية. يرجى المحاولة مرة أخرى.',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    } else {
      await Swal.fire({
        title: 'خطأ في الإرسال',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    }
    questionError.value = errorMessage
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/surveys')
}

const refreshPage = () => {
  window.location.reload()
}

const handleModalClose = () => {
  showThankYouModal.value = false
  // Redirect to surveys page after modal is closed
  router.push('/surveys')
}

// Character count helpers
const getMaxLength = (questionType: string): number => {
  return questionType === 'textarea' ? MAX_TEXTAREA_LENGTH : MAX_TEXT_LENGTH
}

const getCharacterCount = (questionId: string): number => {
  const answer = answers.value[questionId]
  return answer ? String(answer).length : 0
}

const getRemainingCharacters = (questionId: string, questionType: string): number => {
  const max = getMaxLength(questionType)
  const current = getCharacterCount(questionId)
  return max - current
}

const handleTextInput = (questionId: string, questionType: string, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  const maxLength = getMaxLength(questionType)
  
  // Prevent input if max length is exceeded
  if (target.value.length > maxLength) {
    target.value = target.value.substring(0, maxLength)
    answers.value[questionId] = target.value
  }
}

// Helper methods for question types
const isOptionSelected = (questionId: string, option: string): boolean => {
  const answer = answers.value[questionId]
  return Array.isArray(answer) && answer.includes(option)
}

const toggleMultipleChoice = (questionId: string, option: string) => {
  if (!Array.isArray(answers.value[questionId])) {
    answers.value[questionId] = []
  }
  
  const currentAnswers = answers.value[questionId] as string[]
  const index = currentAnswers.indexOf(option)
  
  if (index > -1) {
    currentAnswers.splice(index, 1)
  } else {
    currentAnswers.push(option)
  }
}

const getRatingRange = (options: string | undefined): string => {
  if (!options) return '1 إلى 5'
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) return '1 إلى 5'
    
    // Convert options to numbers for proper sorting
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
    
    if (numericOptions.length === 0) return '1 إلى 5'
    
    const min = Math.min(...numericOptions)
    const max = Math.max(...numericOptions)
    
    return `${min} إلى ${max}`
  } catch (error) {
    // Logging removed for production
    return '1 إلى 5'
  }
}

const getQuestionOptions = (options: string | undefined): string[] => {
  if (!options) return []
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray)) {
      return []
    }
    
    return optionsArray.map((opt: any) => String(opt))
  } catch (error) {
    // Logging removed for production
    return []
  }
}

const getRatingOptions = (options: string | undefined): any[] => {
  if (!options) return [1, 2, 3, 4, 5]
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return [1, 2, 3, 4, 5]
    }
    
    // Sort the options numerically if they are numbers
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b)
    
    return numericOptions.length > 0 ? numericOptions : optionsArray
  } catch (error) {
    // Logging removed for production
    return [1, 2, 3, 4, 5]
  }
}

const getRatingLabel = (type: 'min' | 'max', questionOptions?: string): string => {
  const optionsToUse = questionOptions || currentQuestion.value?.options
  
  if (!optionsToUse) {
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof optionsToUse === 'string' 
      ? JSON.parse(optionsToUse) 
      : optionsToUse
      
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    // Convert options to numbers for proper sorting
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b)
    
    if (numericOptions.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    return type === 'min' ? `${numericOptions[0]}` : `${numericOptions[numericOptions.length - 1]}`
  } catch (error) {
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
}

// Lifecycle
onMounted(() => {
  loadSurvey()
})
</script>

<style module src="./PublicSurveyView.module.css"></style>

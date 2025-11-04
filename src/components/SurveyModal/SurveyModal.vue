<template>
  <div :class="$style.modalOverlay">
    <div 
      :class="$style.modalContainer" 
      :data-theme="currentTheme" 
      :dir="isRTL ? 'rtl' : 'ltr'"
      @click.stop
    >
      <!-- Header -->
      <div :class="$style.modalHeader">
        <h2 :class="$style.modalTitle">
          <i class="fas fa-poll-h" :class="$style.modalIcon"></i>
          {{ isEditing ? t('survey.form.edit') : t('survey.form.create') }}
        </h2>
        <button :class="$style.closeButton" @click="$emit('cancel')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.modalBody">
        <form @submit.prevent="handleSubmit">
          <!-- Basic Information -->
          <div :class="$style.formSection">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-info-circle" :class="$style.sectionIcon"></i>
              {{ t('survey.form.basicInfo') }}
            </h3>
            
            <div :class="$style.formGrid">
              <div :class="[$style.formGroup, $style.fullWidth]">
                <label :class="[$style.formLabel, $style.required]">{{ t('survey.form.title') }}</label>
                <input
                  type="text"
                  :class="$style.formInput"
                  :placeholder="t('survey.form.titlePlaceholder')"
                  v-model="formData.title"
                  required
                />
                <div v-if="errors.title" :class="$style.errorMessage">
                  {{ errors.title }}
                </div>
              </div>
              
              <div :class="[$style.formGroup, $style.fullWidth]">
                <label :class="$style.formLabel">{{ t('survey.form.description') }}</label>
                <textarea
                  :class="[$style.formInput, $style.formTextarea]"
                  :placeholder="t('survey.form.descriptionPlaceholder')"
                  v-model="formData.description"
                  rows="3"
                ></textarea>
                <div v-if="errors.description" :class="$style.errorMessage">
                  {{ errors.description }}
                </div>
              </div>
            </div>
          </div>

          <!--Comment this for now Visibility Settings -->
          <!-- <div :class="$style.formSection">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-eye" :class="$style.sectionIcon"></i>
              {{ t('survey.form.visibility') }}
            </h3>
            <p :class="$style.helpText">{{ t('survey.form.visibilityDescription') }}</p>
            
            <div :class="$style.visibilityOptions">
              <div 
                v-for="option in visibilityOptions" 
                :key="option.value"
                :class="[$style.visibilityOption, { [$style.selected]: formData.visibility === option.value }]"
                @click="formData.visibility = option.value"
              >
                <div :class="$style.optionHeader">
                  <i :class="[option.icon, $style.optionIcon]"></i>
                  <h4 :class="$style.optionTitle">{{ option.title }}</h4>
                  <span v-if="option.value === 'AUTH'" :class="$style.defaultBadge">{{ t('survey.form.default') }}</span>
                </div>
                <p :class="$style.optionDescription">{{ option.description }}</p>
              </div>
            </div>
          </div> -->

          <!-- Scheduling Settings -->
          <div :class="$style.formSection">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-calendar-alt" :class="$style.sectionIcon"></i>
              {{ t('survey.form.scheduling') }}
            </h3>
            <p :class="$style.helpText">{{ t('survey.form.schedulingDescription') }}</p>
            
            <div :class="$style.formGrid">
              <div :class="$style.formGroup">
                <label :class="$style.formLabel">
                  <i class="fas fa-play" :class="$style.labelIcon"></i>
                  {{ t('survey.form.startDate') }}
                </label>
                <FlatPickr
                  v-model="formData.start_date"
                  :config="fpConfig"
                  :class="$style.formInput"
                  placeholder="Select start date and time"
                />
                <div :class="$style.fieldHelp">
                  {{ t('survey.form.startDateHelp') }}
                </div>
              </div>
              
              <div :class="$style.formGroup">
                <label :class="$style.formLabel">
                  <i class="fas fa-stop" :class="$style.labelIcon"></i>
                  {{ t('survey.form.endDate') }}
                </label>
                <FlatPickr
                  v-model="formData.end_date"
                  :config="fpConfig"
                  :class="$style.formInput"
                  placeholder="Select end date and time"
                />
                <div :class="$style.fieldHelp">
                  {{ t('survey.form.endDateHelp') }}
                </div>
              </div>
            </div>

            <!-- Scheduling Preview -->
            <div v-if="schedulingPreview" :class="$style.schedulingPreview">
              <div :class="[$style.previewItem, $style[schedulingPreview.status]]">
                <i :class="[schedulingPreview.icon, $style.previewIcon]"></i>
                <div :class="$style.previewContent">
                  <h4 :class="$style.previewTitle">{{ schedulingPreview.title }}</h4>
                  <p :class="$style.previewDescription">{{ schedulingPreview.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Survey Settings -->
          <div :class="$style.formSection">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-cog" :class="$style.sectionIcon"></i>
              {{ t('survey.form.settings') }}
            </h3>
            
            <div :class="$style.settingsGrid">
              <div :class="$style.settingItem">
                <div :class="$style.settingContent">
                  <h4 :class="$style.settingTitle">{{ t('survey.form.isActive') }}</h4>
                  <p :class="$style.settingDescription">{{ t('survey.form.isActiveDescription') }}</p>
                </div>
                <button
                  type="button"
                  :class="[$style.toggle, { [$style.active]: formData.is_active }]"
                  @click="formData.is_active = !formData.is_active"
                ></button>
              </div>
              
            </div>
          </div>

          <!-- Questions Preview -->
          <div :class="$style.formSection">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-question-circle" :class="$style.sectionIcon"></i>
              {{ t('survey.questions.title') }}
            </h3>
            
            <div :class="$style.questionsList">
              <div :class="$style.questionsHeader">
                <span :class="$style.questionsCount">
                  {{ formData.questions.length }} {{ inlineTranslations.questionsTitle }}
                </span>
                <button
                  type="button"
                  :class="$style.addQuestionButton"
                  @click="openAddQuestionModal"
                >
                  <i class="fas fa-plus"></i>
                  {{ inlineTranslations.addQuestion }}
                </button>
              </div>
              
              <div v-if="formData.questions.length === 0" :class="$style.questionsEmpty">
                <i class="fas fa-question-circle"></i>
                <p>{{ inlineTranslations.noQuestions }}</p>
              </div>
              
              <div v-else :class="$style.questionItems">
                <div 
                  v-for="(question, index) in formData.questions" 
                  :key="question.id || index"
                  :class="$style.questionItem"
                >
                  <div :class="$style.questionOrder">{{ index + 1 }}</div>
                  <div :class="$style.questionDragHandle" :title="isRTL ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'">
                    <i class="fas fa-grip-vertical"></i>
                  </div>
                  <div :class="$style.questionContent">
                    <h4 :class="$style.questionText">{{ question.text }}</h4>
                    <p :class="$style.questionType">
                      <i :class="getQuestionTypeIcon(question.question_type)"></i>
                      {{ getQuestionTypeLabel(question.question_type) }}
                    </p>
                    <div v-if="question.options && question.options.length > 0" :class="$style.questionOptions">
                      <strong>{{ isRTL ? 'الخيارات' : 'Options' }}:</strong> 
                      <span v-if="Array.isArray(question.options)">
                        {{ question.options.slice(0, 3).join(', ') }}
                        <span v-if="question.options.length > 3"> ({{ isRTL ? `+${question.options.length - 3} أكثر` : `+${question.options.length - 3} more` }})</span>
                      </span>
                      <span v-else>{{ question.options }}</span>
                    </div>
                  </div>
                  <div :class="$style.questionActions">
                    <button
                      type="button"
                      :class="$style.questionEditButton"
                      @click="editQuestion(index)"
                      :title="isRTL ? 'تعديل السؤال' : 'Edit question'"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      type="button"
                      :class="$style.questionDeleteButton"
                      @click="deleteQuestion(index)"
                      :title="isRTL ? 'حذف السؤال' : 'Delete question'"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div :class="$style.modalFooter">
        <button
          type="button"
          :class="[$style.footerButton, $style.cancelButton]"
          @click="$emit('cancel')"
        >
          {{ t('common.cancel') }}
        </button>
        
        <!-- Draft Save Button - only show for new surveys -->
        <button
          v-if="!isEditing"
          type="button"
          :class="[$style.footerButton, $style.draftButton, { [$style.loading]: isDraftLoading }]"
          @click="handleDraftSave"
          :disabled="isDraftLoading || !isDraftFormValid"
        >
          <div v-if="isDraftLoading" :class="$style.loadingSpinner"></div>
          <i v-else class="fas fa-file-alt"></i>
          {{ isRTL ? 'حفظ كمسودة' : 'Save as Draft' }}
        </button>
        
        <!-- Update Button for editing drafts -->
        <button
          v-if="isEditing && props.survey?.status === 'draft'"
          type="button"
          :class="[$style.footerButton, $style.saveButton, { [$style.loading]: isLoading }]"
          @click="handleDraftUpdate"
          :disabled="isLoading || !isFormValid"
        >
          <div v-if="isLoading" :class="$style.loadingSpinner"></div>
          <i v-else class="fas fa-save"></i>
          {{ isRTL ? 'تحديث المسودة' : 'Update Draft' }}
        </button>
        
        <!-- Submit Button - only for final submission when NOT editing -->
        <button
          v-if="!isEditing"
          type="button"
          :class="[$style.footerButton, $style.submitButton, { [$style.loading]: isSubmitLoading }]"
          @click="handleSubmit"
          :disabled="isSubmitLoading || !isFormValid"
        >
          <div v-if="isSubmitLoading" :class="$style.loadingSpinner"></div>
          <i v-else class="fas fa-paper-plane"></i>
          {{ isRTL ? 'إرسال الاستطلاع' : 'Submit Survey' }}
        </button>
      </div>
    </div>

    <!-- Question Modal -->
    <QuestionModal
      v-if="showQuestionModal"
      :question="editingQuestionData"
      @save="handleQuestionSave"
      @cancel="handleQuestionCancel"
    />

    <!-- Survey Access Modal -->
    <SurveyAccessModal
      v-if="showAccessModal && savedSurvey"
      :survey="savedSurvey"
      @save="handleAccessModalSave"
      @cancel="handleAccessModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import type { Survey, SurveyCreateRequest, SurveyVisibility, PublicContactMethod, QuestionCreateRequest } from '../../types/survey.types'
import QuestionModal from '../QuestionModal/QuestionModal.vue'
import SurveyAccessModal from '../SurveyAccessModal/SurveyAccessModal.vue'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import Swal from 'sweetalert2'

// Props
interface Props {
  survey?: Survey | null
}

const props = withDefaults(defineProps<Props>(), {
  survey: null
})

// Emits
const emit = defineEmits<{
  save: [data: SurveyCreateRequest, survey?: Survey]
  cancel: []
  draftSaved: [survey: Survey]
  draftUpdated: [survey: Survey]
  finalSubmit: [survey: Survey]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)
const isEditing = computed(() => !!props.survey)

// Inline translations computed property
const inlineTranslations = computed(() => {
  const isArabic = store.currentLanguage === 'ar'
  return {
    addQuestion: isArabic ? 'إضافة سؤال' : 'Add Question',
    noQuestions: isArabic ? 'لا توجد أسئلة' : 'No questions added yet',
    questionsTitle: isArabic ? 'الأسئلة' : 'questions'
  }
})

// State
const isLoading = ref(false)
const isDraftLoading = ref(false)
const isSubmitLoading = ref(false)
const showQuestionModal = ref(false)
const showAccessModal = ref(false)
const savedSurvey = ref<Survey | null>(null)
const errors = ref<Record<string, string>>({})
const editingQuestionIndex = ref<number | null>(null)
const editingQuestionData = ref<any>(null)
const isTimeoutError = ref(false)

const formData = ref<SurveyCreateRequest & { 
  allow_anonymous: boolean
  require_completion: boolean
  show_progress: boolean
  start_date: string | null
  end_date: string | null
  shared_with: number[]
  questions: any[]
}>({
  title: '',
  description: '',
  visibility: 'AUTH' as SurveyVisibility,
  public_contact_method: 'email' as PublicContactMethod,
  is_active: true,
  allow_anonymous: false,
  require_completion: false,
  show_progress: true,
  start_date: null,
  end_date: null,
  shared_with: [],
  questions: []
})

// Form validation
const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 && 
         Object.keys(errors.value).length === 0 &&
         formData.value.questions.length > 0
})

// Draft form validation (less strict - only title required)
const isDraftFormValid = computed(() => {
  return formData.value.title.trim().length > 0 && 
         Object.keys(errors.value).length === 0
})

// Flatpickr configuration
const fpConfig = computed(() => ({
  enableTime: true,
  time_24hr: true,              // Force 24-hour UI (no AM/PM)
  altInput: true,               // Show a nice 24h value to the user
  altFormat: 'Y-m-d H:i',       // UI display format (24h)
  dateFormat: "Y-m-d\\TH:i:S",  // Backend value format (unchanged)
  allowInput: true,
  minuteIncrement: 1
}))

// Visibility options
// @ts-ignore - Used in template
const visibilityOptions = computed(() => {
  const isArabic = store.currentLanguage === 'ar'
  return [
    {
      value: 'PUBLIC' as SurveyVisibility,
      title: isArabic ? 'عام' : 'Public',
      description: isArabic ? 'يمكن للجميع الوصول إليه، بما في ذلك المستخدمون غير المسجلين' : 'Everyone can access, including anonymous users',
      icon: 'fas fa-globe'
    },
    {
      value: 'AUTH' as SurveyVisibility,
      title: isArabic ? 'المستخدمون المصرح لهم' : 'Authenticated Users',
      description: isArabic ? 'جميع المستخدمين المصرح لهم يمكنهم الوصول (افتراضي)' : 'All authenticated users can access (Default)',
      icon: 'fas fa-users'
    },
    {
      value: 'PRIVATE' as SurveyVisibility,
      title: isArabic ? 'خاص' : 'Private',
      description: isArabic ? 'المنشئ والمستخدمون المحددون فقط يمكنهم الوصول' : 'Only creator and specified users can access',
      icon: 'fas fa-lock'
    }
  ]
})

// Scheduling preview
const schedulingPreview = computed(() => {
  const isArabic = store.currentLanguage === 'ar'
  const now = new Date()
  const startDate = formData.value.start_date ? new Date(formData.value.start_date) : null
  const endDate = formData.value.end_date ? new Date(formData.value.end_date) : null

  // Scenario 1: No dates
  if (!startDate && !endDate) {
    return {
      status: 'active',
      icon: 'fas fa-play-circle',
      title: isArabic ? 'يبدأ فورًا ويستمر إلى أجل غير مسمى' : 'Starts immediately, runs indefinitely',
      description: isArabic ? 'الاستطلاع سيكون نشطًا فور الإنشاء ولن ينتهي حتى يتم إيقافه يدوياً' : 'Survey will be active immediately after creation and won\'t expire until manually deactivated'
    }
  }

  // Scenario 2: Start only
  if (startDate && !endDate) {
    const isScheduled = startDate > now
    return {
      status: isScheduled ? 'scheduled' : 'active',
      icon: isScheduled ? 'fas fa-clock' : 'fas fa-play-circle',
      title: isArabic 
        ? (isScheduled ? `مجدول للبدء في ${startDate.toLocaleDateString('ar', { calendar: 'gregory' })}` : 'يبدأ فورًا ويستمر إلى أجل غير مسمى')
        : (isScheduled ? `Scheduled to start ${startDate.toLocaleDateString()}` : 'Starts immediately, runs indefinitely'),
      description: isArabic 
        ? 'الاستطلاع سيبدأ في التاريخ المحدد ويستمر إلى أجل غير مسمى'
        : 'Survey will start at specified date and run indefinitely'
    }
  }

  // Scenario 3: End only
  if (!startDate && endDate) {
    const isExpired = endDate < now
    return {
      status: isExpired ? 'expired' : 'active',
      icon: isExpired ? 'fas fa-stop-circle' : 'fas fa-play-circle',
      title: isArabic 
        ? (isExpired ? 'منتهي الصلاحية' : `يبدأ فورًا وينتهي في ${endDate.toLocaleDateString('ar', { calendar: 'gregory' })}`)
        : (isExpired ? 'Expired' : `Starts now, expires ${endDate.toLocaleDateString()}`),
      description: isArabic 
        ? 'الاستطلاع سيبدأ فور الإنشاء وتاريخ البداية سيتم تعيينه تلقائياً'
        : 'Survey starts immediately and start date will be auto-set to creation time'
    }
  }

  // Scenario 4: Both dates
  if (startDate && endDate) {
    const isScheduled = startDate > now
    const isExpired = endDate < now
    const isActive = startDate <= now && endDate > now
    
    let status: string, icon: string, title: string, description: string

    if (isExpired) {
      status = 'expired'
      icon = 'fas fa-stop-circle'
      title = isArabic ? 'منتهي الصلاحية' : 'Expired'
      description = isArabic ? 'انتهت صلاحية الاستطلاع' : 'Survey has expired'
    } else if (isScheduled) {
      status = 'scheduled'
      icon = 'fas fa-clock'
      title = isArabic 
        ? `مجدول من ${startDate.toLocaleDateString('ar', { calendar: 'gregory' })} إلى ${endDate.toLocaleDateString('ar', { calendar: 'gregory' })}`
        : `Scheduled from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
      description = isArabic ? 'الاستطلاع سيعمل خلال النافذة الزمنية المحددة' : 'Survey will run within the specified time window'
    } else if (isActive) {
      status = 'active'
      icon = 'fas fa-play-circle'
      title = isArabic 
        ? `نشط حتى ${endDate.toLocaleDateString('ar', { calendar: 'gregory' })}`
        : `Active until ${endDate.toLocaleDateString()}`
      description = isArabic ? 'الاستطلاع نشط حالياً وسينتهي في التاريخ المحدد' : 'Survey is currently active and will expire on the specified date'
    } else {
      status = 'inactive'
      icon = 'fas fa-pause-circle'
      title = isArabic ? 'غير نشط' : 'Inactive'
      description = isArabic ? 'حالة غير متوقعة' : 'Unexpected state'
    }

    return { status, icon, title, description }
  }

  return null
})

// Watch for survey prop changes
watch(() => props.survey, (newSurvey) => {
  if (newSurvey) {
    formData.value = {
      title: newSurvey.title,
      description: newSurvey.description,
      visibility: newSurvey.visibility,
      is_active: newSurvey.is_active,
      allow_anonymous: false, // These would come from survey settings
      require_completion: false,
      show_progress: true,
      start_date: null, // Add scheduling fields
      end_date: null,
      shared_with: [], // Add sharing field
      questions: newSurvey.questions || []
    }
  }
}, { immediate: true })

// Watch form changes for validation
watch(() => formData.value.title, (newTitle) => {
  validateField('title', newTitle)
})

watch(() => formData.value.description, (newDescription) => {
  validateField('description', newDescription || '')
})

// Methods
const validateField = (field: string, value: string) => {
  // Clear previous errors for this field
  const newErrors = { ...errors.value }
  delete newErrors[field]
  
  // Custom validation with hardcoded Arabic messages
  if (field === 'title') {
    if (!value || value.trim().length === 0) {
      newErrors[field] = 'عنوان الاستطلاع مطلوب'
    } else if (value.length > 200) {
      newErrors[field] = 'عنوان الاستطلاع يجب أن يكون أقل من 200 حرف'
    }
  }
  
  if (field === 'description') {
    if (value && value.length > 1000) {
      newErrors[field] = 'وصف الاستطلاع يجب أن يكون أقل من 1000 حرف'
    }
  }
  
  errors.value = newErrors
}

const updateSurveyQuestions = async (surveyId: string) => {
  // For now, we'll implement a simple approach:
  // This is a basic implementation - in production you might want to:
  // 1. Compare existing questions with new ones
  // 2. Update existing questions
  // 3. Add new questions
  // 4. Delete removed questions
  
  // For simplicity, we'll just add new questions that don't have a proper UUID
  for (const question of formData.value.questions) {
    // If question doesn't have a proper UUID (starts with temporary ID), add it
    if (!question.id || typeof question.id === 'number') {
      const questionData = {
        text: question.text,
        question_type: question.question_type,
        options: question.options,
        is_required: question.is_required || false,
        order: question.order || 1
      }
      
      await surveyService.addQuestion(surveyId, questionData)
    }
  }
}

const handleDraftSave = async () => {
  // Validate required fields for draft
  validateField('title', formData.value.title)
  validateField('description', formData.value.description || '')
  
  if (!isDraftFormValid.value) {
    return
  }
  
  try {
    isDraftLoading.value = true
    
    const formatDateForAPI = (dateString: string | null): string | null => {
      if (!dateString) return null
      return dateString.includes(':') && dateString.split(':').length === 2 
        ? `${dateString}:00` 
        : dateString
    }
    
    const draftData = {
      title: formData.value.title,
      description: formData.value.description,
      visibility: formData.value.visibility,
      is_active: formData.value.is_active,
      start_date: formatDateForAPI(formData.value.start_date),
      end_date: formatDateForAPI(formData.value.end_date),
      shared_with: formData.value.visibility === 'PRIVATE' ? formData.value.shared_with : undefined,
      questions: formData.value.questions.length > 0 ? formData.value.questions.map(q => ({
        text: q.text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required || false,
        order: q.order
      })) : undefined
    }
    
    // Create draft survey using the dedicated draft endpoint
    const response = await surveyService.createDraft(draftData)
    savedSurvey.value = response.data
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: isRTL.value ? 'تم حفظ المسودة' : 'Draft Saved',
      text: isRTL.value ? 'تم حفظ الاستطلاع كمسودة بنجاح. يمكنك تعديله لاحقاً.' : 'Survey saved as draft successfully. You can edit it later.',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    }).then(() => {
      // Close modal and emit save event
      emit('save', formData.value, savedSurvey.value!)
    })
    
  } catch (error: any) {
    const errorMessage = error.message || (isRTL.value ? 'فشل في حفظ المسودة' : 'Failed to save draft')
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ في الحفظ' : 'Save Error',
      text: `${isRTL.value ? 'خطأ' : 'Error'}: ${errorMessage}`,
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
  } finally {
    isDraftLoading.value = false
  }
}

const handleDraftUpdate = async () => {
  // Validate all fields for draft update
  validateField('title', formData.value.title)
  validateField('description', formData.value.description || '')
  
  if (!isFormValid.value) {
    return
  }
  
  try {
    isLoading.value = true
    
    const formatDateForAPI = (dateString: string | null): string | null => {
      if (!dateString) return null
      return dateString.includes(':') && dateString.split(':').length === 2 
        ? `${dateString}:00` 
        : dateString
    }
    
    const updateData = {
      title: formData.value.title,
      description: formData.value.description,
      visibility: formData.value.visibility,
      is_active: formData.value.is_active,
      start_date: formatDateForAPI(formData.value.start_date),
      end_date: formatDateForAPI(formData.value.end_date),
      shared_with: formData.value.visibility === 'PRIVATE' ? formData.value.shared_with : undefined,
      questions: formData.value.questions.length > 0 ? formData.value.questions.map(q => ({
        text: q.text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required || false,
        order: q.order
      })) : undefined
    }
    
    // Update existing draft survey
    const response = await surveyService.updateSurvey(props.survey!.id, updateData)
    savedSurvey.value = response.data
    
    // Update questions if any changes were made
    if (formData.value.questions.length > 0 && savedSurvey.value) {
      await updateSurveyQuestions(savedSurvey.value.id)
    }
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: isRTL.value ? 'تم تحديث المسودة' : 'Draft Updated',
      text: isRTL.value ? 'تم تحديث مسودة الاستطلاع بنجاح.' : 'Survey draft updated successfully.',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    }).then(() => {
      // Close modal and emit save event
      emit('save', formData.value, savedSurvey.value!)
    })
    
  } catch (error: any) {
    const errorMessage = error.message || (isRTL.value ? 'فشل في تحديث المسودة' : 'Failed to update draft')
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ في التحديث' : 'Update Error',
      text: `${isRTL.value ? 'خطأ' : 'Error'}: ${errorMessage}`,
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  // This method now handles final submission only (not drafts)
  // Validate all fields
  validateField('title', formData.value.title)
  validateField('description', formData.value.description || '')
  
  if (!isFormValid.value) {
    return
  }
  
  try {
    isSubmitLoading.value = true
    isTimeoutError.value = false
    
    // Create a timeout promise for 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })
    
    const formatDateForAPI = (dateString: string | null): string | null => {
      if (!dateString) return null
      return dateString.includes(':') && dateString.split(':').length === 2 
        ? `${dateString}:00` 
        : dateString
    }
    
    const submitData = {
      title: formData.value.title,
      description: formData.value.description,
      visibility: formData.value.visibility,
      is_active: formData.value.is_active,
      start_date: formatDateForAPI(formData.value.start_date),
      end_date: formatDateForAPI(formData.value.end_date),
      shared_with: formData.value.visibility === 'PRIVATE' ? formData.value.shared_with : undefined,
      questions: formData.value.questions.length > 0 ? formData.value.questions.map(q => ({
        text: q.text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required || false,
        order: q.order
      })) : undefined
    }

    // First create the survey as draft
    const draftResponse = await Promise.race([
      surveyService.createDraft(submitData),
      timeoutPromise
    ]) as any
    
    // Then submit the draft to make it final
    const submitResponse = await Promise.race([
      surveyService.submitSurvey(draftResponse.data.id),
      timeoutPromise
    ]) as any
    
    savedSurvey.value = submitResponse.data
    
    // Show the access modal for final configuration
    showAccessModal.value = true
      
  } catch (error: any) {
    // Check if it's a timeout error
    if (error.message === 'TIMEOUT') {
      isTimeoutError.value = true
      Swal.fire({
        icon: 'error',
        title: 'انتهت مهلة الاتصال',
        text: 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
        confirmButtonText: 'موافق'
      })
      return
    }
    
    // Show more specific error messages
    const errorMessage = error.message || 'فشل في إرسال الاستطلاع'
    Swal.fire({
      icon: 'error',
      title: 'خطأ في الإرسال',
      text: `خطأ: ${errorMessage}`,
      confirmButtonText: 'موافق'
    })
  } finally {
    isSubmitLoading.value = false
  }
}

const handleQuestionSave = (questionData: QuestionCreateRequest) => {
  if (editingQuestionIndex.value !== null) {
    // Update existing question
    const updatedQuestion = {
      ...questionData,
      id: formData.value.questions[editingQuestionIndex.value].id, // Preserve existing ID
      order: editingQuestionIndex.value + 1
    }
    formData.value.questions[editingQuestionIndex.value] = updatedQuestion
  } else {
    // Add new question
    const newQuestion = {
      ...questionData,
      id: Date.now(), // Temporary ID for UI
      order: formData.value.questions.length + 1
    }
    formData.value.questions.push(newQuestion)
  }
  
  // Reset editing state
  editingQuestionIndex.value = null
  editingQuestionData.value = null
  showQuestionModal.value = false
}

const handleQuestionCancel = () => {
  editingQuestionIndex.value = null
  editingQuestionData.value = null
  showQuestionModal.value = false
}

const editQuestion = (index: number) => {
  editingQuestionIndex.value = index
  editingQuestionData.value = { ...formData.value.questions[index] }
  showQuestionModal.value = true
}

const deleteQuestion = async (index: number) => {
  const questionText = formData.value.questions[index].text
  const isArabic = store.currentLanguage === 'ar'
  
  const result = await Swal.fire({
    icon: 'warning',
    title: isArabic ? 'تأكيد الحذف' : 'Confirm Deletion',
    text: isArabic 
      ? `هل أنت متأكد من حذف السؤال: "${questionText}"؟`
      : `Are you sure you want to delete the question: "${questionText}"?`,
    showCancelButton: true,
    confirmButtonText: isArabic ? 'نعم، احذف' : 'Yes, Delete',
    cancelButtonText: isArabic ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })
  
  if (result.isConfirmed) {
    formData.value.questions.splice(index, 1)
    
    // Update the order of remaining questions
    formData.value.questions.forEach((question, newIndex) => {
      question.order = newIndex + 1
    })
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: isArabic ? 'تم الحذف' : 'Deleted',
      text: isArabic ? 'تم حذف السؤال بنجاح' : 'Question deleted successfully',
      confirmButtonText: isArabic ? 'موافق' : 'OK'
    })
  }
}

const getQuestionTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'text': 'fas fa-font',
    'textarea': 'fas fa-align-left',
    'single_choice': 'fas fa-dot-circle',
    'multiple_choice': 'fas fa-check-square',
    'rating': 'fas fa-star',
    'yes_no': 'fas fa-toggle-on',
    'number': 'fas fa-hashtag',
    'date': 'fas fa-calendar-alt',
    'email': 'fas fa-envelope',
    'url': 'fas fa-link'
  }
  return iconMap[type] || 'fas fa-question'
}

const getQuestionTypeLabel = (type: string) => {
  const isArabic = store.currentLanguage === 'ar'
  
  const labelMap: Record<string, { en: string; ar: string }> = {
    'text': { en: 'Short Text', ar: 'نص قصير' },
    'textarea': { en: 'Long Text', ar: 'نص طويل' },
    'single_choice': { en: 'Single Choice', ar: 'اختيار واحد' },
    'multiple_choice': { en: 'Multiple Choice', ar: 'اختيار متعدد' },
    'rating': { en: 'Rating', ar: 'تقييم' },
    'yes_no': { en: 'Yes/No', ar: 'نعم/لا' },
    'number': { en: 'Number', ar: 'رقم' },
    'date': { en: 'Date', ar: 'تاريخ' },
    'email': { en: 'Email', ar: 'بريد إلكتروني' },
    'url': { en: 'URL', ar: 'رابط' }
  }
  
  const typeInfo = labelMap[type]
  if (typeInfo) {
    return isArabic ? typeInfo.ar : typeInfo.en
  }
  return type
}

const openAddQuestionModal = () => {
  // Reset editing state for new question
  editingQuestionIndex.value = null
  editingQuestionData.value = null
  showQuestionModal.value = true
}

const handleAccessModalSave = (_accessData: any) => {
  // Access settings are already saved by the SurveyAccessModal itself
  // Close the modal and emit save event with existing survey to signal completion
  showAccessModal.value = false
  if (savedSurvey.value) {
    emit('save', formData.value, savedSurvey.value)
  }
}

const handleAccessModalCancel = () => {
  // Close the modal and emit save event with existing survey to signal completion
  showAccessModal.value = false
  if (savedSurvey.value) {
    emit('save', formData.value, savedSurvey.value)
  }
}
</script>

<style module src="./SurveyModal.module.css">
/* CSS Module styles are imported from SurveyModal.module.css */
</style>
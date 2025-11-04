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
          <i class="fas fa-question-circle" :class="$style.modalIcon"></i>
          {{ isEditing ? t('survey.questions.editQuestion') : t('survey.questions.addQuestion') }}
        </h2>
        <button :class="$style.closeButton" @click="$emit('cancel')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.modalBody">
        <form @submit.prevent="handleSubmit">
          <!-- Question Text -->
          <div :class="$style.formGroup">
            <label :class="[$style.formLabel, $style.required]">{{ t('survey.questions.questionText') }}</label>
            <textarea
              :class="[$style.formInput, $style.formTextarea]"
              :placeholder="t('survey.questions.questionTextPlaceholder')"
              v-model="formData.text"
              required
            ></textarea>
            <div v-if="errors.text" :class="$style.errorMessage">
              <i class="fas fa-exclamation-triangle"></i>
               السؤال مطلوب
            </div>
          </div>

          <!-- Question Type -->
          <div :class="$style.formGroup">
            <label :class="[$style.formLabel, $style.required]">{{ t('survey.questions.questionType') }}</label>
            <div :class="$style.questionTypeGrid">
              <div 
                v-for="type in questionTypes" 
                :key="type.value"
                :class="[$style.questionTypeOption, { [$style.selected]: formData.question_type === type.value }]"
                @click="selectQuestionType(type.value)"
              >
                <i :class="[type.icon, $style.typeIcon]"></i>
                <div :class="$style.typeName">{{ type.name }}</div>
              </div>
            </div>
          </div>

          <!-- Options for Choice Questions -->
          <div v-if="needsOptions" :class="$style.formGroup">
            <div :class="$style.optionsSection">
              <div :class="$style.optionsHeader">
                <h4 :class="$style.optionsTitle">{{ t('survey.questions.options') }}</h4>
                <button
                  type="button"
                  :class="$style.addOptionButton"
                  @click="addOption"
                >
                  <i class="fas fa-plus"></i>
                  {{ t('survey.questions.addOption') }}
                </button>
              </div>
              
              <div :class="$style.optionsList" v-if="options.length > 0">
                <div 
                  v-for="(_option, index) in options" 
                  :key="index"
                  :class="$style.optionItem"
                >
                  <i class="fas fa-grip-vertical" :class="$style.optionDragHandle"></i>
                  <input
                    type="text"
                    :class="$style.optionInput"
                    :placeholder="t('survey.questions.optionPlaceholder')"
                    v-model="options[index]"
                    @input="validateOptions"
                  />
                  <button
                    type="button"
                    :class="$style.removeOptionButton"
                    @click="removeOption(index)"
                    :disabled="options.length <= 2"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <div v-if="errors.options" :class="$style.errorMessage">
                <i class="fas fa-exclamation-triangle"></i>
                {{ errors.options }}
              </div>
              
              <p :class="$style.helpText">{{ t('survey.questions.dragToReorder') }}</p>
            </div>
          </div>

          <!-- Rating Scale Settings -->
          <div v-if="formData.question_type === 'rating'" :class="$style.formGroup">
            <div :class="$style.ratingSettings">
              <h4 :class="$style.optionsTitle">{{ t('survey.questions.ratingSettings') }}</h4>
              <div :class="$style.ratingGrid">
                <div>
                  <label :class="$style.formLabel">{{ t('survey.questions.minValue') }}</label>
                  <input
                    type="number"
                    :class="$style.formInput"
                    v-model.number="ratingSettings.min"
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <label :class="$style.formLabel">{{ t('survey.questions.maxValue') }}</label>
                  <input
                    type="number"
                    :class="$style.formInput"
                    v-model.number="ratingSettings.max"
                    min="2"
                    max="10"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Question Settings -->
          <div :class="$style.settingsSection">
            <div :class="$style.settingsGrid">
              <div :class="$style.settingItem">
                <div :class="$style.settingContent">
                  <h4 :class="$style.settingTitle">{{ t('survey.questions.isRequired') }}</h4>
                  <p :class="$style.settingDescription">{{ t('survey.questions.isRequiredDescription') }}</p>
                </div>
                <button
                  type="button"
                  :class="[$style.toggle, { [$style.active]: formData.is_required }]"
                  @click="formData.is_required = !formData.is_required"
                ></button>
              </div>
            </div>
          </div>

          <!-- Question Preview -->
          <div :class="$style.previewSection">
            <h4 :class="$style.previewTitle">
              <i class="fas fa-eye" :class="$style.previewIcon"></i>
              {{ t('survey.questions.preview') }}
            </h4>
            
            <div :class="$style.previewQuestion">
              {{ formData.text || t('survey.questions.questionTextPlaceholder') }}
              <span v-if="formData.is_required" style="color: var(--error-color)"> *</span>
            </div>
            
            <!-- Preview based on question type -->
            <div v-if="formData.question_type === 'text'">
              <input type="text" :class="$style.formInput" :placeholder="t('survey.questions.shortAnswerPlaceholder')" disabled />
            </div>
            
            <div v-else-if="formData.question_type === 'textarea'">
              <textarea :class="$style.formInput" :placeholder="t('survey.questions.longAnswerPlaceholder')" rows="3" disabled></textarea>
            </div>
            
            <div v-else-if="formData.question_type === 'single_choice' && options.length > 0" :class="$style.previewOptions">
              <div v-for="(option, index) in options" :key="index" :class="$style.previewOption">
                <input type="radio" :name="`preview_radio`" disabled />
                <span>{{ option || `${t('survey.questions.optionDefaultText')} ${index + 1}` }}</span>
              </div>
            </div>
            
            <div v-else-if="formData.question_type === 'multiple_choice' && options.length > 0" :class="$style.previewOptions">
              <div v-for="(option, index) in options" :key="index" :class="$style.previewOption">
                <input type="checkbox" disabled />
                <span>{{ option || `${t('survey.questions.optionDefaultText')} ${index + 1}` }}</span>
              </div>
            </div>
            
            <div v-else-if="formData.question_type === 'rating'">
              <div style="display: flex; gap: 8px; align-items: center;">
                <span>{{ ratingSettings.min }}</span>
                <div style="display: flex; gap: 4px;">
                  <div 
                    v-for="n in (ratingSettings.max - ratingSettings.min + 1)" 
                    :key="n"
                    style="width: 24px; height: 24px; border: 2px solid #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;"
                  >
                    {{ ratingSettings.min + n - 1 }}
                  </div>
                </div>
                <span>{{ ratingSettings.max }}</span>
              </div>
            </div>
            
            <div v-else-if="formData.question_type === 'yes_no'" :class="$style.previewOptions">
              <div :class="$style.previewOption">
                <input type="radio" name="preview_yesno" disabled />
                <span>{{ t('survey.questions.yes') }}</span>
              </div>
              <div :class="$style.previewOption">
                <input type="radio" name="preview_yesno" disabled />
                <span>{{ t('survey.questions.no') }}</span>
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
        
        <button
          type="button"
          :class="[$style.footerButton, $style.saveButton, { [$style.loading]: isLoading }]"
          @click="handleSubmit"
          :disabled="isLoading || !isFormValid"
        >
          <div v-if="isLoading" :class="$style.loadingSpinner"></div>
          <i v-else class="fas fa-save"></i>
          {{ t('survey.questions.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import type { SurveyQuestion, QuestionCreateRequest, QuestionType } from '../../types/survey.types'

// Props
interface Props {
  question?: SurveyQuestion | null
}

const props = withDefaults(defineProps<Props>(), {
  question: null
})

// Emits
const emit = defineEmits<{
  save: [data: QuestionCreateRequest]
  cancel: []
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)
const isEditing = computed(() => !!props.question)

// State
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const options = ref<string[]>(['', ''])
const ratingSettings = ref({
  min: 1,
  max: 5
})

const formData = ref<QuestionCreateRequest>({
  text: '',
  question_type: 'text' as QuestionType,
  is_required: false,
  order: 1
})

// Question type options
const questionTypes = computed(() => [
  {
    value: 'text' as QuestionType,
    name: t.value('survey.questionTypes.text'),
    icon: 'fas fa-font'
  },
  {
    value: 'textarea' as QuestionType,
    name: t.value('survey.questionTypes.textarea'),
    icon: 'fas fa-align-left'
  },
  {
    value: 'single_choice' as QuestionType,
    name: t.value('survey.questionTypes.single_choice'),
    icon: 'fas fa-dot-circle'
  },
  {
    value: 'multiple_choice' as QuestionType,
    name: t.value('survey.questionTypes.multiple_choice'),
    icon: 'fas fa-check-square'
  },
  {
    value: 'rating' as QuestionType,
    name: t.value('survey.questionTypes.rating'),
    icon: 'fas fa-star'
  },
  {
    value: 'yes_no' as QuestionType,
    name: t.value('survey.questionTypes.yes_no'),
    icon: 'fas fa-question'
  }
])

// Computed
const needsOptions = computed(() => 
  ['single_choice', 'multiple_choice'].includes(formData.value.question_type)
)

const isFormValid = computed(() => {
  if (!formData.value.text.trim()) return false
  if (needsOptions.value && options.value.filter(opt => opt.trim()).length < 2) return false
  if (formData.value.question_type === 'rating' && ratingSettings.value.max <= ratingSettings.value.min) return false
  return Object.keys(errors.value).length === 0
})

// Watch for question prop changes
watch(() => props.question, (newQuestion) => {
  if (newQuestion) {
    formData.value = {
      text: newQuestion.text,
      question_type: newQuestion.question_type,
      is_required: newQuestion.is_required,
      order: newQuestion.order
    }
    
    // Parse options if they exist
    if (newQuestion.options) {
      try {
        options.value = JSON.parse(newQuestion.options)
      } catch {
        options.value = ['', '']
      }
    }
  }
}, { immediate: true })

// Watch form changes for validation
watch(() => formData.value.text, (newText) => {
  validateField('text', newText)
})

watch(() => formData.value.question_type, (_newType) => {
  // Reset options when changing question type
  if (!needsOptions.value) {
    options.value = ['', '']
  } else if (options.value.length < 2) {
    options.value = ['', '']
  }
  
  // Clear type-specific errors
  delete errors.value.options
})

// Methods
const validateField = (field: string, value: string) => {
  const newErrors = { ...errors.value }
  delete newErrors[field]
  
  if (field === 'text') {
    const fieldErrors = surveyService.validateQuestionData({
      text: value,
      question_type: formData.value.question_type
    })
    
    fieldErrors.forEach(error => {
      if (error.toLowerCase().includes('text')) {
        newErrors[field] = error
      }
    })
  }
  
  errors.value = newErrors
}

const validateOptions = () => {
  const newErrors = { ...errors.value }
  delete newErrors.options
  
  if (needsOptions.value) {
    const validOptions = options.value.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      newErrors.options = t.value('survey.errors.optionsMinimum')
    }
  }
  
  errors.value = newErrors
}

const selectQuestionType = (type: QuestionType) => {
  formData.value.question_type = type
}

const addOption = () => {
  options.value.push('')
}

const removeOption = (index: number) => {
  if (options.value.length > 2) {
    options.value.splice(index, 1)
    validateOptions()
  }
}

const handleSubmit = async () => {
  // Validate all fields
  validateField('text', formData.value.text)
  if (needsOptions.value) {
    validateOptions()
  }
  
  if (!isFormValid.value) {
    return
  }
  
  try {
    isLoading.value = true
    
    const submitData: QuestionCreateRequest = {
      text: formData.value.text,
      question_type: formData.value.question_type,
      is_required: formData.value.is_required,
      order: formData.value.order
    }
    
    // Add options for choice questions
    if (needsOptions.value) {
      const validOptions = options.value.filter(opt => opt.trim())
      submitData.options = JSON.stringify(validOptions)
    }
    
    // Add rating settings
    if (formData.value.question_type === 'rating') {
      const ratingOptions = []
      for (let i = ratingSettings.value.min; i <= ratingSettings.value.max; i++) {
        ratingOptions.push(i.toString())
      }
      submitData.options = JSON.stringify(ratingOptions)
    }
    
    // Add yes/no options
    if (formData.value.question_type === 'yes_no') {
      submitData.options = JSON.stringify([t.value('survey.questions.yes'), t.value('survey.questions.no')])
    }
    
    emit('save', submitData)
  } catch (error) {
    // Logging removed for production
    // store.showNotification?.(t.value('survey.errors.questionAddFailed'), 'error')
    // Logging removed for production)
  } finally {
    isLoading.value = false
  }
}

</script>

<style module src="./QuestionModal.module.css">
/* CSS Module styles are imported from QuestionModal.module.css */
</style>

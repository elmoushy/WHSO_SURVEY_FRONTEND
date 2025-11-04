<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div 
        v-if="isVisible" 
        :class="styles.modalOverlay" 
        @click.self="$emit('close')"
        @keydown.esc="$emit('close')"
        tabindex="-1"
        :dir="isRTL ? 'rtl' : 'ltr'"
      >
        <div :class="styles.modalContainer">
          <div :class="[styles.modal, `theme-${currentTheme}`]">
            <!-- Modal Header -->
            <header :class="styles.modalHeader">
              <div :class="styles.modalTitle">
                <h2>
                  {{ modalMode === 'create' ? t('control.modal.create') || 'Create' : t('control.modal.edit') || 'Edit' }}
                  {{ t(`control.tabs.${modalType}`) || modalType }}
                </h2>
                <p :class="styles.modalSubtitle">
                  {{ getModalSubtitle() }}
                </p>
              </div>
              <button 
                type="button" 
                :class="styles.closeBtn" 
                @click="$emit('close')" 
                :aria-label="t('common.close') || 'Close'"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </header>

            <!-- Modal Body with Form -->
            <main :class="styles.modalBody">
              <form @submit.prevent="submitForm" :class="styles.form">
                <div :class="styles.formGrid">
                  <!-- Title Arabic -->
                  <div :class="styles.formGroup">
                    <label :class="styles.label">
                      {{ t('control.form.titleArabic') || 'Title (Arabic)' }}
                      <span :class="styles.required">*</span>
                    </label>
                    <input 
                      v-model="localFormData.title_arabic" 
                      type="text" 
                      :class="styles.input"
                      required
                      ref="firstInput"
                      :placeholder="t('control.form.titleArabicPlaceholder') || 'Enter Arabic title'"
                      :dir="'rtl'"
                    >
                  </div>

                  <!-- Title English -->
                  <div :class="styles.formGroup">
                    <label :class="styles.label">
                      {{ t('control.form.titleEnglish') || 'Title (English)' }}
                      <span :class="styles.required">*</span>
                    </label>
                    <input 
                      v-model="localFormData.title_english" 
                      type="text" 
                      :class="styles.input"
                      required
                      :placeholder="t('control.form.titleEnglishPlaceholder') || 'Enter English title'"
                      :dir="'ltr'"
                    >
                  </div>

                  <!-- Description -->
                  <div :class="[styles.formGroup, styles.fullWidth]">
                    <label :class="styles.label">
                      {{ t('control.form.description') || 'Description' }}
                      <span :class="styles.required">*</span>
                    </label>
                    <textarea 
                      v-model="localFormData.description"
                      :class="styles.textarea"
                      rows="4"
                      required
                      :placeholder="t('control.form.descriptionPlaceholder') || 'Enter description'"
                    ></textarea>
                  </div>

                  <!-- Priority is hidden and always set to 100 -->
                  <!-- Category is hidden and always set to general -->

                  <!-- Display Duration (Slider News Only) -->
                  <div v-if="modalType === 'slider'" :class="styles.formGroup">
                    <label :class="styles.label">
                      {{ t('control.form.displayDuration') || 'Display Duration' }}
                      <span :class="styles.range">(3-30 seconds)</span>
                    </label>
                    <div :class="styles.rangeContainer">
                      <input 
                        v-model.number="localFormData.display_duration" 
                        type="range"
                        :class="styles.range"
                        min="3" 
                        max="30"
                      >
                      <span :class="styles.rangeValue">{{ localFormData.display_duration }}s</span>
                    </div>
                  </div>

                  <!-- Date (Cards News) -->
                  <div v-if="modalType === 'cards'" :class="styles.formGroup">
                    <label :class="styles.label">
                      {{ t('control.form.date') || 'Date' }}
                    </label>
                    <input 
                      v-model="localFormData.date" 
                      type="date" 
                      :class="styles.input"
                    >
                  </div>

                  <!-- Achievement Date (Achievements) -->
                  <div v-if="modalType === 'achievements'" :class="styles.formGroup">
                    <label :class="styles.label">
                      {{ t('control.form.achievementDate') || 'Achievement Date' }}
                    </label>
                    <input 
                      v-model="localFormData.achievement_date" 
                      type="date" 
                      :class="styles.input"
                    >
                  </div>

                  <!-- Main Image Upload -->
                  <div :class="[styles.formGroup, styles.fullWidth]">
                    <label :class="styles.label">
                      {{ t('control.form.mainImage') || 'Main Image' }}
                    </label>
                    <div :class="styles.imageUpload">
                      <div 
                        v-if="!mainImagePreview" 
                        :class="styles.uploadArea"
                        @click="triggerImageUpload"
                        @drop.prevent="handleImageDrop"
                        @dragover.prevent
                        @dragenter.prevent
                      >
                        <div :class="styles.uploadContent">
                          <i class="bi bi-cloud-upload" :class="styles.uploadIcon"></i>
                          <p>{{ t('control.form.dragDropImage') || 'Drag & drop image or click to browse' }}</p>
                          <small>{{ t('control.form.supportedFormats') || 'Supported: JPG, PNG, GIF (Max: 5MB)' }}</small>
                        </div>
                      </div>
                      
                      <div v-else :class="styles.imagePreview">
                        <img 
                          :src="mainImagePreview" 
                          alt="Preview" 
                          :class="styles.previewImage"
                          @click="openFullscreenPreview"
                        >
                        <div :class="styles.imageActions">
                          <button 
                            type="button" 
                            :class="[styles.btn, styles.btnSecondary]"
                            @click="triggerImageUpload"
                          >
                            <i class="bi bi-pencil-square"></i>
                            {{ t('control.form.changeImage') || 'Change' }}
                          </button>
                          <button 
                            type="button" 
                            :class="[styles.btn, styles.btnDanger]"
                            @click="removeImage"
                          >
                            <i class="bi bi-trash"></i>
                            {{ t('control.form.removeImage') || 'Remove' }}
                          </button>
                        </div>
                      </div>
                      
                      <input 
                        ref="imageInput"
                        type="file"
                        accept="image/*"
                        :class="styles.hiddenInput"
                        @change="handleImageUpload"
                      >
                    </div>
                  </div>

                  <!-- Toggle Options - Hidden, always active -->
                  <!-- is_active is always set to true and hidden from UI -->
                </div>
              </form>
            </main>

            <!-- Modal Footer -->
            <footer :class="styles.modalFooter">
              <div :class="styles.footerActions">
                <button 
                  type="button" 
                  :class="[styles.btn, styles.btnSecondary]" 
                  @click="$emit('close')"
                >
                  <i class="bi bi-x-circle"></i>
                  {{ t('common.cancel') || 'Cancel' }}
                </button>
                <button 
                  type="submit"
                  :class="[styles.btn, styles.btnPrimary]" 
                  @click="submitForm"
                  :disabled="!isFormValid || loading"
                >
                  <span v-if="loading" :class="styles.spinner"></span>
                  <i v-else class="bi bi-check-circle"></i>
                  {{ modalMode === 'create' ? 
                    (t('control.form.create') || 'Create') : 
                    (t('control.form.update') || 'Update') 
                  }}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Fullscreen Image Preview -->
  <Teleport to="body">
    <Transition name="fade" appear>
      <div 
        v-if="showFullscreenPreview"
        :class="styles.fullscreenOverlay"
        @click="closeFullscreenPreview"
        @keydown.esc="closeFullscreenPreview"
        tabindex="-1"
      >
        <img 
          :src="mainImagePreview || ''" 
          alt="Fullscreen Preview" 
          :class="styles.fullscreenImage"
          @click.stop
        >
        <button 
          type="button" 
          :class="styles.fullscreenClose"
          @click="closeFullscreenPreview"
          :aria-label="t('common.close') || 'Close'"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import styles from './ControlModal.module.css'

// Props
interface Props {
  isVisible: boolean
  modalMode: 'create' | 'edit'
  modalType: 'slider' | 'cards' | 'achievements'
  formData: {
    title_arabic: string
    title_english: string
    description: string
    category: string
    priority: number
    display_duration: number
    achievement_date: string
    date: string
    is_featured: boolean
    is_active: boolean
  }
  mainImagePreview: string | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  close: []
  submit: [formData: Props['formData'], imageFile: File | null]
  imageUpload: [file: File]
  imageRemove: []
}>()

// Store
const appStore = useAppStore()

// Refs
const firstInput = ref<HTMLInputElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const currentImageFile = ref<File | null>(null)

// Computed
const currentTheme = computed(() => appStore.currentTheme)
const isRTL = computed(() => appStore.isRTL)
const t = computed(() => appStore.t)

// Local form data with enforced defaults
const localFormData = ref({ 
  ...props.formData,
  category: 'general', // Always set to general
  priority: 100, // Always set to 100
  is_featured: false, // Always set to false (hidden)
  is_active: true // Always set to true (hidden)
})

// Fullscreen preview state
const showFullscreenPreview = ref(false)

// Watch for props changes
watch(() => props.formData, (newData) => {
  localFormData.value = { 
    ...newData,
    category: 'general', // Enforce general category
    priority: 100, // Enforce priority 100
    is_featured: false, // Enforce featured false
    is_active: true // Enforce active true
  }
}, { deep: true })

// Ensure defaults are always applied
watch(localFormData, (newData) => {
  if (newData.category !== 'general') {
    newData.category = 'general'
  }
  if (newData.priority !== 100) {
    newData.priority = 100
  }
  if (newData.is_featured !== false) {
    newData.is_featured = false
  }
  if (newData.is_active !== true) {
    newData.is_active = true
  }
}, { deep: true })

watch(() => props.isVisible, async (isVisible) => {
  if (isVisible) {
    await nextTick()
    firstInput.value?.focus()
  } else {
    // Close fullscreen preview when modal closes
    showFullscreenPreview.value = false
    // Clear image file when modal closes
    currentImageFile.value = null
  }
})

// Computed properties
const isFormValid = computed(() => {
  return localFormData.value.title_arabic.trim() &&
         localFormData.value.title_english.trim() &&
         localFormData.value.description.trim()
})

// Methods
const getModalSubtitle = () => {
  const action = props.modalMode === 'create' ? 'Create new' : 'Edit existing'
  const type = props.modalType === 'slider' ? 'slider news' : 
               props.modalType === 'cards' ? 'cards news' : 'achievement'
  return `${action} ${type} item`
}

const submitForm = () => {
  if (!isFormValid.value || props.loading) return
  
  // Ensure is_active is always true before submitting
  localFormData.value.is_active = true
  
  emit('submit', localFormData.value, currentImageFile.value)
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    currentImageFile.value = file
    emit('imageUpload', file)
  }
}

const handleImageDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      currentImageFile.value = file
      emit('imageUpload', file)
    }
  }
}

const removeImage = () => {
  currentImageFile.value = null
  emit('imageRemove')
}

const openFullscreenPreview = () => {
  if (props.mainImagePreview) {
    showFullscreenPreview.value = true
  }
}

const closeFullscreenPreview = () => {
  showFullscreenPreview.value = false
}

// Focus management
onMounted(() => {
  if (props.isVisible) {
    nextTick(() => {
      firstInput.value?.focus()
    })
  }
})
</script>

<style scoped>
/* Transition styles */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal {
  transform: translate(-50%, -50%) scale(0.8) rotateX(10deg);
  filter: blur(10px);
}

.modal-leave-to .modal {
  transform: translate(-50%, -50%) scale(0.9) rotateX(-5deg);
  filter: blur(5px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
}

.modal-enter-to .modal,
.modal-leave-from .modal {
  transform: translate(-50%, -50%) scale(1) rotateX(0deg);
  filter: blur(0px);
}
</style>

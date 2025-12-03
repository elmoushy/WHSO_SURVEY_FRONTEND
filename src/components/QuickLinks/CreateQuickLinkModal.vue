<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { createQuickLink, uploadQuickLinkIcon } from '../../services/quickLinksService'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// Store for theme
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// Form state
const form = ref({
  name: '',
  redirect_url: ''
})

const iconFile = ref<File | null>(null)
const iconPreview = ref<string | null>(null)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const isDragging = ref(false)

// Computed
const isFormValid = computed(() => 
  form.value.name.trim().length > 0 && 
  form.value.redirect_url.trim().length > 0 &&
  isValidUrl(form.value.redirect_url)
)

const nameProgress = computed(() => (form.value.name.length / 100) * 100)

// Validate URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Handle icon selection
const handleIconSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    processFile(file)
  }
}

// Process file (shared between click and drag)
const processFile = (file: File) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = isRTL.value 
      ? 'يرجى اختيار ملف صورة صالح' 
      : 'Please select a valid image file'
    return
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.value = isRTL.value 
      ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' 
      : 'Image size must be less than 5MB'
    return
  }
  
  iconFile.value = file
  error.value = null
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    iconPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Drag and drop handlers
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

// Remove icon
const removeIcon = () => {
  iconFile.value = null
  iconPreview.value = null
}

// Submit form
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  try {
    isSubmitting.value = true
    error.value = null
    
    // Step 1: Create quick link
    const response = await createQuickLink({
      name: form.value.name,
      redirect_url: form.value.redirect_url,
      is_active: true
    })
    
    // Step 2: Extract the ID from response
    if (!response.data?.id) {
      throw new Error(isRTL.value ? 'فشل في الحصول على معرف الرابط' : 'Failed to get link ID')
    }
    
    const linkId = response.data.id
    
    // Step 3: Upload icon if provided
    if (iconFile.value) {
      await uploadQuickLinkIcon(linkId, iconFile.value)
    }
    
    // Success - emit and close
    emit('success')
    resetForm()
    emit('close')
    
  } catch (err: any) {
    console.error('Failed to create quick link:', err)
    error.value = err.response?.data?.detail || (isRTL.value 
      ? 'فشل إنشاء الرابط. يرجى المحاولة مرة أخرى.' 
      : 'Failed to create link. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    redirect_url: ''
  }
  iconFile.value = null
  iconPreview.value = null
  error.value = null
}

// Close modal
const handleClose = () => {
  if (!isSubmitting.value) {
    resetForm()
    emit('close')
  }
}

// Watch show prop to reset form when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" :class="$style.overlay" :data-theme="currentTheme" @click.self="handleClose">
        <div :class="$style.modal">
          <!-- Header with gradient accent -->
          <div :class="$style.header">
            <div :class="$style.headerAccent"></div>
            <div :class="$style.headerContent">
              <div :class="$style.headerIcon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <div :class="$style.headerText">
                <h2 :class="$style.title">
                  {{ isRTL ? 'إضافة رابط سريع' : 'Add Quick Link' }}
                </h2>
                <p :class="$style.subtitle">
                  {{ isRTL ? 'أضف رابط تطبيق خارجي جديد' : 'Add a new external app link' }}
                </p>
              </div>
            </div>
            <button 
              :class="$style.closeButton" 
              @click="handleClose"
              :disabled="isSubmitting"
              :aria-label="isRTL ? 'إغلاق' : 'Close'"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <!-- Error Message -->
            <Transition name="error">
              <div v-if="error" :class="$style.errorBanner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ error }}</span>
                <button @click="error = null" :class="$style.errorClose">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </Transition>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" :class="$style.form">
              <!-- Name -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ isRTL ? 'اسم التطبيق' : 'App Name' }}
                  <span :class="$style.required">*</span>
                </label>
                <div :class="$style.inputWrapper">
                  <input
                    v-model="form.name"
                    type="text"
                    :class="$style.input"
                    :placeholder="isRTL ? 'مثال: Outlook' : 'e.g., Outlook'"
                    maxlength="100"
                    :disabled="isSubmitting"
                  />
                  <div :class="$style.progressBar">
                    <div 
                      :class="$style.progressFill" 
                      :style="{ width: `${nameProgress}%` }"
                    ></div>
                  </div>
                </div>
                <span :class="$style.hint">{{ form.name.length }}/100</span>
              </div>

              <!-- URL -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  {{ isRTL ? 'رابط التطبيق' : 'App URL' }}
                  <span :class="$style.required">*</span>
                </label>
                <input
                  v-model="form.redirect_url"
                  type="url"
                  :class="$style.input"
                  :placeholder="isRTL ? 'https://example.com' : 'https://example.com'"
                  :disabled="isSubmitting"
                />
                <span v-if="form.redirect_url && !isValidUrl(form.redirect_url)" :class="$style.errorHint">
                  {{ isRTL ? 'يرجى إدخال رابط صالح' : 'Please enter a valid URL' }}
                </span>
              </div>

              <!-- Icon Upload -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {{ isRTL ? 'أيقونة التطبيق' : 'App Icon' }}
                  <span :class="$style.optional">({{ isRTL ? 'اختياري' : 'optional' }})</span>
                </label>

                <!-- Upload Area or Preview -->
                <div v-if="!iconPreview" 
                  :class="[$style.uploadArea, { [$style.dragging]: isDragging }]"
                  @dragover="handleDragOver"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop"
                >
                  <input
                    type="file"
                    accept="image/*"
                    :class="$style.fileInput"
                    id="iconUpload"
                    @change="handleIconSelect"
                    :disabled="isSubmitting"
                  />
                  <label for="iconUpload" :class="$style.uploadLabel">
                    <div :class="$style.uploadIconWrapper">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div :class="$style.uploadText">
                      <strong>{{ isRTL ? 'اسحب الصورة هنا' : 'Drag image here' }}</strong>
                      <span>{{ isRTL ? 'أو انقر للاختيار' : 'or click to browse' }}</span>
                    </div>
                    <span :class="$style.uploadHint">PNG, JPG, SVG ({{ isRTL ? 'حتى 5 ميجا' : 'up to 5MB' }})</span>
                  </label>
                </div>

                <!-- Image Preview -->
                <div v-else :class="$style.imagePreview">
                  <img :src="iconPreview" :alt="isRTL ? 'معاينة' : 'Preview'" />
                  <div :class="$style.imageOverlay">
                    <button 
                      type="button" 
                      @click="removeIcon" 
                      :class="$style.removeImage"
                      :disabled="isSubmitting"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                  <span :class="$style.imageBadge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {{ isRTL ? 'جاهز' : 'Ready' }}
                  </span>
                </div>
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div :class="$style.footer">
            <button 
              type="button"
              :class="$style.cancelButton" 
              @click="handleClose"
              :disabled="isSubmitting"
            >
              {{ isRTL ? 'إلغاء' : 'Cancel' }}
            </button>
            <button 
              :class="$style.submitButton"
              :disabled="!isFormValid || isSubmitting"
              @click="handleSubmit"
            >
              <span v-if="isSubmitting" :class="$style.spinner"></span>
              {{ isSubmitting 
                ? (isRTL ? 'جاري الإنشاء...' : 'Creating...') 
                : (isRTL ? 'إنشاء الرابط' : 'Create Link') 
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style module>
/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(8px);
}

/* Modal */
.modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.header {
  position: relative;
  padding: 28px 28px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.headerAccent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #A17D23, #C4A048, #A17D23);
  background-size: 200% 100%;
  animation: shimmerAccent 3s ease-in-out infinite;
}

@keyframes shimmerAccent {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.headerContent {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.headerIcon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #A17D23 0%, #C4A048 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.3);
}

.headerText {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.closeButton {
  width: 40px;
  height: 40px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.closeButton:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: rotate(90deg);
}

.closeButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Content */
.content {
  padding: 0 28px 28px;
  overflow-y: auto;
  flex: 1;
}

/* Error Banner */
.errorBanner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 14px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 14px;
  animation: errorShake 0.5s ease;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.errorClose {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s;
}

.errorClose:hover {
  background: rgba(220, 38, 38, 0.1);
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.label svg {
  color: #A17D23;
}

.required {
  color: #dc2626;
  font-weight: 700;
}

.optional {
  color: #9ca3af;
  font-weight: 400;
  font-size: 13px;
}

.inputWrapper {
  position: relative;
}

.input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  color: #1f2937;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.input::placeholder {
  color: #9ca3af;
}

.input:hover {
  border-color: #d1d5db;
  background: #fafafa;
}

.input:focus {
  outline: none;
  border-color: #A17D23;
  box-shadow: 0 0 0 4px rgba(161, 125, 35, 0.1);
  background: white;
}

.progressBar {
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #A17D23, #C4A048);
  transition: width 0.3s ease;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  text-align: left;
}

.errorHint {
  font-size: 12px;
  color: #dc2626;
}

/* Image Upload */
.uploadArea {
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.uploadArea::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.02), rgba(196, 160, 72, 0.02));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.uploadArea:hover,
.uploadArea.dragging {
  border-color: #A17D23;
  background: rgba(161, 125, 35, 0.02);
}

.uploadArea:hover::before,
.uploadArea.dragging::before {
  opacity: 1;
}

.uploadArea.dragging {
  border-style: solid;
  transform: scale(1.01);
}

.fileInput {
  display: none;
}

.uploadLabel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.uploadIconWrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.1), rgba(196, 160, 72, 0.1));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A17D23;
  transition: all 0.3s ease;
}

.uploadArea:hover .uploadIconWrapper {
  transform: scale(1.1);
}

.uploadText {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.uploadText strong {
  color: #1f2937;
}

.uploadText span {
  font-size: 13px;
  color: #6b7280;
}

.uploadHint {
  font-size: 12px;
  color: #9ca3af;
}

/* Image Preview */
.imagePreview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  aspect-ratio: 1;
  max-width: 160px;
  margin: 0 auto;
}

.imagePreview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f9fafb;
}

.imageOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.imagePreview:hover .imageOverlay {
  opacity: 1;
}

.removeImage {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 12px;
  color: #dc2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.removeImage:hover {
  background: #dc2626;
  color: white;
}

.imageBadge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(34, 197, 94, 0.95);
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Footer */
.footer {
  padding: 20px 28px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fafafa;
}

.cancelButton,
.submitButton {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cancelButton {
  background: white;
  border: 2px solid #e5e7eb;
  color: #6b7280;
}

.cancelButton:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.cancelButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submitButton {
  background: linear-gradient(135deg, #A17D23, #B78A41);
  border: none;
  color: white;
}

.submitButton:hover:not(:disabled) {
  background: linear-gradient(135deg, #B78A41, #CEA55B);
  box-shadow: 0 4px 16px rgba(161, 125, 35, 0.3);
}

.submitButton:active:not(:disabled) {
  transform: scale(0.98);
}

.submitButton:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ==================== DARK MODE ==================== */
.overlay[data-theme="night"] .modal {
  background: #1e1e1e;
  border: 1px solid #333;
}

.overlay[data-theme="night"] .title {
  color: #f3f4f6;
}

.overlay[data-theme="night"] .subtitle {
  color: #9ca3af;
}

.overlay[data-theme="night"] .closeButton {
  background: #2d2d2d;
  color: #9ca3af;
}

.overlay[data-theme="night"] .closeButton:hover {
  background: #3d2020;
  color: #ef4444;
}

.overlay[data-theme="night"] .label {
  color: #e5e7eb;
}

.overlay[data-theme="night"] .input {
  background: #2d2d2d;
  border-color: #404040;
  color: #f3f4f6;
}

.overlay[data-theme="night"] .input::placeholder {
  color: #6b7280;
}

.overlay[data-theme="night"] .input:hover {
  border-color: #525252;
  background: #333;
}

.overlay[data-theme="night"] .input:focus {
  border-color: #A17D23;
  box-shadow: 0 0 0 4px rgba(161, 125, 35, 0.2);
  background: #333;
}

.overlay[data-theme="night"] .progressBar {
  background: #404040;
}

.overlay[data-theme="night"] .hint {
  color: #6b7280;
}

.overlay[data-theme="night"] .uploadArea {
  border-color: #404040;
  background: #2d2d2d;
}

.overlay[data-theme="night"] .uploadArea:hover,
.overlay[data-theme="night"] .uploadArea.dragging {
  border-color: #A17D23;
  background: rgba(161, 125, 35, 0.1);
}

.overlay[data-theme="night"] .uploadText strong {
  color: #f3f4f6;
}

.overlay[data-theme="night"] .uploadText span {
  color: #9ca3af;
}

.overlay[data-theme="night"] .uploadHint {
  color: #6b7280;
}

.overlay[data-theme="night"] .imagePreview {
  border-color: #404040;
}

.overlay[data-theme="night"] .imagePreview img {
  background: #2d2d2d;
}

.overlay[data-theme="night"] .footer {
  background: #1a1a1a;
  border-top-color: #333;
}

.overlay[data-theme="night"] .cancelButton {
  background: #2d2d2d;
  border-color: #404040;
  color: #9ca3af;
}

.overlay[data-theme="night"] .cancelButton:hover:not(:disabled) {
  background: #333;
  border-color: #525252;
  color: #e5e7eb;
}

.overlay[data-theme="night"] .headerIcon {
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.4);
}

.overlay[data-theme="night"] .uploadIconWrapper {
  background: rgba(161, 125, 35, 0.2);
}

.overlay[data-theme="night"] .errorBanner {
  background: linear-gradient(135deg, #2d1f1f 0%, #3d2020 100%);
  border-color: #5c2020;
  color: #fca5a5;
}

/* Animations */
:global(.modal-enter-active),
:global(.modal-leave-active) {
  transition: opacity 0.3s ease;
}

:global(.modal-enter-from),
:global(.modal-leave-to) {
  opacity: 0;
}

:global(.error-enter-active),
:global(.error-leave-active) {
  transition: all 0.3s ease;
}

:global(.error-enter-from),
:global(.error-leave-to) {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }

  .header {
    padding: 20px;
  }

  .content {
    padding: 0 20px 20px;
  }

  .footer {
    padding: 16px 20px;
  }

  .cancelButton,
  .submitButton {
    flex: 1;
  }
}
</style>

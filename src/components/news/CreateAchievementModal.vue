<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  createAchievementNews, 
  uploadAchievementImage
} from '../../services/newsService'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// Form state
const form = ref({
  title: '',
  details: ''
})

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Computed
const isFormValid = computed(() => 
  form.value.title.trim().length > 0 && 
  form.value.details.trim().length > 0
)

// Handle image selection
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select a valid image file'
      return
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'Image size must be less than 10MB'
      return
    }
    
    imageFile.value = file
    error.value = null
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Remove image
const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
}

// Submit form
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  try {
    isSubmitting.value = true
    error.value = null
    
    // Step 1: Create achievement and wait for response
    const response = await createAchievementNews({
      news_type: 'ACHIEVEMENT',
      title: form.value.title,
      details: form.value.details
    })
    
    // Step 2: Extract the ID from response
    if (!response.data?.id) {
      throw new Error('Failed to get achievement ID from response')
    }
    
    const achievementId = response.data.id
    
    // Step 3: Upload image if provided, using the returned ID
    if (imageFile.value) {
      await uploadAchievementImage(achievementId, imageFile.value, true, 0)
    }
    
    // Success!
    emit('success')
    resetForm()
  } catch (err: any) {
    console.error('Failed to create achievement:', err)
    error.value = err.response?.data?.detail || 'Failed to create achievement. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    title: '',
    details: ''
  }
  imageFile.value = null
  imagePreview.value = null
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
      <div v-if="show" :class="$style.overlay" @click.self="handleClose">
        <div :class="$style.modal">
          <!-- Header -->
          <div :class="$style.header">
            <h2 :class="$style.title">🏆 Create New Achievement</h2>
            <button 
              :class="$style.closeButton" 
              @click="handleClose"
              :disabled="isSubmitting"
            >
              ✕
            </button>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <!-- Error Message -->
            <div v-if="error" :class="$style.errorBanner">
              ⚠️ {{ error }}
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit">
              <!-- Title -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  Title <span :class="$style.required">*</span>
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  :class="$style.input"
                  placeholder="e.g., ISO 9001:2015 Certification"
                  maxlength="255"
                  required
                />
                <span :class="$style.hint">{{ form.title.length }}/255 characters</span>
              </div>

              <!-- Details -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  Details <span :class="$style.required">*</span>
                </label>
                <textarea
                  v-model="form.details"
                  :class="$style.textarea"
                  placeholder="Describe the achievement, certification, or award..."
                  rows="5"
                  maxlength="1000"
                  required
                ></textarea>
                <span :class="$style.hint">{{ form.details.length }}/1000 characters</span>
              </div>

              <!-- Image Upload -->
              <div :class="$style.formGroup">
                <label :class="$style.label">Achievement Image (Optional)</label>
                
                <!-- Image Preview -->
                <div v-if="imagePreview" :class="$style.imagePreview">
                  <img :src="imagePreview" alt="Preview" />
                  <button 
                    type="button" 
                    :class="$style.removeImage"
                    @click="removeImage"
                  >
                    ✕ Remove
                  </button>
                </div>

                <!-- Upload Button -->
                <div v-else :class="$style.uploadArea">
                  <input
                    type="file"
                    :class="$style.fileInput"
                    accept="image/jpeg,image/png,image/webp"
                    @change="handleImageSelect"
                    id="achievementImageUpload"
                  />
                  <label for="achievementImageUpload" :class="$style.uploadLabel">
                    <span :class="$style.uploadIcon">📷</span>
                    <span :class="$style.uploadText">Upload certificate or award photo</span>
                    <span :class="$style.uploadHint">JPEG, PNG, or WebP (max 10MB)</span>
                  </label>
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
              Cancel
            </button>
            <button
              type="button"
              :class="$style.submitButton"
              @click="handleSubmit"
              :disabled="!isFormValid || isSubmitting"
            >
              <span v-if="!isSubmitting">Create Achievement</span>
              <span v-else>Creating...</span>
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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

/* Modal */
.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Header */
.header {
  padding: 24px;
  border-bottom: 2px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #065f46;
}

.closeButton {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.closeButton:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.closeButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Content */
.content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* Error Banner */
.errorBanner {
  background: #fee2e2;
  border: 2px solid #dc2626;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

/* Form */
.formGroup {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.required {
  color: #dc2626;
}

.input,
.textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.2s;
  font-family: inherit;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

.hint {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

/* Image Upload */
.uploadArea {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.uploadArea:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.fileInput {
  display: none;
}

.uploadLabel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.uploadIcon {
  font-size: 48px;
}

.uploadText {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.uploadHint {
  font-size: 12px;
  color: #9ca3af;
}

/* Image Preview */
.imagePreview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.imagePreview img {
  width: 100%;
  height: auto;
  display: block;
}

.removeImage {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.removeImage:hover {
  background: #dc2626;
}

/* Footer */
.footer {
  padding: 20px 24px;
  border-top: 2px solid #f3f4f6;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancelButton,
.submitButton {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancelButton {
  background: #f3f4f6;
  color: #6b7280;
}

.cancelButton:hover {
  background: #e5e7eb;
  color: #374151;
}

.cancelButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submitButton {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.submitButton:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.submitButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .header,
  .content,
  .footer {
    padding: 16px;
  }

  .title {
    font-size: 20px;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { 
  createSliderNews, 
  createNormalNews,
  createAchievementNews,
  uploadSliderImage, 
  uploadNormalImage,
  uploadAchievementImage
} from '../../services/newsService'
import ImageGalleryManager from './ImageGalleryManager.vue'
import RichTextEditor from './RichTextEditor.vue'
import type { NewsType } from '../../types/news.types'

interface Props {
  show: boolean
  newsType: NewsType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// Store for theme
const store = useAppStore()
const { currentTheme } = storeToRefs(store)

// Tab state
const activeTab = ref<'details' | 'images'>('details')

// Created news ID (available after creation)
const createdNewsId = ref<number | null>(null)

// Form state
const form = ref({
  title: '',
  details: ''
})

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const isDragging = ref(false)

// Computed
const modalTitle = computed(() => {
  if (createdNewsId.value) {
    if (props.newsType === 'SLIDER') return 'إدارة السلايدر'
    if (props.newsType === 'ACHIEVEMENT') return 'إدارة الإنجاز'
    return 'إدارة الخبر'
  }
  if (props.newsType === 'SLIDER') return 'إنشاء سلايدر جديد'
  if (props.newsType === 'ACHIEVEMENT') return 'إنشاء إنجاز جديد'
  return 'إنشاء خبر جديد'
})

const modalSubtitle = computed(() => {
  if (createdNewsId.value) {
    return 'تم إنشاء الخبر بنجاح! يمكنك الآن إضافة المزيد من الصور'
  }
  return 'املأ التفاصيل أدناه لإنشاء المحتوى الخاص بك'
})

const isFormValid = computed(() => 
  form.value.title.trim().length > 0 && 
  form.value.details.trim().length > 0
)

const titleProgress = computed(() => (form.value.title.length / 255) * 100)
const detailsProgress = computed(() => (form.value.details.length / 1000) * 100)

// Handle image selection
const handleImageSelect = (event: Event) => {
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
    error.value = 'يرجى اختيار ملف صورة صالح'
    return
  }
  
  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'حجم الصورة يجب أن يكون أقل من 10 ميجابايت'
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
    
    // Step 1: Create news item and wait for response
    let createFn
    if (props.newsType === 'SLIDER') {
      createFn = createSliderNews
    } else if (props.newsType === 'ACHIEVEMENT') {
      createFn = createAchievementNews
    } else {
      createFn = createNormalNews
    }
    
    const response = await createFn({
      news_type: props.newsType,
      title: form.value.title,
      details: form.value.details
    })
    
    // Step 2: Extract the ID from response
    if (!response.data?.id) {
      throw new Error('فشل في الحصول على معرف الخبر')
    }
    
    const newsId = response.data.id
    
    // Step 3: Upload image if provided, using the returned ID
    if (imageFile.value) {
      let uploadFn
      if (props.newsType === 'SLIDER') {
        uploadFn = uploadSliderImage
      } else if (props.newsType === 'ACHIEVEMENT') {
        uploadFn = uploadAchievementImage
      } else {
        uploadFn = uploadNormalImage
      }
      await uploadFn(newsId, imageFile.value, true, 0)
    }
    
    // Store the created news ID for image management
    createdNewsId.value = newsId
    
    // Clear the form but keep modal open for image management
    form.value = { title: '', details: '' }
    imageFile.value = null
    imagePreview.value = null
    
  } catch (err: any) {
    console.error('Failed to create news:', err)
    error.value = err.response?.data?.detail || 'فشل إنشاء الخبر. يرجى المحاولة مرة أخرى.'
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
  createdNewsId.value = null
  activeTab.value = 'details'
}

// Close modal
const handleClose = () => {
  if (!isSubmitting.value) {
    // If news was created, emit success before closing
    if (createdNewsId.value) {
      emit('success')
    }
    resetForm()
    emit('close')
  }
}

// Finish and close (after managing images)
const handleFinish = () => {
  emit('success')
  resetForm()
  emit('close')
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
                <svg v-if="newsType === 'SLIDER'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div :class="$style.headerText">
                <h2 :class="$style.title">{{ modalTitle }}</h2>
                <p :class="$style.subtitle">{{ modalSubtitle }}</p>
              </div>
            </div>
            <button 
              :class="$style.closeButton" 
              @click="handleClose"
              :disabled="isSubmitting"
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <!-- Tabs (shown after news is created) -->
            <div v-if="createdNewsId" :class="$style.tabsWrapper">
              <div :class="$style.tabs">
                <button 
                  type="button"
                  :class="[$style.tab, { [$style.activeTab]: activeTab === 'details' }]"
                  @click="activeTab = 'details'"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>تفاصيل الخبر</span>
                </button>
                <button 
                  type="button"
                  :class="[$style.tab, { [$style.activeTab]: activeTab === 'images' }]"
                  @click="activeTab = 'images'"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>إدارة الصور</span>
                </button>
                <div :class="$style.tabIndicator" :style="{ transform: activeTab === 'details' ? 'translateX(0)' : 'translateX(100%)' }"></div>
              </div>
            </div>

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

            <!-- Details Tab / Form (before creation) -->
            <div v-show="activeTab === 'details'" :class="$style.tabContent">
              <!-- Success Message (after creation) -->
              <div v-if="createdNewsId" :class="$style.successBanner">
                <div :class="$style.successIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div :class="$style.successContent">
                  <h4>تم إنشاء الخبر بنجاح!</h4>
                  <p>يمكنك الآن إضافة المزيد من الصور من تبويب "إدارة الصور" أو الضغط على "إنهاء" للإغلاق.</p>
                </div>
              </div>

              <!-- Form (before creation) -->
              <form v-else @submit.prevent="handleSubmit" :class="$style.form">
              <!-- Title -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>العنوان</span>
                  <span :class="$style.required">*</span>
                </label>
                <div :class="$style.inputWrapper">
                  <input
                    v-model="form.title"
                    type="text"
                    :class="$style.input"
                    placeholder="أدخل عنوان جذاب..."
                    maxlength="255"
                    required
                  />
                  <div :class="$style.progressBar">
                    <div :class="$style.progressFill" :style="{ width: titleProgress + '%' }"></div>
                  </div>
                </div>
                <span :class="$style.hint">{{ form.title.length }}/255 حرف</span>
              </div>

              <!-- Details -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="17" y1="10" x2="3" y2="10"/>
                    <line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/>
                    <line x1="17" y1="18" x2="3" y2="18"/>
                  </svg>
                  <span>التفاصيل</span>
                  <span :class="$style.required">*</span>
                </label>
                <RichTextEditor
                  v-model="form.details"
                  placeholder="اكتب تفاصيل الخبر هنا..."
                  :max-length="1000"
                />
              </div>

              <!-- Image Upload -->
              <div :class="$style.formGroup">
                <label :class="$style.label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>صورة الغلاف</span>
                  <span :class="$style.optional">(اختياري)</span>
                </label>
                
                <!-- Image Preview -->
                <div v-if="imagePreview" :class="$style.imagePreview">
                  <img :src="imagePreview" alt="Preview" />
                  <div :class="$style.imageOverlay">
                    <button 
                      type="button" 
                      :class="$style.removeImage"
                      @click="removeImage"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>إزالة</span>
                    </button>
                  </div>
                  <div :class="$style.imageBadge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    جاهزة للرفع
                  </div>
                </div>

                <!-- Upload Area -->
                <div 
                  v-else 
                  :class="[$style.uploadArea, { [$style.dragging]: isDragging }]"
                  @dragover="handleDragOver"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop"
                >
                  <input
                    type="file"
                    :class="$style.fileInput"
                    accept="image/jpeg,image/png,image/webp"
                    @change="handleImageSelect"
                    id="imageUpload"
                  />
                  <label for="imageUpload" :class="$style.uploadLabel">
                    <div :class="$style.uploadIconWrapper">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <span :class="$style.uploadText">
                      <strong>انقر للرفع</strong> أو اسحب وأفلت
                    </span>
                    <span :class="$style.uploadHint">JPEG, PNG, أو WebP (الحد الأقصى 10 ميجابايت)</span>
                  </label>
                </div>
              </div>
            </form>
            </div>

            <!-- Images Tab (only after creation) -->
            <div v-if="createdNewsId" v-show="activeTab === 'images'" :class="$style.tabContent">
              <ImageGalleryManager 
                :news-id="createdNewsId"
                :news-type="newsType"
                @success="() => {}"
              />
            </div>
          </div>

          <!-- Footer -->
          <div :class="$style.footer">
            <!-- Before creation -->
            <template v-if="!createdNewsId">
              <button
                type="button"
                :class="$style.cancelButton"
                @click="handleClose"
                :disabled="isSubmitting"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>إلغاء</span>
              </button>
              <button
                type="button"
                :class="$style.submitButton"
                @click="handleSubmit"
                :disabled="!isFormValid || isSubmitting"
              >
                <template v-if="!isSubmitting">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span>إنشاء {{ newsType === 'SLIDER' ? 'سلايدر' : 'خبر' }}</span>
                </template>
                <template v-else>
                  <div :class="$style.spinner"></div>
                  <span>جاري الإنشاء...</span>
                </template>
              </button>
            </template>

            <!-- After creation -->
            <template v-else>
              <button
                type="button"
                :class="$style.secondaryButton"
                @click="activeTab = 'images'"
                v-if="activeTab === 'details'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>إضافة صور</span>
              </button>
              <button
                type="button"
                :class="$style.submitButton"
                @click="handleFinish"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>إنهاء</span>
              </button>
            </template>
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
  max-width: 640px;
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
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
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

/* Tabs */
.tabsWrapper {
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  position: relative;
  background: #f3f4f6;
  border-radius: 14px;
  padding: 6px;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.tab svg {
  flex-shrink: 0;
}

.tab:hover:not(.activeTab) {
  color: #374151;
}

.activeTab {
  color: #A17D23;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tabIndicator {
  display: none;
}

.tabContent {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Success Banner */
.successBanner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 24px;
}

.successIcon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.successContent {
  flex: 1;
}

.successContent h4 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 700;
  color: #166534;
}

.successContent p {
  margin: 0;
  font-size: 14px;
  color: #15803d;
  line-height: 1.5;
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

.input,
.textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  color: #1f2937;
  transition: all 0.3s ease;
  font-family: inherit;
  background: #fafafa;
}

.input::placeholder,
.textarea::placeholder {
  color: #9ca3af;
}

.input:hover,
.textarea:hover {
  border-color: #d1d5db;
  background: white;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #A17D23;
  background: white;
  box-shadow: 0 0 0 4px rgba(161, 125, 35, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 140px;
  line-height: 1.6;
}

.progressBar {
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 3px;
  background: #e5e7eb;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #A17D23, #C4A048);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  justify-content: flex-end;
}

/* Image Upload */
.uploadArea {
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  padding: 40px 24px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #fafafa;
  position: relative;
  overflow: hidden;
}

.uploadArea::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.05) 0%, rgba(196, 160, 72, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.uploadArea:hover,
.uploadArea.dragging {
  border-color: #A17D23;
  background: white;
}

.uploadArea:hover::before,
.uploadArea.dragging::before {
  opacity: 1;
}

.uploadArea.dragging {
  border-style: solid;
  transform: scale(1.02);
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
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #A17D23 0%, #C4A048 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px rgba(161, 125, 35, 0.25);
  transition: transform 0.3s ease;
}

.uploadArea:hover .uploadIconWrapper {
  transform: translateY(-4px);
}

.uploadText {
  font-size: 15px;
  color: #374151;
}

.uploadText strong {
  color: #A17D23;
}

.uploadHint {
  font-size: 13px;
  color: #9ca3af;
}

/* Image Preview */
.imagePreview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
}

.imagePreview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.imageOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.imagePreview:hover .imageOverlay {
  opacity: 1;
}

.removeImage {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(220, 38, 38, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.removeImage:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.imageBadge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(34, 197, 94, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

/* Footer */
.footer {
  padding: 20px 28px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancelButton,
.submitButton,
.secondaryButton {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancelButton {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.cancelButton:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.cancelButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondaryButton {
  background: white;
  color: #A17D23;
  border: 2px solid #A17D23;
}

.secondaryButton:hover {
  background: rgba(161, 125, 35, 0.1);
}

.submitButton {
  background: linear-gradient(135deg, #A17D23 0%, #C4A048 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(161, 125, 35, 0.35);
}

.submitButton:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(161, 125, 35, 0.45);
}

.submitButton:active:not(:disabled) {
  transform: translateY(0);
}

.submitButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
}

.overlay[data-theme="night"] .title {
  color: #f5f5f5;
}

.overlay[data-theme="night"] .subtitle {
  color: #a0a0a0;
}

.overlay[data-theme="night"] .closeButton {
  background: #2d2d2d;
  color: #a0a0a0;
}

.overlay[data-theme="night"] .closeButton:hover {
  background: #4a1c1c;
  color: #f87171;
}

.overlay[data-theme="night"] .tabs {
  background: #2d2d2d;
}

.overlay[data-theme="night"] .tab {
  color: #a0a0a0;
}

.overlay[data-theme="night"] .tab:hover:not(.activeTab) {
  color: #e5e5e5;
}

.overlay[data-theme="night"] .activeTab {
  background: #3d3d3d;
  color: #c9a033;
}

.overlay[data-theme="night"] .successBanner {
  background: linear-gradient(135deg, #14532d 0%, #166534 100%);
  border-color: #22c55e;
}

.overlay[data-theme="night"] .successContent h4 {
  color: #86efac;
}

.overlay[data-theme="night"] .successContent p {
  color: #4ade80;
}

.overlay[data-theme="night"] .secondaryButton {
  background: #2d2d2d;
  border-color: #c9a033;
  color: #c9a033;
}

.overlay[data-theme="night"] .secondaryButton:hover {
  background: rgba(201, 160, 51, 0.15);
}

.overlay[data-theme="night"] .label {
  color: #e5e5e5;
}

.overlay[data-theme="night"] .input,
.overlay[data-theme="night"] .textarea {
  background: #2d2d2d;
  border-color: #404040;
  color: #f5f5f5;
}

.overlay[data-theme="night"] .input::placeholder,
.overlay[data-theme="night"] .textarea::placeholder {
  color: #707070;
}

.overlay[data-theme="night"] .input:hover,
.overlay[data-theme="night"] .textarea:hover {
  border-color: #505050;
  background: #333;
}

.overlay[data-theme="night"] .input:focus,
.overlay[data-theme="night"] .textarea:focus {
  border-color: #c9a84c;
  background: #333;
  box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.15);
}

.overlay[data-theme="night"] .progressBar {
  background: #404040;
}

.overlay[data-theme="night"] .hint {
  color: #707070;
}

.overlay[data-theme="night"] .uploadArea {
  background: #2d2d2d;
  border-color: #404040;
}

.overlay[data-theme="night"] .uploadArea:hover,
.overlay[data-theme="night"] .uploadArea.dragging {
  border-color: #c9a84c;
  background: #333;
}

.overlay[data-theme="night"] .uploadText {
  color: #e5e5e5;
}

.overlay[data-theme="night"] .uploadText strong {
  color: #c9a84c;
}

.overlay[data-theme="night"] .uploadHint {
  color: #707070;
}

.overlay[data-theme="night"] .imagePreview {
  border-color: #404040;
  background: #2d2d2d;
}

.overlay[data-theme="night"] .footer {
  background: #252525;
  border-top-color: #333;
}

.overlay[data-theme="night"] .cancelButton {
  background: #2d2d2d;
  border-color: #404040;
  color: #a0a0a0;
}

.overlay[data-theme="night"] .cancelButton:hover:not(:disabled) {
  background: #333;
  border-color: #505050;
  color: #e5e5e5;
}

.overlay[data-theme="night"] .headerIcon {
  background: linear-gradient(135deg, #c9a84c 0%, #b8976c 100%);
}

.overlay[data-theme="night"] .uploadIconWrapper {
  background: linear-gradient(135deg, #c9a84c 0%, #b8976c 100%);
}

.overlay[data-theme="night"] .submitButton {
  background: linear-gradient(135deg, #c9a84c 0%, #b8976c 100%);
}

.overlay[data-theme="night"] .label svg {
  color: #c9a84c;
}

.overlay[data-theme="night"] .progressFill {
  background: linear-gradient(90deg, #c9a84c, #b8976c);
}

.overlay[data-theme="night"] .errorBanner {
  background: linear-gradient(135deg, #4a1c1c 0%, #5c2020 100%);
  border-color: #7f1d1d;
  color: #fca5a5;
}

/* Animations */
:global(.modal-enter-active),
:global(.modal-leave-active) {
  transition: all 0.3s ease;
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
    max-height: 100vh;
    border-radius: 0;
  }

  .header,
  .content {
    padding: 20px;
  }

  .footer {
    padding: 16px 20px;
  }

  .headerContent {
    flex-direction: column;
    gap: 12px;
  }

  .title {
    font-size: 18px;
  }

  .uploadArea {
    padding: 30px 20px;
  }
}
</style>

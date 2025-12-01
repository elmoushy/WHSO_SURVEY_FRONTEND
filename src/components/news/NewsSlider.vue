<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { fetchSliderNews } from '../../services/newsService'
import { useAuthenticatedImage } from '../../composables/useAuthenticatedImage'
import type { Newsletter } from '../../types/news.types'
import img1 from '../../../public/Test1.jpg'

const router = useRouter()

interface Props {
  editable?: boolean
  refreshKey?: number
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  refreshKey: 0
})

const emit = defineEmits<{
  (e: 'edit', item: Newsletter): void
  (e: 'delete', item: Newsletter): void
  (e: 'view', item: Newsletter): void
}>()

// Store for theme
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// ============ MOCK DATA - DELETE WHEN SERVER IS READY ============
const MOCK_SLIDER_DATA: Newsletter[] = [
  {
    id: 1,
    title: 'إطلاق منصة الاستبيانات الجديدة',
    details: 'تم إطلاق منصة الاستبيانات الجديدة التي تتيح للمستخدمين إنشاء وإدارة الاستبيانات بسهولة تامة مع دعم كامل للغة العربية والإنجليزية.',
    author: 1,
    author_name: 'أحمد محمد',
    news_type: 'SLIDER',
    position: 1,
    created_at: '2025-11-28T10:00:00Z',
    updated_at: '2025-11-28T10:00:00Z',
    images: [],
    main_image: { id: 1, original_filename: 'Test1.jpg', file_size: 1024, mime_type: 'image/jpeg', is_main: true, display_order: 1, uploaded_at: '2025-11-28T10:00:00Z', download_url: img1, thumbnail_url: img1 }
  },
  {
    id: 2,
    title: 'تحديث جديد لنظام التقارير',
    details: 'أصبح بإمكانك الآن تصدير التقارير بصيغة PDF مع دعم كامل للغة العربية والخطوط المخصصة.',
    author: 2,
    author_name: 'سارة أحمد',
    news_type: 'SLIDER',
    position: 2,
    created_at: '2025-11-25T14:30:00Z',
    updated_at: '2025-11-25T14:30:00Z',
    images: [],
    main_image: { id: 2, original_filename: 'Test1.jpg', file_size: 1024, mime_type: 'image/jpeg', is_main: true, display_order: 1, uploaded_at: '2025-11-25T14:30:00Z', download_url: img1, thumbnail_url: img1 }
  },
  {
    id: 3,
    title: 'ميزة المشاركة العامة للاستبيانات',
    details: 'يمكنك الآن مشاركة استبياناتك مع الجمهور عبر روابط مخصصة مع إمكانية تتبع الردود.',
    author: 3,
    author_name: 'محمد علي',
    news_type: 'SLIDER',
    position: 3,
    created_at: '2025-11-20T09:15:00Z',
    updated_at: '2025-11-20T09:15:00Z',
    images: [],
    main_image: { id: 3, original_filename: 'Test1.jpg', file_size: 1024, mime_type: 'image/jpeg', is_main: true, display_order: 1, uploaded_at: '2025-11-20T09:15:00Z', download_url: img1, thumbnail_url: img1 }
  }
]
const USE_MOCK_DATA = true // ← Set to false when server is ready
// ============ END MOCK DATA ============

// State
const slides = ref<Newsletter[]>([])
const currentIndex = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 3 // 3 items per page as required
const autoplayInterval = ref<number | null>(null)
const remainingTime = ref(30) // 30 seconds per slide
const timerInterval = ref<number | null>(null)

// Computed
const currentSlide = computed(() => slides.value[currentIndex.value] || null)
const hasSlides = computed(() => slides.value.length > 0)

// Fetch slider data
const loadSlides = async (page: number = 1) => {
  try {
    isLoading.value = true
    error.value = null

    // ============ USE MOCK DATA ============
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
      slides.value = MOCK_SLIDER_DATA
      totalPages.value = 1
      currentPage.value = 1
      return
    }
    // ============ END MOCK DATA ============

    const response = await fetchSliderNews({
      page,
      page_size: pageSize
    })

    if (response.status === 'success' && response.data.results.length > 0) {
      // Append new slides for infinite loop
      slides.value = [...slides.value, ...response.data.results]
      totalPages.value = response.data.total_pages
      currentPage.value = response.data.current_page
    }
  } catch (err: any) {
    console.error('Failed to load slider news:', err)
    error.value = 'Failed to load slider news. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

// Navigation
const goToSlide = (index: number) => {
  currentIndex.value = index
  resetTimer()
}

const nextSlide = async () => {
  const nextIndex = currentIndex.value + 1

  // Check if we need to load more slides
  if (nextIndex >= slides.value.length) {
    // If we have more pages, load them
    if (currentPage.value < totalPages.value) {
      await loadSlides(currentPage.value + 1)
    } else {
      // Loop back to start (infinite loop)
      currentIndex.value = 0
      resetTimer()
      return
    }
  }

  currentIndex.value = nextIndex
  resetTimer()
}

const prevSlide = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    // Loop to end
    currentIndex.value = slides.value.length - 1
  }
  resetTimer()
}

// Auto-play timer
const startAutoplay = () => {
  stopAutoplay() // Clear any existing interval
  
  autoplayInterval.value = window.setInterval(() => {
    nextSlide()
  }, 30000) // 30 seconds
}

const stopAutoplay = () => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
    autoplayInterval.value = null
  }
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

const resetTimer = () => {
  remainingTime.value = 30
  startAutoplay()
  startTimerCountdown()
}

const startTimerCountdown = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  timerInterval.value = window.setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      remainingTime.value = 30
    }
  }, 1000)
}

// Handle edit/view click
const handleEdit = (item: Newsletter) => {
  if (props.editable) {
    emit('edit', item)
  } else {
    // Navigate to news details page
    router.push({ name: 'news-details', params: { id: item.id } })
  }
}

// Handle "Read More" button click - always navigate to details
const handleReadMore = (item: Newsletter) => {
  router.push({ name: 'news-details', params: { id: item.id } })
}

// Handle delete click
const handleDelete = (item: Newsletter, event: Event) => {
  if (props.editable) {
    event.stopPropagation() // Prevent triggering edit
    emit('delete', item)
  }
}

// Authenticated image loading for current slide
const currentImageUrl = computed(() => {
  const slide = currentSlide.value
  return slide?.main_image?.download_url || null
})

// For mock data, use the image directly; for real data, use authenticated image
const { blobUrl: authenticatedImageUrl, isLoading: authImageLoading } = useAuthenticatedImage(
  computed(() => USE_MOCK_DATA ? null : currentImageUrl.value)
)

// Use mock image directly or authenticated URL
const currentImageBlobUrl = computed(() => {
  if (USE_MOCK_DATA) {
    return currentImageUrl.value
  }
  return authenticatedImageUrl.value
})

const imageLoading = computed(() => {
  if (USE_MOCK_DATA) {
    return false
  }
  return authImageLoading.value
})

// Format date in Arabic format
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  await loadSlides(1)
  if (hasSlides.value) {
    startAutoplay()
    startTimerCountdown()
  }
})

onUnmounted(() => {
  stopAutoplay()
})

// Watch for slides changes
watch(hasSlides, (newVal) => {
  if (newVal && !autoplayInterval.value) {
    startAutoplay()
    startTimerCountdown()
  }
})

// Watch for refresh key changes
watch(() => props.refreshKey, async () => {
  // Reset state and reload from first page
  slides.value = []
  currentIndex.value = 0
  currentPage.value = 1
  stopAutoplay()
  
  await loadSlides(1)
  
  if (hasSlides.value) {
    startAutoplay()
    startTimerCountdown()
  }
})

// Expose refresh method
defineExpose({
  refresh: async () => {
    slides.value = []
    currentIndex.value = 0
    currentPage.value = 1
    stopAutoplay()
    await loadSlides(1)
    if (hasSlides.value) {
      startAutoplay()
      startTimerCountdown()
    }
  }
})
</script>

<template>
  <div :class="$style.sliderContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Loading State -->
    <div v-if="isLoading && slides.length === 0" :class="$style.skeleton">
      <div :class="$style.skeletonImage"></div>
      <div :class="$style.skeletonContent">
        <div :class="$style.skeletonTitle"></div>
        <div :class="$style.skeletonText"></div>
        <div :class="$style.skeletonText"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.error">
      <span>⚠️ {{ error }}</span>
    </div>

    <!-- Slider Content -->
    <div v-else-if="hasSlides" :class="$style.slider">
      <!-- Slide -->
      <div 
        :class="[$style.slide, { [$style.editable]: editable }]"
        @click="handleEdit(currentSlide!)"
      >
        <!-- Image with skeleton -->
        <div :class="$style.imageWrapper">
          <div 
            v-if="imageLoading || !currentImageBlobUrl" 
            :class="$style.imageSkeleton"
          ></div>
          <img
            v-if="currentImageBlobUrl"
            :src="img1"
            :alt="currentSlide?.title"
            :class="$style.image"
          />
          <div v-else-if="!currentSlide?.main_image && !imageLoading" :class="$style.noImage">
            <!-- Placeholder gradient background -->
          </div>
        </div>

        <!-- Content Overlay -->
        <div :class="$style.content">
          <!-- Badge -->
          <div :class="$style.badge">
            <span>{{ isRTL ? 'إنجاز' : 'Achievement' }}</span>
          </div>

          <!-- Title -->
          <h2 :class="$style.title">{{ currentSlide?.title }}</h2>
          
          <!-- Details -->
          <p :class="$style.details">{{ currentSlide?.details }}</p>
          
          <!-- Meta Info -->
          <div :class="$style.meta">
            <div :class="$style.metaItem">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>{{ currentSlide?.author_name }}</span>
            </div>
            <div :class="$style.metaItem">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{{ formatDate(currentSlide?.created_at) }}</span>
            </div>
          </div>

          <!-- Read More Button -->
          <button :class="$style.readMoreBtn" @click.stop="handleReadMore(currentSlide!)">
            {{ isRTL ? 'اقرأ المزيد' : 'Read More' }}
          </button>
        </div>

        <!-- Edit Indicator -->
        <div v-if="editable" :class="$style.editBadge">
          <span>✏️ {{ isRTL ? 'انقر للتعديل' : 'Click to Edit' }}</span>
        </div>

        <!-- Delete Button -->
        <button 
          v-if="editable" 
          :class="$style.deleteButton"
          @click="handleDelete(currentSlide!, $event)"
          :title="isRTL ? 'حذف' : 'Delete this slider'"
        >
          <span>🗑️</span>
        </button>
      </div>

      <!-- Navigation Dots -->
      <div :class="$style.dotsContainer">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          :class="[$style.dot, { [$style.active]: index === currentIndex }]"
          @click.stop="goToSlide(index)"
          :aria-label="`Go to slide ${index + 1}`"
        ></button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else :class="$style.empty">
      <span>{{ isRTL ? '📰 لا توجد أخبار متاحة' : '📰 No slider news available' }}</span>
    </div>
  </div>
</template>

<style module>
.sliderContainer {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  direction: rtl;
}

/* ==================== SKELETON ==================== */
.skeleton {
  width: 100%;
  height: 450px;
  background: linear-gradient(135deg, #cccdcc 0%, #b4b5b4 50%, #c7c8c8 100%);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
}

.skeletonImage {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeletonContent {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 40px;
}

.skeletonTitle {
  width: 50%;
  height: 40px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.skeletonText {
  width: 70%;
  height: 20px;
  background: rgba(255,255,255,0.15);
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeletonText:last-child {
  width: 40%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ==================== SLIDER ==================== */
.slider {
  width: 100%;
  position: relative;
  border-radius: 24px;
  /* overflow: hidden; */
}

.slide {
  position: relative;
  width: 100%;
  height: 450px;
  overflow: hidden;
  cursor: default;
  border-radius: 24px;
}

.slide.editable {
  cursor: pointer;
}

.slide.editable:hover .imageWrapper::after {
  opacity: 0.1;
}

.imageWrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.imageWrapper::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
  pointer-events: none;
}

.imageSkeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #b1b1b1 0%, #666666 50%, #9e9f9e 100%);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.noImage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #b1b1b1 0%, #666666 50%, #1a3d34 100%);
}

/* ==================== CONTENT OVERLAY ==================== */
.content {
  position: absolute;
  top: 50%;
  right: 60px;
  transform: translateY(-50%);
  max-width: 600px;
  color: white;
  text-align: right;
}

/* Badge */
.badge {
  display: inline-block;
  margin-bottom: 20px;
}

.badge span {
  background: linear-gradient(135deg, #b8976c 0%, #9a7d54 100%);
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Title */
.title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.3;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Details */
.details {
  font-size: 16px;
  line-height: 1.7;
  margin: 0 0 24px 0;
  opacity: 0.9;
  color: white;
}

/* Meta */
.meta {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.metaItem {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
}

.metaItem svg {
  opacity: 0.8;
}

/* Read More Button */
.readMoreBtn {
  background: #FFFFFF;
  border: 2px solid rgba(255,255,255,0.8);
  color: #A17D23;
  padding: 10px 36px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.readMoreBtn:hover {
  background: white;
  color: #2d5a4e;
  border-color: white;
}

/* ==================== EDIT & DELETE ==================== */
.editBadge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(251, 191, 36, 0.95);
  color: #1f2937;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.deleteButton {
  position: absolute;
  top: 20px;
  left: 140px;
  background: rgba(220, 38, 38, 0.95);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
}

.deleteButton:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* ==================== DOTS ==================== */
.dotsContainer {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: #D1D5DC;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dot:hover {
  background: #A17D23;
}

.dot.active {
  background: #A17D23;
  width: 28px;
  border-radius: 5px;
}

/* ==================== ERROR & EMPTY ==================== */
.error,
.empty {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a7c6f 0%, #2d5a4e 100%);
  border-radius: 24px;
  font-size: 18px;
  color: white;
}

.error {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .content {
    right: 40px;
    max-width: 500px;
  }

  .title {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .slide {
    height: 450px;
  }

  .content {
    right: 24px;
    left: 24px;
    max-width: none;
    top: auto;
    bottom: 80px;
    transform: none;
  }

  .title {
    font-size: 26px;
  }

  .details {
    font-size: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    flex-wrap: wrap;
    gap: 16px;
  }

  .readMoreBtn {
    padding: 12px 28px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .slide {
    height: 400px;
    border-radius: 16px;
  }

  .slider {
    border-radius: 16px;
  }

  .content {
    right: 16px;
    left: 16px;
    bottom: 60px;
  }

  .title {
    font-size: 22px;
  }

  .badge span {
    padding: 6px 16px;
    font-size: 12px;
  }

  .dotsContainer {
    bottom: 20px;
  }
}

/* ==================== DARK MODE ==================== */
.sliderContainer[data-theme="night"] .skeleton {
  background: linear-gradient(135deg, #cccdcc 0%, #b4b5b4 50%, #c7c8c8 100%);
}

.sliderContainer[data-theme="night"] .imageSkeleton {
  background: linear-gradient(135deg, #2d4a42 0%, #1a3d34 50%, #0f2a24 100%);
}

.sliderContainer[data-theme="night"] .noImage {
  background: linear-gradient(135deg, #2d4a42 0%, #1a3d34 50%, #0f2a24 100%);
}

.sliderContainer[data-theme="night"] .imageWrapper::after {
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%);
}

.sliderContainer[data-theme="night"] .dot {
  background: #4a4a4a;
}

.sliderContainer[data-theme="night"] .dot:hover {
  background: #c9a84c;
}

.sliderContainer[data-theme="night"] .dot.active {
  background: #c9a84c;
}

.sliderContainer[data-theme="night"] .readMoreBtn {
  background: rgba(255, 255, 255, 0.95);
  color: #A17D23;
  border-color: rgba(255, 255, 255, 0.8);
}

.sliderContainer[data-theme="night"] .readMoreBtn:hover {
  background: #c9a84c;
  color: white;
  border-color: #c9a84c;
}

.sliderContainer[data-theme="night"] .error,
.sliderContainer[data-theme="night"] .empty {
  background: linear-gradient(135deg, #2d4a42 0%, #1a3d34 100%);
}

.sliderContainer[data-theme="night"] .error {
  background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%);
}

/* RTL Support */
.sliderContainer[dir="ltr"] .content {
  right: auto;
  left: 60px;
  text-align: left;
}

.sliderContainer[dir="ltr"] .meta {
  flex-direction: row;
  justify-content: flex-start;
}

.sliderContainer[dir="ltr"] .imageWrapper::after {
  background: linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
}

@media (max-width: 768px) {
  .sliderContainer[dir="ltr"] .content {
    left: 24px;
    right: 24px;
  }
}

@media (max-width: 480px) {
  .sliderContainer[dir="ltr"] .content {
    left: 16px;
    right: 16px;
  }
}
</style>

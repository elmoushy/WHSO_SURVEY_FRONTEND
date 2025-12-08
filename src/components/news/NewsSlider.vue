<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { fetchSliderNews } from '../../services/newsService'
import { useAuthenticatedImage } from '../../composables/useAuthenticatedImage'
import type { Newsletter } from '../../types/news.types'

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

// Auto-play timer
const startAutoplay = () => {
  stopAutoplay() // Clear any existing interval
  
  autoplayInterval.value = window.setInterval(() => {
    nextSlide()
  }, 10000) // 10 seconds
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
    // Navigate to news details page with news_type
    router.push({ name: 'news-details', params: { id: item.id }, query: { type: item.news_type } })
  }
}

// Handle "Read More" button click - always navigate to details
const handleReadMore = (item: Newsletter) => {
  router.push({ name: 'news-details', params: { id: item.id }, query: { type: item.news_type } })
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

// Image version for cache invalidation (use updated_at timestamp)
const currentImageVersion = computed(() => {
  const slide = currentSlide.value
  return slide?.updated_at || slide?.main_image?.uploaded_at || undefined
})

// Use authenticated image composable for backend images with caching
const { blobUrl: currentImageBlobUrl, isLoading: imageLoading } = useAuthenticatedImage(
  currentImageUrl,
  computed(() => ({ version: currentImageVersion.value }))
)

// Truncate HTML content while preserving tags
const truncateHtml = (html: string | undefined, maxLength: number = 120): string => {
  if (!html) return ''
  
  // Create a temporary element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Remove all images to prevent 401 errors and layout issues in slider
  const images = temp.getElementsByTagName('img')
  while(images.length > 0){
    images[0].parentNode?.removeChild(images[0])
  }
  
  // Get plain text to check length
  const plainText = temp.textContent || temp.innerText || ''
  if (plainText.length <= maxLength) return html
  
  // Truncate the text content while preserving structure
  let charCount = 0
  let truncated = false
  
  const truncateNode = (node: Node): void => {
    if (truncated) return
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      const remaining = maxLength - charCount
      
      if (text.length > remaining) {
        node.textContent = text.substring(0, remaining).trim() + '...'
        charCount = maxLength
        truncated = true
      } else {
        charCount += text.length
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const children = Array.from(node.childNodes)
      for (const child of children) {
        if (truncated) {
          node.removeChild(child)
        } else {
          truncateNode(child)
        }
      }
    }
  }
  
  truncateNode(temp)
  return temp.innerHTML
}

// Format date in Gregorian format
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isRTL.value) {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
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
            :src="currentImageBlobUrl"
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
          <!-- <div :class="$style.badge">
            <span>{{ isRTL ? 'إنجاز' : 'Achievement' }}</span>
          </div> -->

          <!-- Title -->
          <h2 :class="$style.title">{{ currentSlide?.title }}</h2>
          
          <!-- Details -->
          <div :class="$style.detailsWrapper">
            <div :class="$style.details" v-html="truncateHtml(currentSlide?.details, 120)"></div>
          </div>
          
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

        <!-- Admin Controls Overlay -->
        <div v-if="editable" :class="$style.adminControls" :style="{ left: '20px', right: 'auto' }">
          <!-- Edit Indicator -->
          <div :class="$style.editBadge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>{{ isRTL ? 'انقر للتعديل' : 'Click to Edit' }}</span>
          </div>

          <!-- Delete Button -->
          <button 
            :class="$style.deleteButton"
            @click="handleDelete(currentSlide!, $event)"
            :title="isRTL ? 'حذف' : 'Delete this slider'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
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
  /* Modern gradient: Darker on the side where text lives (Right for RTL) */
  background: linear-gradient(270deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%);
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
  max-width: 700px;
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
  margin-top: 100px!important;
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.3;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Details */
.detailsWrapper {
  /* Removed boxy background for modern look */
  background: transparent;
  padding: 0;
  margin-bottom: 24px;
  border: none;
}

.details {
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0,0,0,0.6);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Force all children to inherit white color to override rich text styles */
.details :global(*) {
  color: inherit !important;
  background: transparent !important; /* Ensure no background colors from rich text */
}

.details :global(p) {
  margin: 0;
}

.details :global(h2),
.details :global(h3) {
  margin: 0;
  font-size: inherit;
}

.details :global(ul),
.details :global(ol) {
  margin: 0;
  padding-right: 1.2em;
}

.details :global(a) {
  color: #C4A048;
  text-decoration: underline;
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

/* ==================== ADMIN CONTROLS ==================== */
.adminControls {
  position: absolute;
  top: 20px;
  left: 20px !important;
  right: auto !important;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.editBadge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #A17D23;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(161, 125, 35, 0.2);
  transition: all 0.3s ease;
}

.editBadge svg {
  color: #A17D23;
  flex-shrink: 0;
}

.slide.editable:hover .editBadge {
  background: #A17D23;
  color: white;
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(161, 125, 35, 0.3);
}

.slide.editable:hover .editBadge svg {
  color: white;
}

.deleteButton {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.deleteButton svg {
  flex-shrink: 0;
}

.deleteButton:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(220, 38, 38, 0.35);
}

.deleteButton:active {
  transform: scale(0.95);
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
    line-clamp: 3;
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

  .adminControls {
    top: 16px;
    left: 16px;
    gap: 8px;
  }

  .sliderContainer[dir="rtl"] .adminControls {
    left: auto;
    right: 16px;
  }

  .editBadge {
    padding: 8px 14px;
    font-size: 13px;
    border-radius: 10px;
  }

  .editBadge svg {
    width: 14px;
    height: 14px;
  }

  .deleteButton {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .deleteButton svg {
    width: 16px;
    height: 16px;
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

  .adminControls {
    top: 12px;
    left: 12px;
    gap: 6px;
  }

  .sliderContainer[dir="rtl"] .adminControls {
    left: auto;
    right: 12px;
  }

  .editBadge {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 8px;
    gap: 6px;
  }

  .editBadge svg {
    width: 12px;
    height: 12px;
  }

  .deleteButton {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .deleteButton svg {
    width: 14px;
    height: 14px;
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



.sliderContainer[data-theme="night"] .dot {
  background: #4a4a4a;
}

.sliderContainer[data-theme="night"] .dot:hover {
  background: #c9a84c;
}

.sliderContainer[data-theme="night"] .dot.active {
  background: #c9a84c;
}

.sliderContainer[data-theme="night"] .editBadge {
  background: rgba(30, 30, 30, 0.95);
  color: #c9a84c;
  border-color: rgba(201, 168, 76, 0.3);
}

.sliderContainer[data-theme="night"] .editBadge svg {
  color: #c9a84c;
}

.sliderContainer[data-theme="night"] .slide.editable:hover .editBadge {
  background: #c9a84c;
  color: #1e1e1e;
}

.sliderContainer[data-theme="night"] .slide.editable:hover .editBadge svg {
  color: #1e1e1e;
}

.sliderContainer[data-theme="night"] .deleteButton {
  background: rgba(30, 30, 30, 0.95);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.sliderContainer[data-theme="night"] .deleteButton:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
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
  background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.2) 70%, transparent 100%);
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

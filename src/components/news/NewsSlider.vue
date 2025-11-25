<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { fetchSliderNews } from '../../services/newsService'
import { useAuthenticatedImage } from '../../composables/useAuthenticatedImage'
import type { Newsletter } from '../../types/news.types'

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
    emit('view', item)
  }
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

const { blobUrl: currentImageBlobUrl, isLoading: imageLoading } = useAuthenticatedImage(currentImageUrl)

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
  <div :class="$style.sliderContainer">
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
            <span>📰</span>
          </div>
        </div>

        <!-- Content Overlay -->
        <div :class="$style.content">
          <h2 :class="$style.title">{{ currentSlide?.title }}</h2>
          <p :class="$style.details">{{ currentSlide?.details }}</p>
          <div :class="$style.meta">
            <span>{{ currentSlide?.author_name }}</span>
            <span>•</span>
            <span>{{ new Date(currentSlide?.created_at || '').toLocaleDateString() }}</span>
          </div>
        </div>

        <!-- Edit Indicator -->
        <div v-if="editable" :class="$style.editBadge">
          <span>✏️ Click to Edit</span>
        </div>

        <!-- Delete Button -->
        <button 
          v-if="editable" 
          :class="$style.deleteButton"
          @click="handleDelete(currentSlide!, $event)"
          title="Delete this slider"
        >
          <span>🗑️</span>
        </button>
      </div>

      <!-- Navigation Controls -->
      <div :class="$style.controls">
        <button 
          :class="$style.navButton" 
          @click.stop="prevSlide"
          aria-label="Previous slide"
        >
          ‹
        </button>

        <!-- Dots Indicator -->
        <div :class="$style.dots">
          <button
            v-for="(slide, index) in slides"
            :key="slide.id"
            :class="[$style.dot, { [$style.active]: index === currentIndex }]"
            @click.stop="goToSlide(index)"
            :aria-label="`Go to slide ${index + 1}`"
          ></button>
        </div>

        <button 
          :class="$style.navButton" 
          @click.stop="nextSlide"
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      <!-- Timer Indicator -->
      <div :class="$style.timerBar">
        <div 
          :class="$style.timerProgress" 
          :style="{ width: `${(remainingTime / 30) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else :class="$style.empty">
      <span>📰 No slider news available</span>
    </div>
  </div>
</template>

<style module>
.sliderContainer {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* ==================== SKELETON ==================== */
.skeleton {
  width: 100%;
  height: 500px;
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.skeletonImage {
  width: 100%;
  height: 70%;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeletonContent {
  padding: 24px;
}

.skeletonTitle {
  width: 60%;
  height: 32px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 16px;
}

.skeletonText {
  width: 100%;
  height: 16px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeletonText:last-child {
  width: 80%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ==================== SLIDER ==================== */
.slider {
  width: 100%;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.slide {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
  cursor: default;
}

.slide.editable {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.slide.editable:hover {
  transform: scale(1.02);
}

.imageWrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.imageSkeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 120px;
}

/* Content Overlay */
.content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  color: white;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.details {
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 12px 0;
  opacity: 0.95;
  max-width: 800px;
}

.meta {
  font-size: 14px;
  opacity: 0.8;
  display: flex;
  gap: 8px;
}

/* Edit Badge */
.editBadge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(251, 191, 36, 0.95);
  color: #1f2937;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Delete Button */
.deleteButton {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(220, 38, 38, 0.95);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 5;
}

.deleteButton:hover {
  background: #dc2626;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.deleteButton:active {
  transform: scale(0.95);
}

/* ==================== CONTROLS ==================== */
.controls {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.navButton {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 32px;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #1f2937;
}

.navButton:hover {
  background: white;
  transform: scale(1.1);
}

.navButton:active {
  transform: scale(0.95);
}

/* Dots */
.dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: scale(1.2);
}

.dot.active {
  background: white;
  width: 32px;
  border-radius: 6px;
}

/* ==================== TIMER BAR ==================== */
.timerBar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.timerProgress {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  transition: width 1s linear;
}

/* ==================== ERROR & EMPTY ==================== */
.error,
.empty {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 16px;
  font-size: 18px;
  color: #6b7280;
}

.error {
  background: #fee2e2;
  color: #dc2626;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .slide {
    height: 400px;
  }

  .content {
    padding: 20px;
  }

  .title {
    font-size: 24px;
  }

  .details {
    font-size: 14px;
  }

  .navButton {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { fetchNormalNews } from '../../services/newsService'
import AuthenticatedImage from './AuthenticatedImage.vue'
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
const newsList = ref<Newsletter[]>([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10

// Computed
const hasNews = computed(() => newsList.value.length > 0)
const hasMore = computed(() => currentPage.value < totalPages.value)

// Image loading state
const imageLoaded = ref<Record<number, boolean>>({})

const handleImageLoad = (newsId: number) => {
  imageLoaded.value[newsId] = true
}

const isImageLoaded = (newsId: number) => {
  return imageLoaded.value[newsId] === true
}

// Fetch news
const loadNews = async (page: number = 1, append: boolean = false) => {
  try {
    if (append) {
      isLoadingMore.value = true
    } else {
      isLoading.value = true
    }
    error.value = null

    const response = await fetchNormalNews({
      page,
      page_size: pageSize
    })

    if (response.status === 'success') {
      if (append) {
        newsList.value = [...newsList.value, ...response.data.results]
      } else {
        newsList.value = response.data.results
      }
      
      totalPages.value = response.data.total_pages
      currentPage.value = response.data.current_page
    }
  } catch (err: any) {
    console.error('Failed to load news:', err)
    error.value = 'Failed to load news. Please try again later.'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// Load more
const loadMore = async () => {
  if (hasMore.value && !isLoadingMore.value) {
    await loadNews(currentPage.value + 1, true)
  }
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

// Watch for refresh key changes
watch(() => props.refreshKey, () => {
  // Reset to page 1 and reload
  currentPage.value = 1
  imageLoaded.value = {}
  loadNews(1, false)
})

// Expose refresh method for parent components
defineExpose({
  refresh: () => loadNews(1, false)
})

// Lifecycle
onMounted(() => {
  loadNews(1)
})
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <h2 :class="$style.sectionTitle">Latest News</h2>
      <div :class="$style.divider"></div>
    </div>

    <!-- Loading State (Initial) -->
    <div v-if="isLoading && !hasNews" :class="$style.grid">
      <div 
        v-for="i in 6" 
        :key="i" 
        :class="$style.skeleton"
      >
        <div :class="$style.skeletonImage"></div>
        <div :class="$style.skeletonContent">
          <div :class="$style.skeletonTitle"></div>
          <div :class="$style.skeletonText"></div>
          <div :class="$style.skeletonText"></div>
          <div :class="$style.skeletonMeta"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.error">
      <span>⚠️ {{ error }}</span>
    </div>

    <!-- News Grid -->
    <div v-else-if="hasNews">
      <div :class="$style.grid">
        <article
          v-for="news in newsList"
          :key="news.id"
          :class="[$style.card, { [$style.editable]: editable }]"
          @click="handleEdit(news)"
        >
          <!-- Image -->
          <div :class="$style.imageWrapper">
            <div 
              v-if="!isImageLoaded(news.id)" 
              :class="$style.imageSkeleton"
            ></div>
            <AuthenticatedImage
              v-if="news.main_image"
              :src="news.main_image.download_url"
              :alt="news.title"
              :class="$style.image"
              @load="handleImageLoad(news.id)"
              @error="handleImageLoad(news.id)"
            />
            <div v-else :class="$style.noImage">
              <span>📰</span>
            </div>

            <!-- Edit Badge -->
            <div v-if="editable" :class="$style.editBadge">
              ✏️
            </div>

            <!-- Delete Button -->
            <button 
              v-if="editable" 
              :class="$style.deleteButton"
              @click="handleDelete(news, $event)"
              title="Delete this news"
            >
              <span>🗑️</span>
            </button>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <h3 :class="$style.title">{{ news.title }}</h3>
            <p :class="$style.details">{{ news.details }}</p>
            <div :class="$style.meta">
              <span :class="$style.author">{{ news.author_name }}</span>
              <span :class="$style.dot">•</span>
              <span :class="$style.date">
                {{ new Date(news.created_at).toLocaleDateString() }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" :class="$style.loadMoreContainer">
        <button 
          :class="$style.loadMoreButton"
          @click="loadMore"
          :disabled="isLoadingMore"
        >
          <span v-if="!isLoadingMore">Load More</span>
          <span v-else>Loading...</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else :class="$style.empty">
      <span>📰 No news available</span>
    </div>
  </div>
</template>

<style module>
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 0;
}

/* ==================== HEADER ==================== */
.header {
  margin-bottom: 32px;
}

.sectionTitle {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.divider {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 2px;
}

/* ==================== GRID ==================== */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* ==================== SKELETON ==================== */
.skeleton {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skeletonImage {
  width: 100%;
  height: 220px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeletonContent {
  padding: 20px;
}

.skeletonTitle {
  width: 80%;
  height: 24px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeletonText {
  width: 100%;
  height: 14px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeletonText:last-of-type {
  width: 90%;
}

.skeletonMeta {
  width: 50%;
  height: 12px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-top: 16px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ==================== CARD ==================== */
.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: default;
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.card.editable {
  cursor: pointer;
}

.card.editable:hover {
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
  border: 2px solid #fbbf24;
}

/* Image */
.imageWrapper {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  background: #f3f4f6;
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
  transition: transform 0.3s ease;
}

.card:hover .image {
  transform: scale(1.05);
}

.noImage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 64px;
}

/* Edit Badge */
.editBadge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(251, 191, 36, 0.95);
  color: #1f2937;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Delete Button */
.deleteButton {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(220, 38, 38, 0.95);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 5;
}

.deleteButton:hover {
  background: #dc2626;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.deleteButton:active {
  transform: scale(0.95);
}

/* Content */
.content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.details {
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0 0 16px 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9ca3af;
  margin-top: auto;
}

.author {
  font-weight: 500;
  color: #6b7280;
}

.dot {
  opacity: 0.6;
}

.date {
  opacity: 0.8;
}

/* ==================== LOAD MORE ==================== */
.loadMoreContainer {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.loadMoreButton {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border: none;
  padding: 14px 40px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.loadMoreButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4);
}

.loadMoreButton:active {
  transform: translateY(0);
}

.loadMoreButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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
  border-radius: 12px;
  font-size: 18px;
  color: #6b7280;
}

.error {
  background: #fee2e2;
  color: #dc2626;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .sectionTitle {
    font-size: 24px;
  }
}
</style>

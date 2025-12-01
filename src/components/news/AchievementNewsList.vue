<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { fetchAchievementNews } from '../../services/newsService'
import AuthenticatedImage from './AuthenticatedImage.vue'
import type { Newsletter } from '../../types/news.types'
import { useRouter } from 'vue-router'

interface Props {
  editable?: boolean
  refreshKey?: number
}
const router = useRouter()

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
const MOCK_ACHIEVEMENTS_DATA: Newsletter[] = [
  {
    id: 201,
    title: 'تخطي 10,000 مستخدم نشط',
    details: 'نفخر بالإعلان عن تجاوز عدد المستخدمين النشطين على المنصة 10,000 مستخدم. شكراً لثقتكم!',
    author: 1,
    author_name: 'فريق التطوير',
    news_type: 'ACHIEVEMENT',
    position: 1,
    created_at: '2025-11-29T12:00:00Z',
    updated_at: '2025-11-29T12:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 202,
    title: 'جائزة أفضل منصة استبيانات 2025',
    details: 'حصلت منصتنا على جائزة أفضل منصة استبيانات لعام 2025 من مؤسسة التقنية العربية.',
    author: 2,
    author_name: 'إدارة المنصة',
    news_type: 'ACHIEVEMENT',
    position: 2,
    created_at: '2025-11-25T09:00:00Z',
    updated_at: '2025-11-25T09:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 203,
    title: 'إنجاز مليون استجابة',
    details: 'تم جمع أكثر من مليون استجابة على الاستبيانات المنشورة عبر المنصة منذ إطلاقها.',
    author: 3,
    author_name: 'قسم الإحصائيات',
    news_type: 'ACHIEVEMENT',
    position: 3,
    created_at: '2025-11-20T15:30:00Z',
    updated_at: '2025-11-20T15:30:00Z',
    images: [],
    main_image: null
  },
  {
    id: 204,
    title: 'شراكة استراتيجية جديدة',
    details: 'أعلنا عن شراكة استراتيجية مع كبرى المؤسسات الحكومية لتوفير خدمات الاستبيانات الإلكترونية.',
    author: 4,
    author_name: 'العلاقات العامة',
    news_type: 'ACHIEVEMENT',
    position: 4,
    created_at: '2025-11-15T10:00:00Z',
    updated_at: '2025-11-15T10:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 205,
    title: 'توسع إقليمي ناجح',
    details: 'نجحنا في التوسع إلى 5 دول جديدة في منطقة الخليج العربي خلال العام الماضي.',
    author: 5,
    author_name: 'قسم التوسع',
    news_type: 'ACHIEVEMENT',
    position: 5,
    created_at: '2025-11-10T14:00:00Z',
    updated_at: '2025-11-10T14:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 206,
    title: '99.9% وقت تشغيل',
    details: 'حققنا نسبة وقت تشغيل 99.9% طوال العام مما يعكس التزامنا بتوفير خدمة موثوقة.',
    author: 6,
    author_name: 'الفريق التقني',
    news_type: 'ACHIEVEMENT',
    position: 6,
    created_at: '2025-11-05T11:00:00Z',
    updated_at: '2025-11-05T11:00:00Z',
    images: [],
    main_image: null
  }
]
const USE_MOCK_DATA = true // ← Set to false when server is ready
// ============ END MOCK DATA ============

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

    // ============ USE MOCK DATA ============
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
      newsList.value = MOCK_ACHIEVEMENTS_DATA
      totalPages.value = 1
      currentPage.value = 1
      return
    }
    // ============ END MOCK DATA ============

    const response = await fetchAchievementNews({
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
    console.error('Failed to load achievements:', err)
    error.value = 'Failed to load achievements. Please try again later.'
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

// Handle card click - navigate to details
const handleCardClick = (item: Newsletter) => {
  if (props.editable) {
    emit('edit', item)
  } else {
    // Navigate to news details page
    router.push({ name: 'news-details', params: { id: item.id } })
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
// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  if (isRTL.value) {
    return date.toLocaleDateString('ar-SA', {
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

</script>

<template>
  <div :class="$style.container" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Section Header -->
    <div :class="$style.header">
      <div :class="$style.headerContent">
        <h2 :class="$style.sectionTitle">{{ isRTL ? 'آخر الإنجازات' : 'Latest News' }}</h2>
        <p :class="$style.sectionDescription">
          {{ isRTL 
            ? 'أحدث إنجازات الشركة والفريق' 
            : 'Stay updated with the latest news, developments and important announcements' 
          }}
        </p>
      </div>
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
          @click="handleCardClick(news)"
        >
          <!-- Image -->
          <div :class="$style.imageWrapper">
            <AuthenticatedImage
              v-if="news.main_image"
              :src="news.main_image.download_url"
              :alt="news.title"
              :class="$style.image"
            />
            <img 
              v-else 
              src="/Test1.jpg" 
              :alt="news.title"
              :class="$style.image"
            />

            <!-- Badge -->
            <div :class="$style.typeBadge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>{{ isRTL ? 'تقنية' : 'Technology' }}</span>
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
              :title="isRTL ? 'حذف' : 'Delete this news'"
            >
              <span>🗑️</span>
            </button>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <!-- Title -->
            <h3 :class="$style.title">{{ news.title }}</h3>
            
            <!-- Description -->
            <p :class="$style.details">{{ news.details }}</p>
            
            <!-- Meta Info -->
            <div :class="$style.meta">
             
              <div :class="$style.metaItem">
               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_436_24256)">
<path d="M5.33203 1.33203V3.9987" stroke="#A17D23" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10.668 1.33203V3.9987" stroke="#A17D23" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.6667 2.66797H3.33333C2.59695 2.66797 2 3.26492 2 4.0013V13.3346C2 14.071 2.59695 14.668 3.33333 14.668H12.6667C13.403 14.668 14 14.071 14 13.3346V4.0013C14 3.26492 13.403 2.66797 12.6667 2.66797Z" stroke="#A17D23" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2 6.66797H14" stroke="#A17D23" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_436_24256">
<rect width="16" height="16" fill="white"/>
</clipPath>
</defs>
</svg>

                <span>{{ formatDate(news.created_at) }}</span>
              </div>
               <div :class="$style.metaItem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6654 14V12.6667C12.6654 11.9594 12.3844 11.2811 11.8843 10.781C11.3842 10.281 10.7059 10 9.9987 10H5.9987C5.29145 10 4.61318 10.281 4.11308 10.781C3.61298 11.2811 3.33203 11.9594 3.33203 12.6667V14" stroke="#A17D23" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.9987 7.33333C9.47146 7.33333 10.6654 6.13943 10.6654 4.66667C10.6654 3.19391 9.47146 2 7.9987 2C6.52594 2 5.33203 3.19391 5.33203 4.66667C5.33203 6.13943 6.52594 7.33333 7.9987 7.33333Z" stroke="#A17D23" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                <span>{{ news.author_name }}</span>
              </div>
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
          <span v-if="!isLoadingMore">{{ isRTL ? 'تحميل المزيد' : 'Load More' }}</span>
          <span v-else>{{ isRTL ? 'جاري التحميل...' : 'Loading...' }}</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else :class="$style.empty">
      <span>{{ isRTL ? '📰 لا توجد أخبار متاحة' : '📰 No news available' }}</span>
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

/* ==================== HEADER ==================== */
.header {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.headerContent {
  margin-bottom: 16px;
  text-align: left;
}

.sectionTitle {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
}

.sectionDescription {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.divider {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #A17D23, #C4A048);
  border-radius: 2px;
  margin: 0;
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

/* Type Badge */
.typeBadge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #A17D23;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.container[dir="ltr"] .typeBadge {
  right: auto;
  left: 16px;
}

/* Content */
.content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #A17D23;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.details {
  font-size: 15px;
  line-height: 1.7;
  color: #4b5563;
  margin: 0 0 20px 0;
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
  justify-content: space-between;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
}

.metaItem {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.metaItem svg {
  color: #9ca3af;
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

@media (max-width: 480px) {
  .container {
    padding: 24px 0;
  }

  .imageWrapper {
    height: 180px;
  }

  .content {
    padding: 16px;
  }

  .title {
    font-size: 18px;
  }
}

/* ==================== DARK MODE ==================== */
.container[data-theme="night"] .skeleton {
  background: #2d2d2d;
}

.container[data-theme="night"] .skeletonImage,
.container[data-theme="night"] .skeletonTitle,
.container[data-theme="night"] .skeletonText,
.container[data-theme="night"] .skeletonMeta {
  background: linear-gradient(90deg, #3d3d3d 25%, #4d4d4d 50%, #3d3d3d 75%);
  background-size: 200% 100%;
}

.container[data-theme="night"] .sectionTitle {
  color: #f5f5f5;
}

.container[data-theme="night"] .sectionDescription {
  color: #a0a0a0;
}

.container[data-theme="night"] .card {
  background: #2d2d2d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.container[data-theme="night"] .card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.container[data-theme="night"] .card.editable:hover {
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.2);
  border-color: #c9a84c;
}

.container[data-theme="night"] .imageWrapper {
  background: #3d3d3d;
}

.container[data-theme="night"] .imageSkeleton {
  background: linear-gradient(90deg, #3d3d3d 25%, #4d4d4d 50%, #3d3d3d 75%);
  background-size: 200% 100%;
}

.container[data-theme="night"] .noImage {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
}

.container[data-theme="night"] .typeBadge {
  background: #c9a84c;
}

.container[data-theme="night"] .title {
  color: #c9a84c;
}

.container[data-theme="night"] .details {
  color: #b0b0b0;
}

.container[data-theme="night"] .meta {
  border-top-color: #404040;
}

.container[data-theme="night"] .metaItem {
  color: #a0a0a0;
}

.container[data-theme="night"] .metaItem svg {
  color: #707070;
}

.container[data-theme="night"] .loadMoreButton {
  background: linear-gradient(135deg, #c9a84c 0%, #b8976c 100%);
  box-shadow: 0 4px 12px rgba(201, 168, 76, 0.2);
}

.container[data-theme="night"] .loadMoreButton:hover {
  box-shadow: 0 6px 16px rgba(201, 168, 76, 0.3);
}

.container[data-theme="night"] .error,
.container[data-theme="night"] .empty {
  background: #2d2d2d;
  color: #a0a0a0;
}

.container[data-theme="night"] .error {
  background: #4a1c1c;
  color: #f87171;
}

/* ==================== RTL SUPPORT ==================== */
.container[dir="rtl"] .header {
  align-items: flex-start;
}

.container[dir="rtl"] .headerContent {
  text-align: right;
}

.container[dir="ltr"] .header {
  align-items: flex-start;
}

.container[dir="ltr"] .headerContent {
  text-align: left;
}

.container[dir="rtl"] .meta {
  direction: rtl;
}

.container[dir="rtl"] .editBadge {
  right: auto;
  left: 12px;
}

.container[dir="rtl"] .deleteButton {
  left: auto;
  right: 12px;
}
</style>

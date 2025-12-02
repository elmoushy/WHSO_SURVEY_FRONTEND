<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { fetchNormalNews } from '../../services/newsService'
import AuthenticatedImage from './AuthenticatedImage.vue'
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

// ============ MOCK DATA - DELETE WHEN SERVER IS READY ============
const MOCK_NEWS_DATA: Newsletter[] = [
  {
    id: 101,
    title: 'تحديثات جديدة في نظام إدارة المستخدمين',
    details: 'تم إضافة ميزات جديدة لإدارة المستخدمين تشمل التحكم في الصلاحيات وإضافة مجموعات العمل. يمكنك الآن تخصيص الوصول لكل مستخدم بشكل منفصل.',
    author: 1,
    author_name: 'أحمد محمود',
    news_type: 'NORMAL',
    position: 1,
    created_at: '2025-11-30T08:00:00Z',
    updated_at: '2025-11-30T08:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 102,
    title: 'دليل استخدام الاستبيانات المتقدمة',
    details: 'تعرف على كيفية إنشاء استبيانات متقدمة مع أنواع أسئلة متعددة وتفريعات منطقية.',
    author: 2,
    author_name: 'فاطمة الزهراء',
    news_type: 'NORMAL',
    position: 2,
    created_at: '2025-11-28T14:00:00Z',
    updated_at: '2025-11-28T14:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 103,
    title: 'نصائح لزيادة معدل الاستجابة',
    details: 'اكتشف أفضل الممارسات لتصميم استبيانات تحقق معدلات استجابة عالية من المشاركين.',
    author: 3,
    author_name: 'خالد العتيبي',
    news_type: 'NORMAL',
    position: 3,
    created_at: '2025-11-25T10:30:00Z',
    updated_at: '2025-11-25T10:30:00Z',
    images: [],
    main_image: null
  },
  {
    id: 104,
    title: 'تكامل API الجديد',
    details: 'أصبح بإمكانك الآن ربط النظام مع تطبيقاتك الخارجية عبر واجهة برمجة التطبيقات الجديدة.',
    author: 4,
    author_name: 'نورة السالم',
    news_type: 'NORMAL',
    position: 4,
    created_at: '2025-11-22T16:45:00Z',
    updated_at: '2025-11-22T16:45:00Z',
    images: [],
    main_image: null
  },
  {
    id: 105,
    title: 'ورشة عمل تحليل البيانات',
    details: 'انضم إلينا في ورشة العمل المجانية لتعلم كيفية تحليل نتائج الاستبيانات واستخراج رؤى قيمة.',
    author: 5,
    author_name: 'يوسف الحربي',
    news_type: 'NORMAL',
    position: 5,
    created_at: '2025-11-20T09:00:00Z',
    updated_at: '2025-11-20T09:00:00Z',
    images: [],
    main_image: null
  },
  {
    id: 106,
    title: 'تحسينات الأداء والسرعة',
    details: 'قمنا بتحسين أداء النظام بشكل كبير مما يجعل تجربة المستخدم أسرع وأكثر سلاسة.',
    author: 1,
    author_name: 'أحمد محمود',
    news_type: 'NORMAL',
    position: 6,
    created_at: '2025-11-18T11:20:00Z',
    updated_at: '2025-11-18T11:20:00Z',
    images: [],
    main_image: null
  }
]
const USE_MOCK_DATA = false // Backend is ready
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
      newsList.value = MOCK_NEWS_DATA
      totalPages.value = 1
      currentPage.value = 1
      return
    }
    // ============ END MOCK DATA ============

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

// Handle card click - navigate to details
const handleCardClick = (item: Newsletter) => {
  if (props.editable) {
    emit('edit', item)
  } else {
    // Navigate to news details page with news_type
    router.push({ name: 'news-details', params: { id: item.id }, query: { type: item.news_type } })
  }
}

// Handle delete click
const handleDelete = (item: Newsletter, event: Event) => {
  if (props.editable) {
    event.stopPropagation() // Prevent triggering edit
    emit('delete', item)
  }
}

// Truncate HTML content while preserving tags
const truncateHtml = (html: string | undefined, maxLength: number = 120): string => {
  if (!html) return ''
  
  // Create a temporary element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
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

// Format date
const formatDate = (dateStr: string) => {
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

// Watch for refresh key changes
watch(() => props.refreshKey, () => {
  // Reset to page 1 and reload
  currentPage.value = 1
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
  <div :class="$style.container" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Section Header -->
    <div :class="$style.header">
      <div :class="$style.headerContent">
        <h2 :class="$style.sectionTitle">{{ isRTL ? 'آخر الأخبار' : 'Latest News' }}</h2>
        <p :class="$style.sectionDescription">
          {{ isRTL 
            ? 'تابع أحدث الأخبار والتطورات والإعلانات المهمة' 
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

            <!-- Admin Controls -->
            <div v-if="editable" :class="$style.adminControls" :style="{ left: '12px', right: 'auto' }">
              <!-- Edit Badge -->
              <div :class="$style.editBadge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>

              <!-- Delete Button -->
              <button 
                :class="$style.deleteButton"
                @click="handleDelete(news, $event)"
                :title="isRTL ? 'حذف' : 'Delete this news'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <!-- Title -->
            <h3 :class="$style.title">{{ news.title }}</h3>
            
            <!-- Description -->
            <div :class="$style.details" v-html="truncateHtml(news.details, 120)"></div>
            
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

/* Admin Controls */
.adminControls {
  position: absolute;
  top: 12px;
  left: 12px !important;
  right: auto !important;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

/* Edit Badge */
.editBadge {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #A17D23;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(161, 125, 35, 0.2);
  transition: all 0.3s ease;
}

.editBadge svg {
  color: #A17D23;
}

.card.editable:hover .editBadge {
  background: #A17D23;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(161, 125, 35, 0.3);
}

.card.editable:hover .editBadge svg {
  color: white;
}

/* Delete Button */
.deleteButton {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.deleteButton svg {
  color: #dc2626;
}

.deleteButton:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
  transform: scale(1.08);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35);
}

.deleteButton:hover svg {
  color: white;
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
  color: #A17D23;
  text-decoration: underline;
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

/* Dark mode admin controls */
.container[data-theme="night"] .adminControls .editBadge {
  background: rgba(30, 30, 30, 0.95);
  color: #c9a84c;
  border-color: rgba(201, 168, 76, 0.3);
}

.container[data-theme="night"] .adminControls .editBadge svg {
  color: #c9a84c;
}

.container[data-theme="night"] .card.editable:hover .editBadge {
  background: #c9a84c;
  color: #1e1e1e;
}

.container[data-theme="night"] .card.editable:hover .editBadge svg {
  color: #1e1e1e;
}

.container[data-theme="night"] .adminControls .deleteButton {
  background: rgba(30, 30, 30, 0.95);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.container[data-theme="night"] .adminControls .deleteButton svg {
  color: #ef4444;
}

.container[data-theme="night"] .adminControls .deleteButton:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.container[data-theme="night"] .adminControls .deleteButton:hover svg {
  color: white;
}
</style>

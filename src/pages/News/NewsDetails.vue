<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import type { Newsletter, NewsType } from '../../types/news.types'
import { fetchSliderNewsDetail, fetchNormalNewsDetail } from '../../services/newsService'
import AuthenticatedImage from '../../components/AuthenticatedImage.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

// State
const newsItem = ref<Newsletter | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Gallery state
const selectedImageIndex = ref(0)
const showLightbox = ref(false)

// Computed
const newsId = computed(() => Number(route.params.id))

const allImages = computed(() => {
  if (!newsItem.value?.images) return []
  return newsItem.value.images
})

const currentLightboxImage = computed(() => {
  return allImages.value[selectedImageIndex.value]
})

const newsTypeLabel = computed(() => {
  if (!newsItem.value) return ''
  const types: Record<string, { ar: string; en: string }> = {
    'SLIDER': { ar: 'تقنية', en: 'Technology' },
    'NORMAL': { ar: 'أخبار', en: 'News' },
    'ACHIEVEMENT': { ar: 'إنجاز', en: 'Achievement' }
  }
  return types[newsItem.value.news_type]?.[isRTL.value ? 'ar' : 'en'] || newsItem.value.news_type
})

// Methods
const goBack = () => {
  router.push({ name: 'News' })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (isRTL.value) {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const openLightbox = (index: number) => {
  selectedImageIndex.value = index
  showLightbox.value = true
}

const closeLightbox = () => {
  showLightbox.value = false
}

const nextImage = () => {
  selectedImageIndex.value = (selectedImageIndex.value + 1) % allImages.value.length
}

const prevImage = () => {
  selectedImageIndex.value = (selectedImageIndex.value - 1 + allImages.value.length) % allImages.value.length
}

// Get news type from query params (defaults to SLIDER)
const newsType = computed(() => (route.query.type as NewsType) || 'SLIDER')

// Load news
const loadNews = async () => {
  try {
    isLoading.value = true
    error.value = null

    let response: any
    
    // Fetch based on news type
    if (newsType.value === 'SLIDER') {
      response = await fetchSliderNewsDetail(newsId.value)
    } else {
      // NORMAL and ACHIEVEMENT use the normal news endpoint
      response = await fetchNormalNewsDetail(newsId.value)
    }

    // Handle both wrapped response { status, data } and direct response formats
    if (response.status === 'success' && response.data) {
      newsItem.value = response.data
    } else if (response.id) {
      // Backend returns data directly without wrapper
      newsItem.value = response as Newsletter
    } else {
      error.value = isRTL.value ? 'فشل في تحميل الخبر' : 'Failed to load news'
    }
  } catch (err) {
    console.error('Error loading news:', err)
    error.value = isRTL.value ? 'حدث خطأ أثناء تحميل الخبر' : 'Error loading news'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadNews()
})
</script>

<template>
  <div :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.container">
      <!-- Breadcrumb -->
      <nav :class="$style.breadcrumb">
        <span :class="$style.breadcrumbLink" @click="goBack">{{ isRTL ? 'الأخبار والإنجازات' : 'News & Achievements' }}</span>
        <span :class="$style.breadcrumbSeparator">/</span>
        <span :class="$style.breadcrumbLink" @click="goBack">{{ isRTL ? 'الأخبار' : 'News' }}</span>
        <span :class="$style.breadcrumbSeparator">/</span>
        <span :class="$style.breadcrumbCurrent">{{ newsItem?.title }}</span>
      </nav>

      <!-- Back Button -->
      <button :class="$style.backButton" @click="goBack">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8l-4 4 4 4M16 12H8"/>
        </svg>
        {{ isRTL ? 'العودة الى الاخبار' : 'Back to News' }}
      </button>

      <!-- Loading State -->
      <div v-if="isLoading" :class="$style.loading">
        <div :class="$style.spinner"></div>
        <span>{{ isRTL ? 'جاري التحميل...' : 'Loading...' }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="$style.error">
        <span>⚠️ {{ error }}</span>
        <button @click="loadNews">{{ isRTL ? 'إعادة المحاولة' : 'Retry' }}</button>
      </div>

      <!-- Content -->
      <article v-else-if="newsItem" :class="$style.article">
        
        <div :class="$style.articleContent">
        <!-- Main Image -->
        <div :class="$style.mainImageWrapper">
          <AuthenticatedImage
            v-if="newsItem.main_image"
            :src="newsItem.main_image.download_url"
            :alt="newsItem.title"
            :class="$style.mainImage"
            :version="newsItem.updated_at"
          />
          <!-- Badge -->
          <div :class="$style.badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
            </svg>
            <span>{{ newsTypeLabel }}</span>
          </div>
        </div>

        <!-- Title -->
        <h1 :class="$style.title">{{ newsItem.title }}</h1>

        <!-- Meta Info -->
        <div :class="$style.meta">

          <div :class="$style.metaItem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div :class="$style.metaText">
              <span :class="$style.metaLabel">{{ isRTL ? 'الكاتب' : 'Author' }}</span>
              <span :class="$style.metaValue">{{ newsItem.author_name }}</span>
            </div>
          </div>

          <div :class="$style.metaItem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div :class="$style.metaText">
              <span :class="$style.metaLabel">{{ isRTL ? 'تاريخ النشر' : 'Published' }}</span>
              <span :class="$style.metaValue">{{ formatDate(newsItem.created_at) }}</span>
            </div>
          </div>
        </div>
          
        </div>

        <div :class="$style.articleContent">

        <!-- Content -->
        <div :class="$style.content" v-html="newsItem.details"></div>

        <!-- Image Gallery -->
        <section v-if="allImages.length > 0" :class="$style.gallery">
          <h2 :class="$style.galleryTitle">
            <span :class="$style.galleryTitleBar"></span>
            {{ isRTL ? 'معرض الصور' : 'Image Gallery' }}
          </h2>

          <div :class="$style.galleryGrid">
            <div 
              v-for="(image, index) in allImages" 
              :key="image.id" 
              :class="[$style.galleryItem, { [$style.galleryItemLarge]: index === 0 }]"
              @click="openLightbox(index)"
            >
              <AuthenticatedImage
                :src="image.download_url"
                :alt="`Image ${index + 1}`"
                :class="$style.galleryImage"
                :version="image.uploaded_at"
              />
              <div :class="$style.galleryOverlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                  <path d="M11 8v6M8 11h6"/>
                </svg>
              </div>
            </div>
          </div>
        </section>
        </div>

      </article>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="showLightbox" :class="$style.lightbox" @click.self="closeLightbox">
          <button :class="$style.lightboxClose" @click="closeLightbox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <button v-if="allImages.length > 1" :class="[$style.lightboxNav, $style.lightboxPrev]" @click="prevImage">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <AuthenticatedImage
            v-if="currentLightboxImage"
            :src="currentLightboxImage.download_url"
            :alt="`Image ${selectedImageIndex + 1}`"
            :class="$style.lightboxImage"
            :version="currentLightboxImage.uploaded_at"
          />

          <button v-if="allImages.length > 1" :class="[$style.lightboxNav, $style.lightboxNext]" @click="nextImage">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <div :class="$style.lightboxCounter">
            {{ selectedImageIndex + 1 }} / {{ allImages.length }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style module>
.page {
  padding: 32px 24px;
}



/* ==================== BREADCRUMB ==================== */
.breadcrumb {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.breadcrumbLink {
  color: #A17D23;
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 500;
}

.breadcrumbLink:hover {
  color: #8a6b1e;
  text-decoration: underline;
}

.breadcrumbSeparator {
  color: #9ca3af;
}

.breadcrumbCurrent {
  color: #374151;
  font-weight: 400;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==================== BACK BUTTON ==================== */
.backButton {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: 1.5px solid #d1d5db;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;
}

.backButton:hover {
  background: #f3f4f6;
  border-color: #A17D23;
  color: #A17D23;
}

.backButton svg {
  color: #A17D23;
}

/* ==================== LOADING & ERROR ==================== */
.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #A17D23;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #dc2626;
}

.error button {
  background: #A17D23;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
}

/* ==================== ARTICLE ==================== */
.article{
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.articleContent{
    border-radius: 20px;
    padding: 10px;
  background-color: white;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);

}

/* ==================== MAIN IMAGE ==================== */
.mainImageWrapper {
  position: relative;
  width: 100%;
  height: 450px;
  overflow: hidden;
  margin: 24px;
  margin-bottom: 0;
  width: calc(100% - 48px);
  border-radius: 16px;
}

.mainImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(161, 125, 35, 0.95);
  color: white;
  padding: 10px 18px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.page[dir="ltr"] .badge {
  right: auto;
  left: 20px;
}

/* ==================== TITLE ==================== */
.title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  padding: 40px 40px 32px;
  line-height: 1.5;
  text-align: right;
}

/* ==================== META ==================== */
.meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: start;
  gap: 40px;
  padding: 0 40px 40px;
  /* border-bottom: 1px solid #e5e7eb; */
  /* margin: 0 40px; */
}

.metaItem {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metaItem svg {
  color: #A17D23;
  flex-shrink: 0;
}

.metaText {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metaLabel {
  font-size: 12px;
  color: #9ca3af;
}

.metaValue {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* ==================== CONTENT ==================== */
.content {
  padding: 40px;
  text-align: right;
  font-size: 16px;
  line-height: 2;
  color: #374151;
}

.content :global(p) {
  margin: 0 0 16px;
}

.content :global(p:last-child) {
  margin-bottom: 0;
}

.content :global(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 24px 0 16px;
  color: #1f2937;
}

.content :global(h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 20px 0 12px;
  color: #1f2937;
}

.content :global(ul),
.content :global(ol) {
  margin: 0 0 16px;
  padding-right: 1.5em;
}

.content :global(li) {
  margin: 4px 0;
}

.content :global(blockquote) {
  border-right: 4px solid #A17D23;
  padding-right: 16px;
  margin: 16px 0;
  font-style: italic;
  color: #4b5563;
}

.content :global(a) {
  color: #A17D23;
  text-decoration: underline;
}

.content :global(a:hover) {
  color: #C4A048;
}

.paragraph {
  font-size: 16px;
  line-height: 2;
  color: #374151;
  margin: 0 0 24px;
}

.paragraph:last-child {
  margin-bottom: 0;
}

.bulletList {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.bulletList li {
  font-size: 16px;
  line-height: 2;
  color: #374151;
  padding-right: 20px;
  position: relative;
}

.bulletList li::before {
  content: '-';
  position: absolute;
  right: 0;
  color: #374151;
}

.page[dir="ltr"] .bulletList li {
  padding-right: 0;
  padding-left: 20px;
}

.page[dir="ltr"] .bulletList li::before {
  right: auto;
  left: 0;
}

/* ==================== GALLERY ==================== */
.gallery {
  padding: 40px;
  border-top: 1px solid #e5e7eb;
  margin: 0 40px;
}

.galleryTitle {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 32px;
}

.galleryTitleBar {
  width: 4px;
  height: 24px;
  background: #A17D23;
  border-radius: 2px;
  order: 1;
}

.page[dir="ltr"] .galleryTitle {
  justify-content: flex-start;
}

.page[dir="ltr"] .galleryTitleBar {
  order: -1;
}

.galleryGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
}

.galleryItem {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 16/10;
}

.galleryItemLarge {
  grid-row: span 2;
  aspect-ratio: auto;
}

.galleryImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.galleryItem:hover .galleryImage {
  transform: scale(1.05);
}

.galleryOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
}

.galleryItem:hover .galleryOverlay {
  opacity: 1;
}

/* ==================== LIGHTBOX ==================== */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lightboxClose {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lightboxClose:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightboxNav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lightboxNav:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightboxPrev {
  left: 20px;
}

.lightboxNext {
  right: 20px;
}

.lightboxImage {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.lightboxCounter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

/* ==================== DARK MODE ==================== */
.page[data-theme="night"] {
  background: #121212;
}

.page[data-theme="night"] .breadcrumbCurrent {
  color: #e5e7eb;
}

.page[data-theme="night"] .backButton {
  background: transparent;
  border-color: #404040;
  color: #e5e7eb;
}

.page[data-theme="night"] .backButton:hover {
  background: #2d2d2d;
  border-color: #c9a84c;
  color: #c9a84c;
}

.page[data-theme="night"] .article {
  background: #1e1e1e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.page[data-theme="night"] .title {
  color: #f5f5f5;
}

.page[data-theme="night"] .meta {
  border-bottom-color: #404040;
}

.page[data-theme="night"] .metaLabel {
  color: #707070;
}

.page[data-theme="night"] .metaValue {
  color: #e5e7eb;
}

.page[data-theme="night"] .content {
  color: #d1d5db;
}

.page[data-theme="night"] .content :global(h2),
.page[data-theme="night"] .content :global(h3) {
  color: #f5f5f5;
}

.page[data-theme="night"] .content :global(blockquote) {
  color: #9ca3af;
}

.page[data-theme="night"] .paragraph,
.page[data-theme="night"] .bulletList li {
  color: #d1d5db;
}

.page[data-theme="night"] .gallery {
  border-top-color: #404040;
}

.page[data-theme="night"] .galleryTitle {
  color: #f5f5f5;
}

/* ==================== RTL ==================== */
.page[dir="ltr"] .content {
  text-align: left;
}

.page[dir="ltr"] .content :global(ul),
.page[dir="ltr"] .content :global(ol) {
  padding-right: 0;
  padding-left: 1.5em;
}

.page[dir="ltr"] .content :global(blockquote) {
  border-right: none;
  border-left: 4px solid #A17D23;
  padding-right: 0;
  padding-left: 16px;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .mainImageWrapper {
    height: 280px;
    margin: 16px;
    width: calc(100% - 32px);
  }

  .title {
    font-size: 24px;
    padding: 24px 20px 20px;
  }

  .meta {
    padding: 0 20px 24px;
    gap: 20px;
    margin: 0 20px;
  }

  .content,
  .gallery {
    padding: 24px 20px;
    margin: 0 20px;
  }

  .galleryGrid {
    grid-template-columns: 1fr;
  }

  .galleryItemLarge {
    grid-row: span 1;
  }
}

@media (max-width: 480px) {
  .mainImageWrapper {
    height: 220px;
  }

  .title {
    font-size: 20px;
  }

  .metaItem {
    width: 100%;
    justify-content: center;
  }

  .breadcrumb {
    justify-content: center;
  }
}

/* ==================== TRANSITIONS ==================== */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>

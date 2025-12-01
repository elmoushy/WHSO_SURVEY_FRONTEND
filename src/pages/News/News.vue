<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import NewsSlider from '../../components/news/NewsSlider.vue'
import NormalNewsList from '../../components/news/NormalNewsList.vue'
import AchievementNewsList from '../../components/news/AchievementNewsList.vue'
import NewsDetailModal from '../../components/news/NewsDetailModal.vue'
import type { Newsletter } from '../../types/news.types'

// Store
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)

// RTL support
const isRTL = computed(() => currentLanguage.value === 'ar')

// Detail modal state
const showDetailModal = ref(false)
const selectedNews = ref<Newsletter | null>(null)

// Handle view click
const handleViewNews = (item: Newsletter) => {
  selectedNews.value = item
  showDetailModal.value = true
}

// Close detail modal
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedNews.value = null
}
</script>

<template>
  <div :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.container">
      <!-- Page Header -->
      <header :class="$style.pageHeader">
        <h1 :class="$style.pageTitle">{{ isRTL ? 'الاخبار والإنجازات' : 'News & Achievements' }}</h1>
      </header>

      <!-- Slider Section -->
      <section :class="$style.sliderSection">
        <NewsSlider :editable="false" @view="handleViewNews" />
      </section>

      <!-- Normal News Section -->
      <section :class="$style.newsSection">
        <NormalNewsList :editable="false" @view="handleViewNews" />
      </section>

      <!-- Achievements Section -->
      <section :class="$style.achievementsSection">
        <AchievementNewsList :editable="false" @view="handleViewNews" />
      </section>
    </div>

    <!-- Detail Modal -->
    <NewsDetailModal 
      :show="showDetailModal"
      :news-item="selectedNews"
      @close="closeDetailModal"
    />
  </div>
</template>

<style module>
.page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
  padding: 32px 20px;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Dark Mode */
.page[data-theme="night"] {
  background: linear-gradient(to bottom, #1a1a1a, #0f0f0f);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ==================== PAGE HEADER ==================== */
.pageHeader {
  margin-bottom: 24px;
  text-align: right;
}

.page[dir="ltr"] .pageHeader {
  text-align: left;
}

.pageTitle {
  font-size: 40px;
  font-weight: 600;
  color: #121011;
  margin: 0 0 12px 0;
  transition: color 0.3s ease;
}

.page[data-theme="night"] .pageTitle {
  color: #f5f5f5;
}

.pageSubtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
}

.page[data-theme="night"] .pageSubtitle {
  color: #9ca3af;
}

/* ==================== SECTIONS ==================== */
.sliderSection {
  margin-bottom: 64px;
}

.newsSection {
  margin-bottom: 64px;
}

.achievementsSection {
  margin-bottom: 64px;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .pageTitle {
    font-size: 36px;
  }

  .sliderSection,
  .newsSection,
  .achievementsSection {
    margin-bottom: 48px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 24px 16px;
  }

  .pageTitle {
    font-size: 28px;
  }

  .pageSubtitle {
    font-size: 16px;
  }

  .sliderSection,
  .newsSection,
  .achievementsSection {
    margin-bottom: 40px;
  }
}

@media (max-width: 480px) {
  .page {
    padding: 16px 12px;
  }

  .pageTitle {
    font-size: 24px;
  }

  .sliderSection,
  .newsSection,
  .achievementsSection {
    margin-bottom: 32px;
  }
}
</style>

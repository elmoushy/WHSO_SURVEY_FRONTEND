<script setup lang="ts">
import { ref } from 'vue'
import NewsSlider from '../../components/news/NewsSlider.vue'
import NormalNewsList from '../../components/news/NormalNewsList.vue'
import AchievementNewsList from '../../components/news/AchievementNewsList.vue'
import NewsDetailModal from '../../components/news/NewsDetailModal.vue'
import type { Newsletter } from '../../types/news.types'

// Page title
const pageTitle = ref('News & Updates')

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
  <div :class="$style.page">
    <div :class="$style.container">
      <!-- Page Header -->
      <header :class="$style.pageHeader">
        <h1 :class="$style.pageTitle">{{ pageTitle }}</h1>
        <p :class="$style.pageSubtitle">Stay updated with the latest news and announcements</p>
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
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ==================== PAGE HEADER ==================== */
.pageHeader {
  margin-bottom: 48px;
  text-align: center;
}

.pageTitle {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
}

.pageSubtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
}

/* ==================== SECTIONS ==================== */
.sliderSection {
  margin-bottom: 64px;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .page {
    padding: 24px 16px;
  }

  .pageTitle {
    font-size: 36px;
  }

  .pageSubtitle {
    font-size: 16px;
  }

  .sliderSection {
    margin-bottom: 48px;
  }
}
</style>

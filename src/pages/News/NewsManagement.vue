<script setup lang="ts">
import { ref } from 'vue'
import Swal from 'sweetalert2'
import NewsSlider from '../../components/news/NewsSlider.vue'
import NormalNewsList from '../../components/news/NormalNewsList.vue'
import AchievementNewsList from '../../components/news/AchievementNewsList.vue'
import CreateNewsModal from '../../components/news/CreateNewsModal.vue'
import EditNewsModal from '../../components/news/EditNewsModal.vue'
import PositionManager from '../../components/news/PositionManager.vue'
import { deleteSliderNews, deleteNormalNews, deleteAchievementNews } from '../../services/newsService'
import type { Newsletter, NewsType } from '../../types/news.types'

// Page title
const pageTitle = ref('News Management')

// Modal state
const showCreateModal = ref(false)
const createModalType = ref<NewsType>('NORMAL')

const showEditModal = ref(false)
const editingItem = ref<Newsletter | null>(null)

// Position Manager state
const showPositionManager = ref(false)
const positionManagerType = ref<NewsType>('NORMAL')

// Refresh keys to reload components
const sliderKey = ref(0)
const newsKey = ref(0)
const achievementsKey = ref(0)

// Edit handlers
const handleSliderEdit = (item: Newsletter) => {
  console.log('Edit slider:', item)
  editingItem.value = item
  showEditModal.value = true
}

const handleNewsEdit = (item: Newsletter) => {
  console.log('Edit news:', item)
  editingItem.value = item
  showEditModal.value = true
}

const handleEditSuccess = () => {
  showEditModal.value = false
  editingItem.value = null
  
  // Refresh the appropriate component based on news type
  if (editingItem.value?.news_type === 'SLIDER') {
    sliderKey.value++
  } else if (editingItem.value?.news_type === 'ACHIEVEMENT') {
    achievementsKey.value++
  } else {
    newsKey.value++
  }
  
  // Refresh all to be safe
  sliderKey.value++
  newsKey.value++
  achievementsKey.value++
}

const handleAchievementEdit = (item: Newsletter) => {
  console.log('Edit achievement:', item)
  editingItem.value = item
  showEditModal.value = true
}

// Delete handlers
const handleDelete = async (item: Newsletter) => {
  const result = await Swal.fire({
    title: 'Delete News?',
    html: `Are you sure you want to delete:<br/><strong>${item.title}</strong><br/><br/>This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    focusCancel: true
  })

  if (result.isConfirmed) {
    try {
      // Show loading
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      // Delete based on type
      if (item.news_type === 'SLIDER') {
        await deleteSliderNews(item.id)
        sliderKey.value++
      } else if (item.news_type === 'NORMAL') {
        await deleteNormalNews(item.id)
        newsKey.value++
      } else if (item.news_type === 'ACHIEVEMENT') {
        await deleteAchievementNews(item.id)
        achievementsKey.value++
      }

      // Success message
      await Swal.fire({
        title: 'Deleted!',
        text: 'News has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error: any) {
      console.error('Failed to delete news:', error)
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.detail || 'Failed to delete news. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      })
    }
  }
}

// Create handlers
const openCreateModal = (type: NewsType) => {
  createModalType.value = type
  showCreateModal.value = true
}

const handleCreateSuccess = () => {
  showCreateModal.value = false
  
  // Refresh the appropriate component
  if (createModalType.value === 'SLIDER') {
    sliderKey.value++
  } else if (createModalType.value === 'ACHIEVEMENT') {
    achievementsKey.value++
  } else {
    newsKey.value++
  }
}

// Position Manager handlers
const openPositionManager = (type: NewsType) => {
  positionManagerType.value = type
  showPositionManager.value = true
}

const handlePositionManagerSuccess = () => {
  // Refresh the appropriate component based on type
  if (positionManagerType.value === 'SLIDER') {
    sliderKey.value++
  } else if (positionManagerType.value === 'ACHIEVEMENT') {
    achievementsKey.value++
  } else {
    newsKey.value++
  }
}
</script>

<template>
  <div :class="$style.page">
    <div :class="$style.container">
      <!-- Page Header -->
      <header :class="$style.pageHeader">
        <div :class="$style.headerContent">
          <div>
            <h1 :class="$style.pageTitle">{{ pageTitle }}</h1>
            <p :class="$style.pageSubtitle">Click on any news item to edit</p>
          </div>
          <div :class="$style.headerActions">
            <span :class="$style.badge">Admin View</span>
          </div>
        </div>
      </header>

      <!-- Slider Section -->
      <section :class="$style.sliderSection">
        <div :class="$style.sectionHeader">
          <h2 :class="$style.sectionTitle">Slider News</h2>
          <span :class="$style.sectionBadge">Homepage Carousel</span>
          <button :class="$style.positionButton" @click="openPositionManager('SLIDER')">
            <span>📊</span>
            <span>Manage Positions</span>
          </button>
          <button :class="$style.addButton" @click="openCreateModal('SLIDER')">
            <span :class="$style.addIcon">+</span>
            Add Slider
          </button>
        </div>
        <NewsSlider 
          :key="sliderKey" 
          :refresh-key="sliderKey"
          :editable="true" 
          @edit="handleSliderEdit"
          @delete="handleDelete"
        />
      </section>

      <!-- Normal News Section -->
      <section :class="$style.newsSection">
        <div :class="$style.sectionHeader">
          <h2 :class="$style.sectionTitle">Normal News</h2>
          <span :class="$style.sectionBadge">News Feed</span>
          <button :class="$style.positionButton" @click="openPositionManager('NORMAL')">
            <span>📊</span>
            <span>Manage Positions</span>
          </button>
          <button :class="$style.addButton" @click="openCreateModal('NORMAL')">
            <span :class="$style.addIcon">+</span>
            Add News
          </button>
        </div>
        <NormalNewsList 
          :key="newsKey" 
          :refresh-key="newsKey"
          :editable="true" 
          @edit="handleNewsEdit"
          @delete="handleDelete"
        />
      </section>

      <!-- Achievements Section -->
      <section :class="$style.achievementsSection">
        <div :class="$style.sectionHeader">
          <h2 :class="$style.sectionTitle">Achievements</h2>
          <span :class="$style.sectionBadge">Certifications & Awards</span>
          <button :class="$style.positionButton" @click="openPositionManager('ACHIEVEMENT')">
            <span>📊</span>
            <span>Manage Positions</span>
          </button>
          <button :class="$style.addButton" @click="openCreateModal('ACHIEVEMENT')">
            <span :class="$style.addIcon">+</span>
            Add Achievement
          </button>
        </div>
        <AchievementNewsList 
          :key="achievementsKey" 
          :refresh-key="achievementsKey"
          :editable="true" 
          @edit="handleAchievementEdit"
          @delete="handleDelete"
        />
      </section>
    </div>

    <!-- Create News Modal -->
    <CreateNewsModal 
      :show="showCreateModal"
      :news-type="createModalType"
      @close="showCreateModal = false"
      @success="handleCreateSuccess"
    />

    <!-- Edit News Modal -->
    <EditNewsModal 
      :show="showEditModal"
      :news-item="editingItem"
      @close="showEditModal = false"
      @success="handleEditSuccess"
    />

    <!-- Position Manager Modal -->
    <PositionManager 
      :show="showPositionManager"
      :news-type="positionManagerType"
      @close="showPositionManager = false"
      @success="handlePositionManagerSuccess"
    />

    <!-- Floating Action Buttons -->
    <div :class="$style.fabContainer">
      <button 
        :class="[$style.fab, $style.fabPrimary]" 
        @click="openCreateModal('SLIDER')"
        title="Add Slider News"
      >
        <span :class="$style.fabIcon">🎬</span>
      </button>
      <button 
        :class="[$style.fab, $style.fabSecondary]" 
        @click="openCreateModal('NORMAL')"
        title="Add Normal News"
      >
        <span :class="$style.fabIcon">📰</span>
      </button>
      <button 
        :class="[$style.fab, $style.fabTertiary]" 
        @click="openCreateModal('ACHIEVEMENT')"
        title="Add Achievement"
      >
        <span :class="$style.fabIcon">🏆</span>
      </button>
    </div>
  </div>
</template>

<style module>
.page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #fffefc, #ffffff);
  padding: 32px 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* ==================== PAGE HEADER ==================== */
.pageHeader {
  margin-bottom: 24px;
}

.headerContent {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.pageTitle {
  font-size: 48px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.pageSubtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
}

.headerActions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.badge {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

/* ==================== INFO BANNER ==================== */
.infoBanner {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  color: #1e3a8a;
  font-size: 15px;
}

.infoIcon {
  font-size: 24px;
  flex-shrink: 0;
}

/* ==================== SECTIONS ==================== */
.sliderSection,
.newsSection {
  margin-bottom: 64px;
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.sectionTitle {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.sectionBadge {
  background: #e5e7eb;
  color: #374151;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.positionButton {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.positionButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.addButton {
  margin-left: auto;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.addButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4);
}

.addIcon {
  font-size: 20px;
  font-weight: 700;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .page {
    padding: 24px 16px;
  }

  .headerContent {
    flex-direction: column;
    align-items: flex-start;
  }

  .pageTitle {
    font-size: 36px;
  }

  .pageSubtitle {
    font-size: 16px;
  }

  .infoBanner {
    flex-direction: column;
    text-align: center;
  }

  .sectionHeader {
    flex-direction: column;
    align-items: flex-start;
  }

  .sectionTitle {
    font-size: 24px;
  }

  .sliderSection,
  .newsSection {
    margin-bottom: 48px;
  }
}

/* ==================== FLOATING ACTION BUTTONS ==================== */
.fabContainer {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
}

.fab {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.fab::before {
  content: attr(title);
  position: absolute;
  right: 72px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.fab:hover::before {
  opacity: 1;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.fab:active {
  transform: scale(0.95);
}

.fabPrimary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.fabSecondary {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.fabTertiary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.fabIcon {
  font-size: 28px;
}

@media (max-width: 768px) {
  .fabContainer {
    bottom: 20px;
    right: 20px;
  }

  .fab {
    width: 56px;
    height: 56px;
  }

  .fabIcon {
    font-size: 24px;
  }
}
</style>

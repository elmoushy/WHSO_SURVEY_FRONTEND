<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '../../stores/useAppStore'
import NewsSlider from '../../components/news/NewsSlider.vue'
import NormalNewsList from '../../components/news/NormalNewsList.vue'
import AchievementNewsList from '../../components/news/AchievementNewsList.vue'
import NewsDetailModal from '../../components/news/NewsDetailModal.vue'
import CreateNewsModal from '../../components/news/CreateNewsModal.vue'
import EditNewsModal from '../../components/news/EditNewsModal.vue'
import PositionManager from '../../components/news/PositionManager.vue'
import { deleteSliderNews, deleteNormalNews, deleteAchievementNews } from '../../services/newsService'
import type { Newsletter, NewsType } from '../../types/news.types'

// Route & Store
const route = useRoute()
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)

// RTL support
const isRTL = computed(() => currentLanguage.value === 'ar')

// Admin mode - check if route is /control/news
const isAdminMode = computed(() => route.path.startsWith('/control'))

// Detail modal state (public view)
const showDetailModal = ref(false)
const selectedNews = ref<Newsletter | null>(null)

// Create modal state (admin)
const showCreateModal = ref(false)
const createModalType = ref<NewsType>('NORMAL')

// Edit modal state (admin)
const showEditModal = ref(false)
const editingItem = ref<Newsletter | null>(null)

// Position Manager state (admin)
const showPositionManager = ref(false)
const positionManagerType = ref<NewsType>('NORMAL')

// FAB menu state
const showFabMenu = ref(false)

// Refresh keys to reload components
const sliderKey = ref(0)
const newsKey = ref(0)
const achievementsKey = ref(0)

// Handle view click (public mode)
const handleViewNews = (item: Newsletter) => {
  selectedNews.value = item
  showDetailModal.value = true
}

// Close detail modal
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedNews.value = null
}

// Edit handlers (admin mode)
const handleSliderEdit = (item: Newsletter) => {
  editingItem.value = item
  showEditModal.value = true
}

const handleNewsEdit = (item: Newsletter) => {
  editingItem.value = item
  showEditModal.value = true
}

const handleEditSuccess = () => {
  showEditModal.value = false
  editingItem.value = null
  sliderKey.value++
  newsKey.value++
  achievementsKey.value++
}

const handleAchievementEdit = (item: Newsletter) => {
  editingItem.value = item
  showEditModal.value = true
}

// Delete handler (admin mode)
const handleDelete = async (item: Newsletter) => {
  const result = await Swal.fire({
    title: isRTL.value ? 'حذف الخبر؟' : 'Delete News?',
    html: isRTL.value 
      ? `هل أنت متأكد من حذف:<br/><strong>${item.title}</strong><br/><br/>لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete:<br/><strong>${item.title}</strong><br/><br/>This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: isRTL.value ? 'نعم، احذف' : 'Yes, delete it',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    focusCancel: true
  })

  if (result.isConfirmed) {
    try {
      Swal.fire({
        title: isRTL.value ? 'جاري الحذف...' : 'Deleting...',
        text: isRTL.value ? 'يرجى الانتظار' : 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

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

      await Swal.fire({
        title: isRTL.value ? 'تم الحذف!' : 'Deleted!',
        text: isRTL.value ? 'تم حذف الخبر بنجاح.' : 'News has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (error: any) {
      console.error('Failed to delete news:', error)
      await Swal.fire({
        title: isRTL.value ? 'خطأ' : 'Error',
        text: error.response?.data?.detail || (isRTL.value ? 'فشل في حذف الخبر. يرجى المحاولة مرة أخرى.' : 'Failed to delete news. Please try again.'),
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      })
    }
  }
}

// Create handlers (admin mode)
const openCreateModal = (type: NewsType) => {
  createModalType.value = type
  showCreateModal.value = true
}

const handleCreateSuccess = () => {
  showCreateModal.value = false
  if (createModalType.value === 'SLIDER') {
    sliderKey.value++
  } else if (createModalType.value === 'ACHIEVEMENT') {
    achievementsKey.value++
  } else {
    newsKey.value++
  }
}

// Position Manager handlers (admin mode)
const openPositionManager = (type: NewsType) => {
  positionManagerType.value = type
  showPositionManager.value = true
}

const handlePositionManagerSuccess = () => {
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
  <div :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.container">
      <!-- Page Header -->
      <header :class="$style.pageHeader">
        <div :class="$style.headerContent">
          <div>
            <h1 :class="$style.pageTitle">
              {{ isAdminMode 
                ? (isRTL ? 'إدارة الأخبار' : 'News Management') 
                : (isRTL ? 'الاخبار والإنجازات' : 'News & Achievements') 
              }}
            </h1>
            <p v-if="isAdminMode" :class="$style.pageSubtitle">
              {{ isRTL ? 'انقر على أي خبر للتعديل' : 'Click on any news item to edit' }}
            </p>
          </div>
          <div v-if="isAdminMode" :class="$style.headerActions">
            <span :class="$style.badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
              {{ isRTL ? 'وضع الإدارة' : 'Admin Mode' }}
            </span>
          </div>
        </div>
      </header>

      <!-- Slider Section -->
      <section :class="$style.sliderSection">
        <div v-if="isAdminMode" :class="$style.sectionHeader">
          <span :class="$style.sectionBadge">{{ isRTL ? 'الكاروسيل الرئيسي' : 'Homepage Carousel' }}</span>
          <button :class="$style.positionButton" @click="openPositionManager('SLIDER')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>{{ isRTL ? 'الترتيب' : 'Order' }}</span>
          </button>
          <button :class="$style.addButton" @click="openCreateModal('SLIDER')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ isRTL ? 'إضافة' : 'Add' }}
          </button>
        </div>
        <NewsSlider 
          :key="sliderKey" 
          :refresh-key="sliderKey"
          :editable="isAdminMode" 
          @edit="handleSliderEdit"
          @delete="handleDelete"
          @view="handleViewNews"
        />
      </section>

      <!-- Normal News Section -->
      <section :class="$style.newsSection">
        <div v-if="isAdminMode" :class="$style.sectionHeader">
          <span :class="$style.sectionBadge">{{ isRTL ? 'قائمة الأخبار' : 'News Feed' }}</span>
          <button :class="$style.positionButton" @click="openPositionManager('NORMAL')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>{{ isRTL ? 'الترتيب' : 'Order' }}</span>
          </button>
          <button :class="$style.addButton" @click="openCreateModal('NORMAL')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ isRTL ? 'إضافة' : 'Add' }}
          </button>
        </div>
        <NormalNewsList 
          :key="newsKey" 
          :refresh-key="newsKey"
          :editable="isAdminMode" 
          @edit="handleNewsEdit"
          @delete="handleDelete"
          @view="handleViewNews"
        />
      </section>

      <!-- Achievements Section -->
      <section :class="$style.achievementsSection">
        <div v-if="isAdminMode" :class="$style.sectionHeader">
          <span :class="$style.sectionBadge">{{ isRTL ? 'الشهادات والجوائز' : 'Certifications & Awards' }}</span>
          <button :class="$style.positionButton" @click="openPositionManager('ACHIEVEMENT')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>{{ isRTL ? 'الترتيب' : 'Order' }}</span>
          </button>
          <button :class="$style.addButton" @click="openCreateModal('ACHIEVEMENT')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ isRTL ? 'إضافة' : 'Add' }}
          </button>
        </div>
        <AchievementNewsList 
          :key="achievementsKey" 
          :refresh-key="achievementsKey"
          :editable="isAdminMode" 
          @edit="handleAchievementEdit"
          @delete="handleDelete"
          @view="handleViewNews"
        />
      </section>
    </div>

    <!-- Detail Modal (Public View) -->
    <NewsDetailModal 
      :show="showDetailModal"
      :news-item="selectedNews"
      @close="closeDetailModal"
    />

    <!-- Admin Modals -->
    <template v-if="isAdminMode">
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

      <!-- Floating Action Button -->
      <div :class="$style.fabContainer">
        <button :class="[$style.fab, { [$style.fabOpen]: showFabMenu }]" @click="showFabMenu = !showFabMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <Transition name="fab-menu">
          <div v-if="showFabMenu" :class="$style.fabMenu">
            <button 
              :class="$style.fabMenuItem" 
              @click="openCreateModal('SLIDER'); showFabMenu = false"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
              <span>{{ isRTL ? 'سلايدر' : 'Slider' }}</span>
            </button>
            <button 
              :class="$style.fabMenuItem" 
              @click="openCreateModal('NORMAL'); showFabMenu = false"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>{{ isRTL ? 'خبر' : 'News' }}</span>
            </button>
            <button 
              :class="$style.fabMenuItem" 
              @click="openCreateModal('ACHIEVEMENT'); showFabMenu = false"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="6"/>
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
              <span>{{ isRTL ? 'إنجاز' : 'Award' }}</span>
            </button>
          </div>
        </Transition>
        <!-- Backdrop to close menu -->
        <div v-if="showFabMenu" :class="$style.fabBackdrop" @click="showFabMenu = false"></div>
      </div>
    </template>
  </div>
</template>

<style module>
/* ========= Brand Palette (matching Surveys) ========= */
.page {
  --gold-700: #A17D23;
  --gold-600: #B78A41;
  --gold-500: #CEA55B;
  --gold-400: #D3B079;

  --gray-900: #231F20;
  --gray-700: #4D4D4F;
  --gray-500: #808285;
  --gray-100: #E5E8E1;

  --beige-700: #C2BA98;
  --beige-600: #D1C6AC;
  --beige-500: #D8CFBB;

  /* Light mode defaults */
  --panel-background: #F5F7FA;
  --panel-foreground: var(--gray-900);
  --panel-overlay-1: linear-gradient(45deg, rgba(161,125,35,.03) 0%, transparent 100%);
  --panel-overlay-2: linear-gradient(-45deg, rgba(183,138,65,.03) 0%, transparent 100%);
  
  --section-background: #ffffff;
  --section-shadow: 0 16px 36px rgba(15,23,42,0.08);
  --section-border: rgba(15,23,42,0.05);
  
  --card-background: transparent;
  --card-border: rgba(209,217,230,0.75);
  --card-border-hover: rgba(161, 125, 35, 0.2);
  --card-shadow-hover: 0 12px 40px rgba(161, 125, 35, 0.15);
  --card-title-color: #231F20;
  --card-divider: #F2F5F8;
  --card-text: #4D4D4F;
  
  --control-background: rgba(255, 255, 255, 0.9);
  --control-border: rgba(161, 125, 35, 0.2);
  --control-text: #4D4D4F;
  --control-muted-text: #717784;
  
  --badge-background: #e5e7eb;
  --badge-text: #374151;
  
  min-height: 100vh;
  background: var(--panel-background);
  color: var(--panel-foreground);
  padding: 32px 20px;
  position: relative;
  overflow-x: hidden;
  transition: all 0.4s cubic-bezier(.4,0,.2,1);
}

.page::before {
  content: '';
  position: fixed;
  inset: 0;
  background: var(--panel-overlay-1), var(--panel-overlay-2);
  pointer-events: none;
  z-index: 0;
}

/* Dark Mode */
.page[data-theme="night"] {
  --panel-background: 
    linear-gradient(135deg, rgba(35,31,32,0.97) 0%, rgba(27,30,36,0.98) 100%),
    radial-gradient(circle at 20% 20%, rgba(161,125,35,.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(183,138,65,.08) 0%, transparent 50%);
  --panel-foreground: #E5E8E1;
  --panel-overlay-1: linear-gradient(45deg, rgba(161,125,35,.05) 0%, transparent 100%);
  --panel-overlay-2: linear-gradient(-45deg, rgba(183,138,65,.05) 0%, transparent 100%);
  
  --section-background: rgba(27, 30, 36, 0.92);
  --section-shadow: 0 22px 48px rgba(0,0,0,0.6);
  --section-border: rgba(161, 125, 35, 0.18);
  
  --card-background: rgba(40, 43, 51, 0.7);
  --card-border: rgba(226,232,240,0.18);
  --card-border-hover: rgba(226,232,240,0.32);
  --card-shadow-hover: 0 16px 48px rgba(0,0,0,0.4);
  --card-title-color: #E5E8E1;
  --card-divider: rgba(255,255,255,0.08);
  --card-text: rgba(226, 232, 240, 0.78);
  
  --control-background: rgba(17, 24, 39, 0.78);
  --control-border: rgba(107, 114, 128, 0.32);
  --control-text: rgba(226, 232, 240, 0.82);
  --control-muted-text: rgba(209, 213, 219, 0.78);
  
  --badge-background: rgba(77, 77, 79, 0.35);
  --badge-text: #E5E8E1;
  
  background: var(--panel-background);
  color: var(--panel-foreground);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
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
  font-size: 40px;
  font-weight: 600;
  color: var(--card-title-color);
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.page[data-theme="night"] .pageTitle {
  background: linear-gradient(135deg, #E5E8E1 0%, #D1C6AC 50%, #B78A41 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pageSubtitle {
  font-size: 16px;
  color: var(--control-muted-text);
  margin: 0;
}

.headerActions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(161, 125, 35, 0.1);
  color: #A17D23;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(161, 125, 35, 0.2);
}

.page[data-theme="night"] .badge {
  background: rgba(161, 125, 35, 0.2);
  border-color: rgba(161, 125, 35, 0.35);
  color: #D3B079;
}

/* ==================== SECTIONS ==================== */
.sliderSection,
.newsSection,
.achievementsSection {
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
  color: var(--card-title-color);
  margin: 0;
}

.sectionBadge {
  background: var(--badge-background);
  color: var(--badge-text);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--section-border);
}

.page[data-theme="night"] .sectionBadge {
  background: rgba(161, 125, 35, 0.15);
  border-color: rgba(161, 125, 35, 0.25);
  color: #D1C6AC;
}

.positionButton {
  background: var(--control-background);
  color: var(--control-muted-text);
  border: 1px solid var(--control-border);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(10px);
}

.positionButton:hover {
  background: rgba(161, 125, 35, 0.1);
  border-color: #A17D23;
  color: #A17D23;
}

.page[data-theme="night"] .positionButton:hover {
  background: rgba(161, 125, 35, 0.15);
  border-color: #B78A41;
  color: #D3B079;
}

.addButton {
  margin-left: auto;
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.25);
}

.page[dir="rtl"] .addButton {
  margin-left: 0;
  margin-right: auto;
}

.addButton:hover {
  background: linear-gradient(135deg, #B78A41, #CEA55B);
  box-shadow: 0 6px 16px rgba(161, 125, 35, 0.35);
  transform: translateY(-1px);
}

.addButton:active {
  transform: scale(0.98);
}

/* ==================== FLOATING ACTION BUTTON ==================== */
.fabContainer {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 100;
}

.page[dir="rtl"] .fabContainer {
  right: auto;
  left: 32px;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(161, 125, 35, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 102;
}

.fab:hover {
  background: linear-gradient(135deg, #B78A41, #CEA55B);
  box-shadow: 0 6px 24px rgba(161, 125, 35, 0.5);
}

.fab svg {
  transition: transform 0.3s ease;
}

.fabOpen {
  background: linear-gradient(135deg, #8a6a1e, #A17D23);
}

.fabOpen svg {
  transform: rotate(45deg);
}

.fabMenu {
  position: absolute;
  bottom: 64px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 102;
}

.page[dir="rtl"] .fabMenu {
  right: auto;
  left: 0;
}

.fabMenuItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--section-background);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  color: var(--card-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: var(--section-shadow);
  transition: all 0.2s ease;
  backdrop-filter: blur(20px);
}

.fabMenuItem:hover {
  background: linear-gradient(135deg, #A17D23, #B78A41);
  border-color: #A17D23;
  color: white;
  transform: translateX(-4px);
}

.page[dir="rtl"] .fabMenuItem:hover {
  transform: translateX(4px);
}

.page[data-theme="night"] .fabMenuItem {
  background: rgba(27, 30, 36, 0.95);
  border-color: rgba(161, 125, 35, 0.25);
  color: #E5E8E1;
}

.page[data-theme="night"] .fabMenuItem:hover {
  background: linear-gradient(135deg, #A17D23, #B78A41);
  border-color: #A17D23;
  color: white;
}

.fabBackdrop {
  position: fixed;
  inset: 0;
  z-index: 101;
}

/* FAB Menu Transition */
:global(.fab-menu-enter-active),
:global(.fab-menu-leave-active) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.fab-menu-enter-from),
:global(.fab-menu-leave-to) {
  opacity: 0;
  transform: translateY(10px);
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

  .headerContent {
    flex-direction: column;
    align-items: flex-start;
  }

  .pageTitle {
    font-size: 28px;
  }

  .pageSubtitle {
    font-size: 14px;
  }

  .sectionHeader {
    flex-direction: column;
    align-items: flex-start;
  }

  .sectionTitle {
    font-size: 24px;
  }

  .addButton {
    margin-left: 0;
    margin-right: 0;
  }

  .sliderSection,
  .newsSection,
  .achievementsSection {
    margin-bottom: 40px;
  }

  .fabContainer {
    bottom: 20px;
    right: 20px;
  }

  .page[dir="rtl"] .fabContainer {
    right: auto;
    left: 20px;
  }

  .fab {
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }

  .fabMenu {
    bottom: 60px;
  }

  .fabMenuItem {
    padding: 10px 14px;
    font-size: 13px;
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

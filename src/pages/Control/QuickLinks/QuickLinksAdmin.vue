<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Swal from 'sweetalert2'
import { useAppStore } from '../../../stores/useAppStore'
import { 
  fetchAllQuickLinks, 
  deleteQuickLink, 
  updateQuickLinkPositions,
  toggleQuickLinkStatus
} from '../../../services/quickLinksService'
import CreateQuickLinkModal from '../../../components/QuickLinks/CreateQuickLinkModal.vue'
import EditQuickLinkModal from '../../../components/QuickLinks/EditQuickLinkModal.vue'
import AuthenticatedImage from '../../../components/AuthenticatedImage.vue'
import type { QuickLink } from '../../../types/quicklinks.types'

// Store
const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)

// RTL support
const isRTL = computed(() => currentLanguage.value === 'ar')

// State
const quickLinks = ref<QuickLink[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingItem = ref<QuickLink | null>(null)

// Drag state for reordering
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Refresh key
const refreshKey = ref(0)

// Load quick links
const loadQuickLinks = async () => {
  try {
    isLoading.value = true
    error.value = null
    const response = await fetchAllQuickLinks({ page_size: 100 })
    quickLinks.value = response.data.results.sort((a, b) => a.position - b.position)
  } catch (err: any) {
    console.error('Failed to load quick links:', err)
    error.value = isRTL.value 
      ? 'فشل في تحميل الروابط السريعة' 
      : 'Failed to load quick links'
  } finally {
    isLoading.value = false
  }
}

// Handle edit
const handleEdit = (item: QuickLink) => {
  editingItem.value = item
  showEditModal.value = true
}

// Handle delete
const handleDelete = async (item: QuickLink) => {
  const result = await Swal.fire({
    title: isRTL.value ? 'حذف الرابط؟' : 'Delete Link?',
    html: isRTL.value 
      ? `هل أنت متأكد من حذف:<br/><strong>${item.name}</strong><br/><br/>لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete:<br/><strong>${item.name}</strong><br/><br/>This action cannot be undone.`,
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

      await deleteQuickLink(item.id)
      store.triggerQuickLinksRefresh()

      await Swal.fire({
        title: isRTL.value ? 'تم الحذف!' : 'Deleted!',
        text: isRTL.value ? 'تم حذف الرابط بنجاح.' : 'Link has been deleted successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })

      loadQuickLinks()
    } catch (error: any) {
      console.error('Failed to delete quick link:', error)
      await Swal.fire({
        title: isRTL.value ? 'خطأ' : 'Error',
        text: error.response?.data?.detail || (isRTL.value ? 'فشل في حذف الرابط.' : 'Failed to delete link.'),
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      })
    }
  }
}

// Handle toggle status
const handleToggleStatus = async (item: QuickLink) => {
  try {
    await toggleQuickLinkStatus(item.id, !item.is_active)
    loadQuickLinks()
    store.triggerQuickLinksRefresh()
  } catch (error: any) {
    console.error('Failed to toggle status:', error)
    await Swal.fire({
      title: isRTL.value ? 'خطأ' : 'Error',
      text: isRTL.value ? 'فشل في تغيير الحالة' : 'Failed to change status',
      icon: 'error',
      confirmButtonColor: '#3b82f6'
    })
  }
}

// Drag and drop handlers
const handleDragStart = (index: number) => {
  draggedIndex.value = index
}

const handleDragOver = (e: DragEvent, index: number) => {
  e.preventDefault()
  dragOverIndex.value = index
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}

const handleDrop = async (targetIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null
    dragOverIndex.value = null
    return
  }

  const items = [...quickLinks.value]
  const [removed] = items.splice(draggedIndex.value, 1)
  items.splice(targetIndex, 0, removed)
  
  // Update positions
  const positions = items.map((item, index) => ({
    id: item.id,
    position: index
  }))

  quickLinks.value = items

  try {
    await updateQuickLinkPositions({ positions })
    store.triggerQuickLinksRefresh()
  } catch (error) {
    console.error('Failed to update positions:', error)
    loadQuickLinks() // Reload on error
  }

  draggedIndex.value = null
  dragOverIndex.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Handle success callbacks
const handleCreateSuccess = () => {
  showCreateModal.value = false
  loadQuickLinks()
  store.triggerQuickLinksRefresh()
}

const handleEditSuccess = () => {
  showEditModal.value = false
  editingItem.value = null
  loadQuickLinks()
  store.triggerQuickLinksRefresh()
}

// Load on mount
onMounted(() => {
  loadQuickLinks()
})

// Watch refresh key
watch(refreshKey, () => {
  loadQuickLinks()
})
</script>

<template>
  <div :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <div :class="$style.container">
      <!-- Page Header -->
      <header :class="$style.pageHeader">
        <div :class="$style.headerContent">
          <div>
            <h1 :class="$style.pageTitle">
              {{ isRTL ? 'إدارة الروابط السريعة' : 'Quick Links Management' }}
            </h1>
            <p :class="$style.pageSubtitle">
              {{ isRTL ? 'إضافة وتعديل وحذف روابط التطبيقات الخارجية' : 'Add, edit, and manage external app links' }}
            </p>
          </div>
          <div :class="$style.headerActions">
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

      <!-- Main Content Section -->
      <section :class="$style.linksSection">
        <div :class="$style.sectionHeader">
          <h2 :class="$style.sectionTitle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            {{ isRTL ? 'الروابط السريعة' : 'Quick Links' }}
          </h2>
          <span :class="$style.sectionBadge">
            {{ quickLinks.length }} {{ isRTL ? 'رابط' : 'links' }}
          </span>
          <button :class="$style.addButton" @click="showCreateModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ isRTL ? 'إضافة رابط' : 'Add Link' }}
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" :class="$style.loadingGrid">
          <div v-for="n in 6" :key="n" :class="$style.skeletonCard">
            <div :class="$style.skeletonIcon"></div>
            <div :class="$style.skeletonText"></div>
            <div :class="$style.skeletonUrl"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" :class="$style.errorState">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>{{ error }}</p>
          <button @click="loadQuickLinks">
            {{ isRTL ? 'إعادة المحاولة' : 'Try Again' }}
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="quickLinks.length === 0" :class="$style.emptyState">
          <div :class="$style.emptyIcon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h3>{{ isRTL ? 'لا توجد روابط سريعة' : 'No Quick Links Yet' }}</h3>
          <p>{{ isRTL ? 'ابدأ بإضافة رابط جديد للتطبيقات الخارجية' : 'Start by adding a new external app link' }}</p>
          <button :class="$style.emptyAddButton" @click="showCreateModal = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {{ isRTL ? 'إضافة رابط' : 'Add Link' }}
          </button>
        </div>

        <!-- Links Grid -->
        <div v-else :class="$style.linksGrid">
          <div 
            v-for="(link, index) in quickLinks" 
            :key="link.id"
            :class="[
              $style.linkCard, 
              { 
                [$style.dragging]: draggedIndex === index,
                [$style.dragOver]: dragOverIndex === index,
                [$style.inactive]: !link.is_active
              }
            ]"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover="handleDragOver($event, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop(index)"
            @dragend="handleDragEnd"
          >
            <!-- Drag Handle -->
            <div :class="$style.dragHandle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="5" r="1"/>
                <circle cx="9" cy="12" r="1"/>
                <circle cx="9" cy="19" r="1"/>
                <circle cx="15" cy="5" r="1"/>
                <circle cx="15" cy="12" r="1"/>
                <circle cx="15" cy="19" r="1"/>
              </svg>
            </div>

            <!-- Link Icon -->
            <div :class="$style.linkIconWrapper">
              <AuthenticatedImage 
                v-if="link.icon_url" 
                :src="link.icon_url" 
                :alt="link.name"
                :class="$style.linkIcon"
                :version="link.updated_at"
              />
              <span v-if="!link.icon_url" :class="$style.iconFallback">
                {{ link.name.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Link Info -->
            <div :class="$style.linkInfo">
              <h3 :class="$style.linkName">{{ link.name }}</h3>
              <p :class="$style.linkUrl">{{ link.redirect_url }}</p>
            </div>

            <!-- Status Badge -->
            <div :class="[$style.statusBadge, { [$style.active]: link.is_active }]">
              {{ link.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive') }}
            </div>

            <!-- Actions -->
            <div :class="$style.cardActions">
              <button 
                :class="$style.actionButton" 
                @click.stop="handleToggleStatus(link)"
                :title="link.is_active ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')"
              >
                <svg v-if="link.is_active" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
              <button 
                :class="$style.actionButton" 
                @click.stop="handleEdit(link)"
                :title="isRTL ? 'تعديل' : 'Edit'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button 
                :class="[$style.actionButton, $style.deleteButton]" 
                @click.stop="handleDelete(link)"
                :title="isRTL ? 'حذف' : 'Delete'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>

            <!-- Position indicator -->
            <div :class="$style.positionBadge">{{ index + 1 }}</div>
          </div>
        </div>

        <!-- Hint -->
        <p v-if="quickLinks.length > 1" :class="$style.hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {{ isRTL ? 'اسحب وأفلت لإعادة ترتيب الروابط' : 'Drag and drop to reorder links' }}
        </p>
      </section>
    </div>

    <!-- Modals -->
    <CreateQuickLinkModal 
      :show="showCreateModal"
      @close="showCreateModal = false"
      @success="handleCreateSuccess"
    />

    <EditQuickLinkModal 
      :show="showEditModal"
      :quick-link="editingItem"
      @close="showEditModal = false; editingItem = null"
      @success="handleEditSuccess"
    />
  </div>
</template>

<style module>
/* ========= Brand Palette (matching News.vue) ========= */
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
  
  --card-background: #ffffff;
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
  margin-bottom: 32px;
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

/* ==================== SECTION ==================== */
.linksSection {
  background: var(--section-background);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--section-shadow);
  border: 1px solid var(--section-border);
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.sectionTitle {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: var(--card-title-color);
  margin: 0;
}

.sectionTitle svg {
  color: var(--gold-700);
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

.addButton {
  margin-left: auto;
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
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

/* ==================== LOADING STATE ==================== */
.loadingGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.skeletonCard {
  background: var(--card-background);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.skeletonIcon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeletonText {
  flex: 1;
  height: 20px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeletonUrl {
  width: 100px;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.page[data-theme="night"] .skeletonIcon,
.page[data-theme="night"] .skeletonText,
.page[data-theme="night"] .skeletonUrl {
  background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
  background-size: 200% 100%;
}

/* ==================== ERROR STATE ==================== */
.errorState {
  text-align: center;
  padding: 60px 20px;
  color: var(--control-muted-text);
}

.errorState svg {
  color: #dc2626;
  margin-bottom: 16px;
}

.errorState p {
  margin: 0 0 20px 0;
  font-size: 16px;
}

.errorState button {
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.errorState button:hover {
  background: linear-gradient(135deg, #B78A41, #CEA55B);
}

/* ==================== EMPTY STATE ==================== */
.emptyState {
  text-align: center;
  padding: 80px 20px;
}

.emptyIcon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.1) 0%, rgba(183, 138, 65, 0.1) 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emptyIcon svg {
  color: var(--gold-600);
}

.emptyState h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--card-title-color);
  margin: 0 0 8px 0;
}

.emptyState p {
  font-size: 15px;
  color: var(--control-muted-text);
  margin: 0 0 24px 0;
}

.emptyAddButton {
  background: linear-gradient(135deg, #A17D23, #B78A41);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(161, 125, 35, 0.3);
}

.emptyAddButton:hover {
  background: linear-gradient(135deg, #B78A41, #CEA55B);
  box-shadow: 0 6px 20px rgba(161, 125, 35, 0.4);
  transform: translateY(-2px);
}

/* ==================== LINKS GRID ==================== */
.linksGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.linkCard {
  position: relative;
  background: var(--card-background);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: grab;
}

.linkCard:hover {
  border-color: var(--card-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}

.linkCard.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.linkCard.dragOver {
  border-color: var(--gold-600);
  border-style: dashed;
  background: rgba(161, 125, 35, 0.05);
}

.linkCard.inactive {
  opacity: 0.6;
}

.linkCard.inactive:hover {
  opacity: 0.8;
}

/* Drag Handle */
.dragHandle {
  color: var(--control-muted-text);
  cursor: grab;
  padding: 4px;
  transition: color 0.2s ease;
}

.dragHandle:hover {
  color: var(--gold-600);
}

.linkCard:active .dragHandle {
  cursor: grabbing;
}

/* Link Icon */
.linkIconWrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--gold-700), var(--gold-600));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(161, 125, 35, 0.2);
}

.linkIcon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.iconFallback {
  font-size: 22px;
  font-weight: 700;
  color: white;
}

/* Link Info */
.linkInfo {
  flex: 1;
  min-width: 0;
}

.linkName {
  font-size: 17px;
  font-weight: 600;
  color: var(--card-title-color);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linkUrl {
  font-size: 13px;
  color: var(--control-muted-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status Badge */
.statusBadge {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.statusBadge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.page[data-theme="night"] .statusBadge {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.page[data-theme="night"] .statusBadge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

/* Card Actions */
.cardActions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actionButton {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--control-muted-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.actionButton:hover {
  background: rgba(161, 125, 35, 0.1);
  color: var(--gold-600);
}

.actionButton.deleteButton:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

/* Position Badge */
.positionBadge {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  background: var(--gold-600);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(161, 125, 35, 0.3);
}

.page[dir="rtl"] .positionBadge {
  left: auto;
  right: -8px;
}

/* Hint */
.hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 13px;
  color: var(--control-muted-text);
}

.hint svg {
  color: var(--gold-600);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .pageTitle {
    font-size: 36px;
  }

  .linksGrid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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

  .linksSection {
    padding: 20px;
  }

  .sectionHeader {
    flex-direction: column;
    align-items: flex-start;
  }

  .sectionTitle {
    font-size: 20px;
  }

  .addButton {
    margin-left: 0;
    margin-right: 0;
    width: 100%;
    justify-content: center;
  }

  .linksGrid {
    grid-template-columns: 1fr;
  }

  .linkCard {
    flex-wrap: wrap;
    padding: 16px;
  }

  .cardActions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--card-divider);
  }
}

@media (max-width: 480px) {
  .page {
    padding: 16px 12px;
  }

  .pageTitle {
    font-size: 24px;
  }

  .linksSection {
    padding: 16px;
    border-radius: 16px;
  }
}
</style>

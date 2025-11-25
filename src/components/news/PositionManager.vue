<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import { 
  fetchNormalPositions, 
  fetchSliderPositions, 
  fetchAchievementPositions,
  updateNormalPosition,
  updateSliderPosition,
  updateAchievementPosition,
  type PositionListItem 
} from '../../services/newsService'
import type { NewsType } from '../../types/news.types'

interface Props {
  show: boolean
  newsType: NewsType
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// State
const items = ref<PositionListItem[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const draggedItem = ref<PositionListItem | null>(null)
const dragOverIndex = ref<number | null>(null)
const hasChanges = ref(false)
const originalPositions = ref<Map<number, number>>(new Map())

// Computed
const modalTitle = computed(() => {
  switch (props.newsType) {
    case 'SLIDER':
      return '🎬 Manage Slider Positions'
    case 'ACHIEVEMENT':
      return '🏆 Manage Achievement Positions'
    default:
      return '📰 Manage News Positions'
  }
})

const typeColor = computed(() => {
  switch (props.newsType) {
    case 'SLIDER':
      return '#8b5cf6'
    case 'ACHIEVEMENT':
      return '#10b981'
    default:
      return '#fbbf24'
  }
})

// Load positions
const loadPositions = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    let response
    switch (props.newsType) {
      case 'SLIDER':
        response = await fetchSliderPositions()
        break
      case 'ACHIEVEMENT':
        response = await fetchAchievementPositions()
        break
      default:
        response = await fetchNormalPositions()
    }
    
    items.value = [...response.data]
    
    // Store original positions
    originalPositions.value.clear()
    items.value.forEach(item => {
      originalPositions.value.set(item.id, item.position)
    })
    
    hasChanges.value = false
  } catch (err: any) {
    console.error('Failed to load positions:', err)
    error.value = 'Failed to load positions. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Drag and drop handlers
const handleDragStart = (item: PositionListItem, event: DragEvent) => {
  draggedItem.value = item
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', (event.target as HTMLElement).innerHTML)
  }
}

const handleDragEnd = () => {
  draggedItem.value = null
  dragOverIndex.value = null
}

const handleDragOver = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}

const handleDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (!draggedItem.value) return
  
  const draggedIndex = items.value.findIndex(item => item.id === draggedItem.value!.id)
  if (draggedIndex === -1 || draggedIndex === targetIndex) {
    dragOverIndex.value = null
    return
  }
  
  // Reorder items
  const newItems = [...items.value]
  const [removed] = newItems.splice(draggedIndex, 1)
  newItems.splice(targetIndex, 0, removed)
  
  // Update positions
  newItems.forEach((item, index) => {
    item.position = index
  })
  
  items.value = newItems
  hasChanges.value = true
  dragOverIndex.value = null
}

// Move item up/down
const moveUp = (index: number) => {
  if (index === 0) return
  
  const newItems = [...items.value]
  ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
  
  // Update positions
  newItems.forEach((item, idx) => {
    item.position = idx
  })
  
  items.value = newItems
  hasChanges.value = true
}

const moveDown = (index: number) => {
  if (index === items.value.length - 1) return
  
  const newItems = [...items.value]
  ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
  
  // Update positions
  newItems.forEach((item, idx) => {
    item.position = idx
  })
  
  items.value = newItems
  hasChanges.value = true
}

// Save all changes
const saveChanges = async () => {
  try {
    isSaving.value = true
    error.value = null
    
    // Get update function based on type
    let updateFn: (id: number, position: number) => Promise<any>
    switch (props.newsType) {
      case 'SLIDER':
        updateFn = updateSliderPosition
        break
      case 'ACHIEVEMENT':
        updateFn = updateAchievementPosition
        break
      default:
        updateFn = updateNormalPosition
    }
    
    // Update items that changed position
    const updates = []
    for (const item of items.value) {
      const originalPos = originalPositions.value.get(item.id)
      if (originalPos !== item.position) {
        updates.push(updateFn(item.id, item.position))
      }
    }
    
    if (updates.length === 0) {
      await Swal.fire({
        title: 'No Changes',
        text: 'No position changes to save.',
        icon: 'info',
        confirmButtonColor: typeColor.value
      })
      return
    }
    
    // Execute all updates
    await Promise.all(updates)
    
    // Show success message
    await Swal.fire({
      title: 'Success!',
      text: `${updates.length} position(s) updated successfully.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
    
    hasChanges.value = false
    emit('success')
  } catch (err: any) {
    console.error('Failed to save positions:', err)
    error.value = err.response?.data?.detail || 'Failed to save positions. Please try again.'
    
    await Swal.fire({
      title: 'Error',
      text: error.value || 'Failed to save positions. Please try again.',
      icon: 'error',
      confirmButtonColor: '#dc2626'
    })
  } finally {
    isSaving.value = false
  }
}

// Reset changes
const resetChanges = async () => {
  if (!hasChanges.value) return
  
  const result = await Swal.fire({
    title: 'Reset Changes?',
    text: 'All unsaved position changes will be lost.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, reset',
    cancelButtonText: 'Cancel'
  })
  
  if (result.isConfirmed) {
    await loadPositions()
  }
}

// Close modal
const handleClose = async () => {
  if (hasChanges.value) {
    const result = await Swal.fire({
      title: 'Unsaved Changes',
      text: 'You have unsaved position changes. Do you want to save before closing?',
      icon: 'warning',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonColor: typeColor.value,
      denyButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Save & Close',
      denyButtonText: 'Discard',
      cancelButtonText: 'Cancel'
    })
    
    if (result.isConfirmed) {
      await saveChanges()
      emit('close')
    } else if (result.isDenied) {
      emit('close')
    }
  } else {
    emit('close')
  }
}

// Watch show prop
watch(() => props.show, (newVal) => {
  if (newVal) {
    loadPositions()
  }
})

// Lifecycle
onMounted(() => {
  if (props.show) {
    loadPositions()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" :class="$style.overlay" @click.self="handleClose">
        <div :class="$style.modal">
          <!-- Header -->
          <div :class="$style.header" :style="{ borderColor: typeColor }">
            <h2 :class="$style.title">{{ modalTitle }}</h2>
            <div :class="$style.headerActions">
              <span v-if="hasChanges" :class="$style.changesBadge">
                {{ items.length }} items • Unsaved changes
              </span>
              <button 
                :class="$style.closeButton" 
                @click="handleClose"
                :disabled="isSaving"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Content -->
          <div :class="$style.content">
            <!-- Loading State -->
            <div v-if="isLoading" :class="$style.loading">
              <div :class="$style.spinner"></div>
              <p>Loading positions...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" :class="$style.error">
              <span>⚠️ {{ error }}</span>
              <button :class="$style.retryButton" @click="loadPositions">
                Retry
              </button>
            </div>

            <!-- Items List -->
            <div v-else-if="items.length > 0" :class="$style.itemsList">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                :class="[
                  $style.item,
                  { 
                    [$style.dragging]: draggedItem?.id === item.id,
                    [$style.dragOver]: dragOverIndex === index
                  }
                ]"
                draggable="true"
                @dragstart="handleDragStart(item, $event)"
                @dragend="handleDragEnd"
                @dragover="handleDragOver(index, $event)"
                @dragleave="handleDragLeave"
                @drop="handleDrop(index, $event)"
              >
                <!-- Drag Handle -->
                <div :class="$style.dragHandle">
                  <span>⋮⋮</span>
                </div>

                <!-- Position Badge -->
                <div :class="$style.positionBadge" :style="{ background: typeColor }">
                  {{ item.position }}
                </div>

                <!-- Title -->
                <div :class="$style.itemTitle">
                  {{ item.title }}
                </div>

                <!-- Actions -->
                <div :class="$style.itemActions">
                  <button
                    :class="$style.actionButton"
                    @click="moveUp(index)"
                    :disabled="index === 0 || isSaving"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    :class="$style.actionButton"
                    @click="moveDown(index)"
                    :disabled="index === items.length - 1 || isSaving"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else :class="$style.empty">
              <span>📦 No items to manage</span>
            </div>
          </div>

          <!-- Footer -->
          <div :class="$style.footer">
            <button
              :class="$style.resetButton"
              @click="resetChanges"
              :disabled="!hasChanges || isSaving"
            >
              🔄 Reset
            </button>
            <div :class="$style.footerActions">
              <button
                :class="$style.cancelButton"
                @click="handleClose"
                :disabled="isSaving"
              >
                Cancel
              </button>
              <button
                :class="$style.saveButton"
                @click="saveChanges"
                :disabled="!hasChanges || isSaving"
                :style="{ background: hasChanges ? typeColor : '#e5e7eb' }"
              >
                <span v-if="!isSaving">💾 Save Changes</span>
                <span v-else>Saving...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style module>
/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(8px);
}

/* Modal */
.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

/* Header */
.header {
  padding: 24px;
  border-bottom: 3px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.changesBadge {
  background: #fef3c7;
  color: #92400e;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.closeButton {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.closeButton:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.closeButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Info Banner */
.infoBanner {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-bottom: 2px solid #3b82f6;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1e3a8a;
  font-size: 14px;
}

.infoIcon {
  font-size: 20px;
  flex-shrink: 0;
}

/* Content */
.content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 300px;
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error */
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: #dc2626;
  text-align: center;
}

.retryButton {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retryButton:hover {
  background: #b91c1c;
  transform: translateY(-2px);
}

/* Items List */
.itemsList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: move;
  transition: all 0.3s ease;
  position: relative;
}

.item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.item.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.item.dragOver {
  border-color: #3b82f6;
  border-style: dashed;
  background: #eff6ff;
  transform: scale(1.02);
}

/* Drag Handle */
.dragHandle {
  color: #9ca3af;
  font-size: 20px;
  cursor: grab;
  user-select: none;
  padding: 4px;
}

.item:active .dragHandle {
  cursor: grabbing;
}

/* Position Badge */
.positionBadge {
  min-width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Title */
.itemTitle {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Actions */
.itemActions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.actionButton {
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actionButton:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.1);
}

.actionButton:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Empty */
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 18px;
}

/* Footer */
.footer {
  padding: 20px 24px;
  border-top: 2px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.resetButton {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.resetButton:hover:not(:disabled) {
  background: #fecaca;
  transform: translateY(-2px);
}

.resetButton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.footerActions {
  display: flex;
  gap: 12px;
}

.cancelButton,
.saveButton {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancelButton {
  background: #f3f4f6;
  color: #6b7280;
}

.cancelButton:hover {
  background: #e5e7eb;
  color: #374151;
}

.cancelButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.saveButton {
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.saveButton:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.saveButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(20px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .headerActions {
    width: 100%;
    justify-content: space-between;
  }

  .content {
    padding: 16px;
  }

  .footer {
    padding: 16px;
    flex-direction: column;
  }

  .footerActions {
    width: 100%;
  }

  .cancelButton,
  .saveButton,
  .resetButton {
    flex: 1;
  }

  .title {
    font-size: 20px;
  }
}
</style>

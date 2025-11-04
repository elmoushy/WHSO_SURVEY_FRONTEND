<template>
  <div :class="$style.notificationsPage">
    <!-- Header -->
    <div :class="$style.pageHeader">
      <div :class="$style.headerContent">
        <div :class="$style.titleSection">
          <h1 :class="$style.pageTitle">
            <i class="fas fa-bell"></i>
            {{ t('notifications.title') }}
          </h1>
          <p :class="$style.pageSubtitle">
            {{ notificationStats?.total_notifications || 0 }} {{ t('notifications.stats.total').toLowerCase() }}, 
            {{ notificationStats?.unread_notifications || 0 }} {{ t('notifications.stats.unread').toLowerCase() }}
          </p>
        </div>
        <div :class="$style.headerActions">
          <button 
            @click="refreshNotifications"
            :class="$style.actionButton"
            :disabled="isLoading"
            :title="t('notifications.actions.refresh')"
          >
            <i :class="['fas fa-sync-alt', { 'fa-spin': isLoading }]"></i>
            {{ t('notifications.refresh') }}
          </button>
          <button 
            @click="markAllAsRead"
            :class="$style.actionButton"
            :disabled="isMarkingAllRead || unreadCount === 0"
            :title="t('notifications.actions.markAllRead')"
          >
            <i :class="['fas fa-check-double', { 'fa-spin': isMarkingAllRead }]"></i>
            {{ t('notifications.markAllRead') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div :class="$style.filtersSection">
      <div :class="$style.filterRow">
        <div :class="$style.searchBox">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery"
            type="text"
            :placeholder="t('notifications.search')"
            :class="$style.searchInput"
            @input="debouncedSearch"
          >
        </div>
        
        <div :class="$style.filterControls">
          <select v-model="statusFilter" :class="$style.filterSelect">
            <option value="">{{ t('notifications.showAll') }}</option>
            <option value="unread">{{ t('notifications.showUnread') }}</option>
            <option value="read">{{ t('notifications.showRead') }}</option>
          </select>
          
          <select v-model="typeFilter" :class="$style.filterSelect">
            <option value="">{{ t('notifications.type') }}</option>
            <option v-for="(label, type) in notificationTypes" :key="type" :value="type">
              {{ label }}
            </option>
          </select>
          
          <select v-model="priorityFilter" :class="$style.filterSelect">
            <option value="">{{ t('notifications.priority') }}</option>
            <option v-for="(label, priority) in priorityOptions" :key="priority" :value="priority">
              {{ label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedNotifications.length > 0" :class="$style.bulkActions">
      <div :class="$style.bulkInfo">
        {{ selectedNotifications.length }} {{ currentLanguage === 'ar' ? 'عنصر محدد' : 'items selected' }}
      </div>
      <div :class="$style.bulkButtons">
        <button @click="bulkMarkAsRead" :class="$style.bulkButton" :disabled="isBulkProcessing">
          <i class="fas fa-check"></i>
          {{ t('notifications.markAsRead') }}
        </button>
        <button @click="bulkDelete" :class="[$style.bulkButton, $style.deleteButton]" :disabled="isBulkProcessing">
          <i class="fas fa-trash"></i>
          {{ t('notifications.delete') }}
        </button>
        <button @click="clearSelection" :class="[$style.bulkButton, $style.cancelButton]">
          <i class="fas fa-times"></i>
          {{ currentLanguage === 'ar' ? 'إلغاء' : 'Cancel' }}
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div :class="$style.notificationsList">
      <!-- Loading State -->
      <div v-if="isLoading" :class="$style.loading">
        <div :class="$style.loadingSpinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>{{ currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading notifications...' }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" :class="$style.emptyState">
        <div :class="$style.emptyIcon">
          <i class="fas fa-bell-slash"></i>
        </div>
        <h3>{{ t('notifications.noNotifications') }}</h3>
        <p>{{ t('notifications.noNotificationsDesc') }}</p>
      </div>

      <!-- Notifications -->
      <div v-else :class="$style.notificationsGrid">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="[
            $style.notificationCard, 
            { 
              [$style.unread]: !notification.is_read,
              [$style.selected]: selectedNotifications.includes(notification.id)
            }
          ]"
        >
          <!-- Selection Checkbox -->
          <div :class="$style.notificationSelect">
            <input 
              type="checkbox" 
              :checked="selectedNotifications.includes(notification.id)"
              @change="toggleSelection(notification.id)"
              :class="$style.checkbox"
            >
          </div>

          <!-- Priority Indicator -->
          <div 
            :class="$style.priorityIndicator"
            :style="{ backgroundColor: getPriorityColor(notification.priority) }"
          ></div>

          <!-- Main Content -->
          <div :class="$style.notificationMain" @click="handleNotificationClick(notification)">
            <div :class="$style.notificationHeader">
              <div :class="$style.notificationIcon">
                <i 
                  :class="getNotificationIcon(notification.notification_type)" 
                  :style="{ color: getPriorityColor(notification.priority) }"
                ></i>
              </div>
              <div :class="$style.notificationMeta">
                <span :class="$style.notificationType">
                  {{ notificationTypes[notification.notification_type] }}
                </span>
                <span :class="$style.notificationTime">{{ formatTime(notification.created_at) }}</span>
              </div>
            </div>

            <div :class="$style.notificationContent">
              <h4 :class="$style.notificationTitle">{{ notification.title_localized }}</h4>
              <p :class="$style.notificationBody">{{ notification.body_localized }}</p>
            </div>

            <!-- Action Buttons -->
            <div :class="$style.notificationActions">
              <button 
                v-if="!notification.is_read"
                @click.stop="markAsRead(notification)"
                :class="$style.actionBtn"
                :title="t('notifications.markAsRead')"
              >
                <i class="fas fa-check"></i>
              </button>
              <!-- <button 
                v-if="notification.action_url"
                @click.stop="goToAction(notification)"
                :class="[$style.actionBtn, $style.primaryAction]"
                :title="t('notifications.actions.goToSurvey')"
              >
                <i class="fas fa-arrow-right"></i>
              </button> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div :class="$style.pagination">
        <button 
          @click="goToPage(pagination.current - 1)"
          :disabled="pagination.current <= 1"
          :class="$style.paginationBtn"
        >
          <i class="fas fa-chevron-right"></i>
          {{ currentLanguage === 'ar' ? 'السابق' : 'Previous' }}
        </button>
        
        <div :class="$style.paginationInfo">
          {{ currentLanguage === 'ar' 
            ? `صفحة ${pagination.current} من ${pagination.totalPages}` 
            : `Page ${pagination.current} of ${pagination.totalPages}`
          }}
        </div>
        
        <button 
          @click="goToPage(pagination.current + 1)"
          :disabled="pagination.current >= pagination.totalPages"
          :class="$style.paginationBtn"
        >
          {{ currentLanguage === 'ar' ? 'التالي' : 'Next' }}
                    <i class="fas fa-chevron-left"></i>

        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { notificationService } from '../../services/notificationService'
import { NOTIFICATION_ICONS, PRIORITY_COLORS } from '../../types/notifications.types'
import type { Notification, NotificationStats, NotificationFilters } from '../../types/notifications.types'

// Store and router
const store = useAppStore()
const router = useRouter()

// Reactive state
const notifications = ref<Notification[]>([])
const notificationStats = ref<NotificationStats | null>(null)
const selectedNotifications = ref<string[]>([])
const isLoading = ref(false)
const isMarkingAllRead = ref(false)
const isBulkProcessing = ref(false)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const priorityFilter = ref('')

// Pagination
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// Computed
const currentLanguage = computed(() => store.currentLanguage)
const t = computed(() => store.t)

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.is_read).length
)

const notificationTypes = computed(() => {
  const types: Record<string, string> = {}
  Object.keys(NOTIFICATION_ICONS).forEach(type => {
    types[type] = t.value(`notifications.types.${type}`)
  })
  return types
})

const priorityOptions = computed(() => ({
  low: t.value('notifications.priorities.low'),
  normal: t.value('notifications.priorities.normal'),
  high: t.value('notifications.priorities.high'),
  urgent: t.value('notifications.priorities.urgent')
}))

// Methods
const loadNotifications = async (page = 1) => {
  isLoading.value = true
  try {
    const filters: NotificationFilters = {
      page,
      page_size: pagination.value.pageSize,
      lang: currentLanguage.value as 'en' | 'ar'
    }

    // Apply filters
    if (searchQuery.value) filters.search = searchQuery.value
    if (statusFilter.value === 'read') filters.is_read = true
    if (statusFilter.value === 'unread') filters.is_read = false
    if (typeFilter.value) filters.type = typeFilter.value as any
    if (priorityFilter.value) filters.priority = priorityFilter.value as any

    const response = await notificationService.getNotifications(filters)
    notifications.value = response.results
    
    pagination.value = {
      current: page,
      pageSize: pagination.value.pageSize,
      total: response.count,
      totalPages: Math.ceil(response.count / pagination.value.pageSize)
    }
  } catch (error) {
    console.error('Failed to load notifications:', error)
    notifications.value = []
  } finally {
    isLoading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await notificationService.getNotificationStats(currentLanguage.value as 'en' | 'ar')
    notificationStats.value = response.data!
  } catch (error) {
    console.error('Failed to load notification stats:', error)
  }
}

const refreshNotifications = async () => {
  await Promise.all([
    loadNotifications(pagination.value.current),
    loadStats()
  ])
}

const markAllAsRead = async () => {
  if (isMarkingAllRead.value) return
  
  isMarkingAllRead.value = true
  try {
    await notificationService.markAllAsRead(currentLanguage.value as 'en' | 'ar')
    notifications.value.forEach(n => n.is_read = true)
    selectedNotifications.value = []
    await loadStats()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  } finally {
    isMarkingAllRead.value = false
  }
}

const markAsRead = async (notification: Notification) => {
  try {
    await notificationService.updateNotification(notification.id, true)
    notification.is_read = true
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const handleNotificationClick = async (notification: Notification) => {
  await markAsRead(notification)
  if (notification.action_url) {
    router.push(notification.action_url)
  }
}

const toggleSelection = (notificationId: string) => {
  const index = selectedNotifications.value.indexOf(notificationId)
  if (index > -1) {
    selectedNotifications.value.splice(index, 1)
  } else {
    selectedNotifications.value.push(notificationId)
  }
}

const clearSelection = () => {
  selectedNotifications.value = []
}

const bulkMarkAsRead = async () => {
  if (isBulkProcessing.value) return
  
  isBulkProcessing.value = true
  try {
    await notificationService.bulkAction({
      notification_ids: selectedNotifications.value,
      action: 'mark_read'
    })
    
    notifications.value.forEach(n => {
      if (selectedNotifications.value.includes(n.id)) {
        n.is_read = true
      }
    })
    
    selectedNotifications.value = []
    await loadStats()
  } catch (error) {
    console.error('Failed to bulk mark as read:', error)
  } finally {
    isBulkProcessing.value = false
  }
}

const bulkDelete = async () => {
  if (isBulkProcessing.value) return
  
  const confirmed = window.confirm(
    currentLanguage.value === 'ar' 
      ? 'هل أنت متأكد من حذف الإشعارات المحددة؟'
      : 'Are you sure you want to delete the selected notifications?'
  )
  
  if (!confirmed) return
  
  isBulkProcessing.value = true
  try {
    await notificationService.bulkAction({
      notification_ids: selectedNotifications.value,
      action: 'delete'
    })
    
    notifications.value = notifications.value.filter(n => 
      !selectedNotifications.value.includes(n.id)
    )
    
    selectedNotifications.value = []
    await loadStats()
  } catch (error) {
    console.error('Failed to bulk delete:', error)
  } finally {
    isBulkProcessing.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadNotifications(page)
  }
}

const formatTime = (createdAt: string): string => {
  const lang = currentLanguage.value
  return lang === 'ar' 
    ? notificationService.formatNotificationTimeAr(createdAt)
    : notificationService.formatNotificationTime(createdAt)
}

const getNotificationIcon = (type: string): string => {
  return NOTIFICATION_ICONS[type as keyof typeof NOTIFICATION_ICONS] || 'fas fa-bell'
}

const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#3b82f6'
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadNotifications(1)
  }, 500)
}

// Watch filters
watch([statusFilter, typeFilter, priorityFilter], () => {
  loadNotifications(1)
})

// Lifecycle
onMounted(() => {
  refreshNotifications()
})
</script>

<style module src="./Notifications.module.css"></style>

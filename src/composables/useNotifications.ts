import { ref, computed } from 'vue'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/notifications.types'

// Global notification state
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const isLoading = ref(false)

export function useNotifications() {
  const loadRecentNotifications = async (lang: 'en' | 'ar' = 'en') => {
    isLoading.value = true
    try {
      const recent = await notificationService.getRecentNotifications(lang)
      notifications.value = recent
      
      const count = await notificationService.getUnreadCount()
      unreadCount.value = count
    } catch (error) {
      console.error('Failed to load notifications:', error)
      notifications.value = []
      unreadCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.updateNotification(notificationId, true)
      
      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  const markAllAsRead = async (lang: 'en' | 'ar' = 'en') => {
    try {
      await notificationService.markAllAsRead(lang)
      
      // Update local state
      notifications.value.forEach(n => {
        n.is_read = true
      })
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  const formatTime = (createdAt: string, lang: 'en' | 'ar' = 'en'): string => {
    return lang === 'ar' 
      ? notificationService.formatNotificationTimeAr(createdAt)
      : notificationService.formatNotificationTime(createdAt)
  }

  const refreshNotifications = (lang: 'en' | 'ar' = 'en') => {
    return loadRecentNotifications(lang)
  }

  return {
    // State
    notifications: computed(() => notifications.value),
    unreadCount: computed(() => unreadCount.value),
    isLoading: computed(() => isLoading.value),

    // Methods
    loadRecentNotifications,
    markAsRead,
    markAllAsRead,
    formatTime,
    refreshNotifications
  }
}

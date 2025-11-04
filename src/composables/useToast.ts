// Simple notification utility for security messages
import { ref } from 'vue'

export interface NotificationOptions {
  type: 'success' | 'warning' | 'error' | 'info'
  duration?: number
}

export interface Notification {
  id: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  duration: number
  timestamp: number
}

const notifications = ref<Notification[]>([])

let notificationId = 0

const addNotification = (message: string, options: NotificationOptions = { type: 'info' }): string => {
  const id = `notification-${++notificationId}`
  const notification: Notification = {
    id,
    message,
    type: options.type,
    duration: options.duration ?? 5000,
    timestamp: Date.now()
  }
  
  notifications.value.push(notification)
  
  // Auto remove after duration
  if (notification.duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, notification.duration)
  }
  
  return id
}

const removeNotification = (id: string): void => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const clearAllNotifications = (): void => {
  notifications.value.length = 0
}

// Convenience methods
export const showToast = (message: string, type: NotificationOptions['type'] = 'info', duration?: number) => {
  return addNotification(message, { type, duration })
}

export const showSuccess = (message: string, duration?: number) => {
  return addNotification(message, { type: 'success', duration })
}

export const showWarning = (message: string, duration?: number) => {
  return addNotification(message, { type: 'warning', duration })
}

export const showError = (message: string, duration?: number) => {
  return addNotification(message, { type: 'error', duration })
}

export const showInfo = (message: string, duration?: number) => {
  return addNotification(message, { type: 'info', duration })
}

// Composable
export const useNotifications = () => {
  return {
    notifications: notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showToast,
    showSuccess,
    showWarning,
    showError,
    showInfo
  }
}

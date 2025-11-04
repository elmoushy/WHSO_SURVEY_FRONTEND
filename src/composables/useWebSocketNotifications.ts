import { onMounted, onUnmounted, ref, computed, watch, type Ref } from 'vue'
import { websocketService, type NotificationWebSocketData, type ConnectionSuccessData, type UnreadCountData, type PongMessageData } from '../services/websocketService'
import { useSimpleAuth } from './useSimpleAuth'
import { logger } from '../utils/logger'

export interface UseWebSocketNotificationsOptions {
  autoConnect?: boolean
  showBrowserNotifications?: boolean
  subscribeToTypes?: string[]
}

export function useWebSocketNotifications(options: UseWebSocketNotificationsOptions = {}) {
  const {
    autoConnect = true,
    showBrowserNotifications = true,
    subscribeToTypes = []
  } = options

  const { isAuthenticated } = useSimpleAuth()

  // Local state for notifications received via WebSocket
  const realtimeNotifications: Ref<NotificationWebSocketData[]> = ref([])
  const hasNewNotifications = ref(false)

  // Computed properties from WebSocket service
  const isConnected = websocketService.isConnected
  const isConnecting = websocketService.isConnecting
  const connectionError = websocketService.connectionError
  const unreadCount = websocketService.unreadCount

  /**
   * Connect to WebSocket
   */
  const connect = async (): Promise<void> => {
    if (!websocketService.canConnect()) {
      const error = new Error('WebSocket feature is disabled')
      throw error
    }
    
    try {
      await websocketService.connect()
    } catch (error) {
      logger.error('Failed to connect to WebSocket:', error)
      throw error
    }
  }

  /**
   * Disconnect from WebSocket
   */
  const disconnect = (): void => {
    websocketService.disconnect()
  }

  /**
   * Mark notifications as read
   */
  const markAsRead = (notificationIds: string | string[]): void => {
    websocketService.markAsRead(notificationIds)
    
    // Update local state
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    realtimeNotifications.value.forEach(notification => {
      if (ids.includes(notification.id)) {
        notification.is_read = true
      }
    })
  }

  /**
   * Get current unread count
   */
  const refreshUnreadCount = (): void => {
    websocketService.getUnreadCount()
  }

  /**
   * Subscribe to notification types
   */
  const subscribeToNotificationTypes = (types: string[]): void => {
    websocketService.subscribeToTypes(types)
  }

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    return await websocketService.requestNotificationPermission()
  }

  /**
   * Clear all realtime notifications from local state
   */
  const clearRealtimeNotifications = (): void => {
    realtimeNotifications.value = []
    hasNewNotifications.value = false
  }

  /**
   * Handle new notification received
   */
  const handleNewNotification = (notification: NotificationWebSocketData): void => {
    logger.debug('New WebSocket notification received:', notification)
    
    // Add to local notifications array (prepend to show latest first)
    realtimeNotifications.value.unshift(notification)
    hasNewNotifications.value = true
    
    // Show browser notification if enabled and permission granted
    if (showBrowserNotifications) {
      showBrowserNotification(notification)
    }
    
    // Play notification sound (optional)
    playNotificationSound()
  }

  /**
   * Handle bulk notifications received
   */
  const handleBulkNotifications = (data: { notifications: NotificationWebSocketData[], count: number }): void => {
    logger.debug('Bulk WebSocket notifications received:', data.count)
    
    // Add all notifications to local array
    data.notifications.forEach(notification => {
      realtimeNotifications.value.unshift(notification)
    })
    
    hasNewNotifications.value = true
    
    // Show browser notifications for unread ones
    if (showBrowserNotifications) {
      data.notifications.forEach(notification => {
        if (!notification.is_read) {
          showBrowserNotification(notification)
        }
      })
    }
    
    playNotificationSound()
  }

  /**
   * Handle connection success
   */
  const handleConnectionSuccess = (data: ConnectionSuccessData): void => {
    logger.debug('WebSocket connection established:', data.message)
    
    // Subscribe to notification types if specified
    if (subscribeToTypes.length > 0) {
      subscribeToNotificationTypes(subscribeToTypes)
    }
  }

  /**
   * Handle unread count update
   */
  const handleUnreadCountUpdate = (data: UnreadCountData): void => {
    logger.debug('Unread count updated:', data.count)
  }

  /**
   * Handle connection error
   */
  const handleConnectionError = (error: any): void => {
    logger.error('WebSocket connection error:', error)
  }

  /**
   * Handle pong notification (notification delivered via pong message)
   */
  const handlePongNotification = (data: PongMessageData): void => {
    logger.debug('Pong notification received:', data)
    
    if (data.trigger === 'new_notification' && data.notification) {
      // This notification was already processed by handleNewNotification via the WebSocket service
      // But we can perform additional pong-specific handling here if needed
      
      // Add any specific pong notification handling logic here
      // For example, different UI feedback or logging
      logger.debug('Notification delivered via pong mechanism:', data.notification.title_localized)
    }
  }

  /**
   * Handle disconnection
   */
  const handleDisconnection = (event: any): void => {
    logger.debug('WebSocket disconnected:', event)
  }

  /**
   * Show browser notification
   */
  const showBrowserNotification = (_notification: NotificationWebSocketData): void => {
    // This is handled by the WebSocket service, but can be customized here if needed
  }

  /**
   * Play notification sound
   */
  const playNotificationSound = (): void => {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.1
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch {
      // Silent fail if audio context not supported
    }
  }

  /**
   * Set up event listeners
   */
  const setupEventListeners = (): void => {
    websocketService.on('notification', handleNewNotification)
    websocketService.on('bulk_notifications', handleBulkNotifications)
    websocketService.on('connection_success', handleConnectionSuccess)
    websocketService.on('unread_count', handleUnreadCountUpdate)
    websocketService.on('pong_notification', handlePongNotification)
    websocketService.on('error', handleConnectionError)
    websocketService.on('disconnect', handleDisconnection)
  }

  /**
   * Clean up event listeners
   */
  const cleanupEventListeners = (): void => {
    websocketService.off('notification', handleNewNotification)
    websocketService.off('bulk_notifications', handleBulkNotifications)
    websocketService.off('connection_success', handleConnectionSuccess)
    websocketService.off('unread_count', handleUnreadCountUpdate)
    websocketService.off('pong_notification', handlePongNotification)
    websocketService.off('error', handleConnectionError)
    websocketService.off('disconnect', handleDisconnection)
  }

  // Watch authentication state and auto-connect/disconnect
  watch(
    () => isAuthenticated.value,
    async (authenticated, wasAuthenticated) => {
      // Only auto-connect if:
      // 1. User is now authenticated
      // 2. Auto-connect is enabled
      // 3. This is a state change (not initial load)
      // 4. Connection is possible
      if (authenticated && autoConnect && wasAuthenticated !== undefined && websocketService.canConnect()) {
        try {
          await connect()
        } catch (error) {
          console.warn('Auto-connect failed:', error instanceof Error ? error.message : 'Unknown error')
        }
      } else if (!authenticated) {
        disconnect()
      }
    }
  )

  // Separate immediate check for already authenticated users
  // This runs after the composable is fully initialized
  setTimeout(() => {
    if (isAuthenticated.value && autoConnect && !isConnected.value && websocketService.canConnect()) {
      connect().catch(error => {
        console.warn('Delayed auto-connect failed:', error instanceof Error ? error.message : 'Unknown error')
      })
    }
  }, 100) // Small delay to ensure authentication state is ready

  // Setup lifecycle
  onMounted(() => {
    setupEventListeners()
    
    // Request browser notification permission on first mount
    if (showBrowserNotifications) {
      requestNotificationPermission()
    }
  })

  onUnmounted(() => {
    cleanupEventListeners()
    // Don't disconnect here - let other components continue using the service
  })

  return {
    // State
    realtimeNotifications: computed(() => realtimeNotifications.value),
    hasNewNotifications: computed(() => hasNewNotifications.value),
    isConnected,
    isConnecting,
    connectionError,
    unreadCount,
    
    // Methods
    connect,
    disconnect,
    markAsRead,
    refreshUnreadCount,
    subscribeToNotificationTypes,
    requestNotificationPermission,
    clearRealtimeNotifications,
    
    // Utility
    getConnectionStatus: () => websocketService.getStatus()
  }
}



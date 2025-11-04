import { ref, computed, type Ref } from 'vue'
import { getAccessToken } from './jwtAuthService'
import { debugWebSocket } from '../utils/websocketDebug'
import { envConfig } from '../utils/envConfig'
import { logger } from '../utils/logger'

export interface WebSocketMessage {
  type: string
  data?: any
  timestamp?: string
}

export interface NotificationWebSocketData {
  id: string
  recipient: number
  sender?: number
  sender_name?: string
  title: { en: string; ar: string }
  body: { en: string; ar: string }
  title_localized: string
  body_localized: string
  notification_type: string
  priority: string
  action_url?: string
  metadata?: Record<string, any>
  is_read: boolean
  created_at: string
  expires_at?: string | null
}

export interface ConnectionSuccessData {
  message: string
  user_id: number
  channel: string
  unread_count: number
  timestamp: string
}

export interface UnreadCountData {
  count: number
  timestamp: string
}

export interface PongMessageData {
  trigger?: string
  notification?: NotificationWebSocketData
  notification_id?: string
  timestamp?: string
}

class NotificationWebSocketService {
  private ws: WebSocket | null = null
  private baseUrl: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isIntentionalClose = false

  // Reactive state
  private _isConnected: Ref<boolean> = ref(false)
  private _isConnecting: Ref<boolean> = ref(false)
  private _connectionError: Ref<string | null> = ref(null)
  private _unreadCount: Ref<number> = ref(0)

  // Event listeners
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map()

  constructor() {
    // Get WebSocket base URL from environment
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000/ws'
    const notificationsEndpoint = import.meta.env.VITE_NOTIFICATIONS_ENDPOINT || '/notifications/'
    this.baseUrl = `${wsBaseUrl}${notificationsEndpoint}`
  }

  // Computed properties for reactive state
  get isConnected() {
    return computed(() => this._isConnected.value)
  }

  get isConnecting() {
    return computed(() => this._isConnecting.value)
  }

  get connectionError() {
    return computed(() => this._connectionError.value)
  }

  get unreadCount() {
    return computed(() => this._unreadCount.value)
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    // Check if WebSocket is enabled in configuration
    if (!envConfig.websocketEnabled) {
      const errorMessage = 'WebSocket is disabled in configuration'
      logger.debug('WebSocket connection skipped:', errorMessage)
      this._connectionError.value = errorMessage
      this._isConnecting.value = false
      return
    }

    const token = getAccessToken()
    if (!token) {
      const errorMessage = 'No authentication token available. Please login first.'
      logger.warn('WebSocket connection aborted:', errorMessage)
      
      // Debug authentication state
      debugWebSocket.checkAuthenticationState()
      
      this._connectionError.value = errorMessage
      this._isConnecting.value = false
      throw new Error(errorMessage)
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket already connected')
      return
    }

    // Clear any previous connection error
    this._connectionError.value = null

    this._isConnecting.value = true
    this._connectionError.value = null
    this.isIntentionalClose = false

    try {
      const wsUrl = `${this.baseUrl}?token=${token}`
      logger.debug('WebSocket connecting to:', wsUrl.replace(token, '[TOKEN]'))
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error)
      this._isConnecting.value = false
      this._connectionError.value = error instanceof Error ? error.message : 'Connection failed'
      throw error
    }
  }

  /**
   * Check if WebSocket connection can be established
   */
  canConnect(): boolean {
    // Check if WebSocket is enabled in configuration
    if (!envConfig.websocketEnabled) {
      return false
    }
    
    const token = getAccessToken()
    return !!token && this.ws?.readyState !== WebSocket.OPEN
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this._isConnected.value = false
    this._isConnecting.value = false
    this.reconnectAttempts = 0
  }

  /**
   * Send message to WebSocket server
   */
  private send(data: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      logger.error('WebSocket is not connected')
    }
  }

  /**
   * Mark notifications as read
   */
  markAsRead(notificationIds: string | string[]): void {
    this.send({
      type: 'mark_read',
      data: {
        notification_ids: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
      }
    })
  }

  /**
   * Get current unread count
   */
  getUnreadCount(): void {
    this.send({
      type: 'get_unread_count'
    })
  }

  /**
   * Subscribe to specific notification types
   */
  subscribeToTypes(types: string[]): void {
    this.send({
      type: 'subscribe_to_types',
      data: {
        notification_types: types
      }
    })
  }

  /**
   * Send ping to keep connection alive
   */
  private ping(): void {
    this.send({
      type: 'ping',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    logger.debug('WebSocket connected successfully')
    this._isConnected.value = true
    this._isConnecting.value = false
    this._connectionError.value = null
    this.reconnectAttempts = 0
    
    this.startHeartbeat()
    this.trigger('connect', event)
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      logger.debug('WebSocket message received:', message.type, message)
      
      switch (message.type) {
        case 'notification':
          this.handleNotificationMessage(message.data)
          break
        case 'bulk_notifications':
          this.handleBulkNotifications(message.data)
          break
        case 'connection_success':
          this.handleConnectionSuccess(message.data)
          break
        case 'unread_count':
          this.handleUnreadCount(message.data)
          break
        case 'mark_read_response':
          this.handleMarkReadResponse(message.data)
          break
        case 'error':
          this.handleServerError(message.data)
          break
        case 'pong':
          this.handlePongMessage(message.data)
          break
        default:
          logger.debug('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Handle single notification message
   */
  private handleNotificationMessage(data: NotificationWebSocketData): void {
    // Increment unread count
    this._unreadCount.value += 1
    
    // Show browser notification if permission granted
    this.showBrowserNotification(data)
    
    // Trigger event for components to handle
    this.trigger('notification', data)
  }

  /**
   * Handle bulk notifications
   */
  private handleBulkNotifications(data: { notifications: NotificationWebSocketData[], count: number }): void {
    // Update unread count
    const unreadNotifications = data.notifications.filter(n => !n.is_read)
    this._unreadCount.value += unreadNotifications.length
    
    // Show browser notifications
    data.notifications.forEach(notification => {
      if (!notification.is_read) {
        this.showBrowserNotification(notification)
      }
    })
    
    // Trigger event for components
    this.trigger('bulk_notifications', data)
  }

  /**
   * Handle connection success message
   */
  private handleConnectionSuccess(data: ConnectionSuccessData): void {
    logger.debug('WebSocket connection success:', data.message)
    this._unreadCount.value = data.unread_count
    this.trigger('connection_success', data)
  }

  /**
   * Handle unread count update
   */
  private handleUnreadCount(data: UnreadCountData): void {
    this._unreadCount.value = data.count
    this.trigger('unread_count', data)
  }

  /**
   * Handle mark as read response
   */
  private handleMarkReadResponse(data: any): void {
    if (data.success) {
      // Decrease unread count by the number of notifications marked as read
      this._unreadCount.value = Math.max(0, this._unreadCount.value - data.updated_count)
    }
    this.trigger('mark_read_response', data)
  }

  /**
   * Handle server error
   */
  private handleServerError(data: any): void {
    logger.error('WebSocket server error:', data)
    this._connectionError.value = data.message || 'Server error'
    this.trigger('error', data)
  }

  /**
   * Handle pong message - check for new notification trigger
   */
  private handlePongMessage(data: PongMessageData): void {
    logger.debug('🏓 Pong message received in WebSocket service:', data)
    
    // Regular heartbeat pong response - no action needed
    if (!data || !data.trigger) {
      logger.debug('🏓 Regular pong, no action needed')
      return
    }

    // Check if the pong is triggered by a new notification
    if (data.trigger === 'new_notification') {
      logger.debug('🔔 Pong triggered by new notification:', data)
      
      // If notification data is included, handle it as a complete notification
      if (data.notification) {
        logger.debug('📨 Handling complete notification from pong:', data.notification)
        this.handleNotificationMessage(data.notification)
      } else if (data.notification_id) {
        // If only notification_id is provided, create a minimal notification event
        // This will trigger the indicator and force a refresh of notifications
        logger.debug('📨 New notification ID received via pong:', data.notification_id)
        
        // Increment unread count since we know there's a new notification
        this._unreadCount.value += 1
        logger.debug('📊 Incremented unread count to:', this._unreadCount.value)
      }
      
      // Always trigger the pong notification event for UI updates
      logger.debug('🎯 Triggering pong_notification event for UI')
      this.trigger('pong_notification', {
        trigger: data.trigger,
        notification_id: data.notification_id,
        timestamp: data.timestamp,
        notification: data.notification
      })
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    logger.debug('WebSocket closed:', event.code, event.reason)
    this._isConnected.value = false
    this._isConnecting.value = false
    this.stopHeartbeat()
    
    this.trigger('disconnect', event)
    
    // Only reconnect if not intentionally closed and within retry limits
    if (!this.isIntentionalClose && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else if (event.code === 4001 || event.code === 4003) {
      // Authentication errors - don't reconnect
      this._connectionError.value = event.code === 4001 ? 'Authentication failed' : 'Token expired'
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error:', event)
    this._connectionError.value = 'Connection error'
    this.trigger('error', event)
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000)
    
    logger.debug(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (!this.isIntentionalClose) {
        this.connect().catch(error => {
          logger.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat() // Clear any existing interval
    this.heartbeatInterval = setInterval(() => {
      this.ping()
    }, 30000) // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Show browser notification if permission granted
   */
  private showBrowserNotification(notification: NotificationWebSocketData): void {
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title_localized, {
          body: notification.body_localized,
          icon: '/favicon.ico',
          tag: notification.id, // Prevents duplicate notifications
          requireInteraction: notification.priority === 'high'
        })
      } catch (error) {
        logger.error('Failed to show browser notification:', error)
      }
    }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (envConfig.websocketEnabled) {
        logger.debug('Browser notification permission:', permission)
      }
      return permission
    }
    return 'denied'
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (envConfig.websocketEnabled) {
      logger.debug(`🔗 [WebSocket] Adding event listener for: ${event}`)
    }
    
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    
    this.eventListeners.get(event)!.push(callback)
    
    if (envConfig.websocketEnabled) {
      logger.debug(`🔗 [WebSocket] Total listeners for ${event}: ${this.eventListeners.get(event)!.length}`)
      logger.debug(`🔗 [WebSocket] All registered events:`, Array.from(this.eventListeners.keys()))
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Remove all event listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event)
    } else {
      this.eventListeners.clear()
    }
  }

  /**
   * Trigger event listeners
   */
  private trigger(event: string, data: any): void {
    logger.debug(`🎯 [WebSocket] Triggering event: ${event}`, { 
      event, 
      data, 
      hasListeners: this.eventListeners.has(event),
      listenerCount: this.eventListeners.get(event)?.length || 0
    })
    
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!
      logger.debug(`🎯 [WebSocket] Found ${callbacks.length} listeners for ${event}`)
      
      callbacks.forEach((callback, index) => {
        try {
          logger.debug(`🎯 [WebSocket] Calling listener ${index + 1}/${callbacks.length} for ${event}`)
          callback(data)
        } catch (error) {
          logger.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
    } else {
      logger.debug(`⚠️ [WebSocket] No listeners found for event: ${event}`)
    }
  }

  /**
   * Get connection status information
   */
  getStatus() {
    return {
      isConnected: this._isConnected.value,
      isConnecting: this._isConnecting.value,
      connectionError: this._connectionError.value,
      unreadCount: this._unreadCount.value,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  /**
   * Test method to simulate pong message for debugging
   */
  simulatePongMessage(data: PongMessageData) {
    logger.debug('🧪 [WebSocket] Simulating pong message:', data)
    this.handlePongMessage(data)
  }

  /**
   * Test method to expose private trigger method for debugging
   */
  testTrigger(event: string, data: any) {
    logger.debug('🧪 [WebSocket] Test triggering event:', event, data)
    this.trigger(event, data)
  }
}

// Export singleton instance
export const websocketService = new NotificationWebSocketService()
export default websocketService


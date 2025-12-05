import { ref, computed, type Ref } from 'vue'
import { getAccessToken } from './jwtAuthService'
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

// Chat-specific event types
export enum ChatEventType {
  CONNECTION_ESTABLISHED = 'connection.established',
  MESSAGE_NEW = 'message.new',
  MESSAGE_UPDATED = 'message.updated',
  MESSAGE_DELETED = 'message.deleted',
  TYPING_START = 'typing.start',
  TYPING_STOP = 'typing.stop',
  RECEIPT_READ = 'receipt.read',
  REACTION_ADDED = 'reaction.added',
  REACTION_REMOVED = 'reaction.removed',
  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',
  THREAD_UPDATED = 'thread.updated',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error'
}

// Chat WebSocket message data interfaces
export interface ChatMessage {
  id: string
  thread_id: string
  sender: {
    id: number
    username: string
    first_name: string
    last_name: string
    avatar?: string
  }
  content: string
  created_at: string
  updated_at: string
  edited_at?: string
  deleted_at?: string
  reply_to?: string
  has_attachments: boolean
  attachments?: any[]
  reactions: Array<{
    emoji: string
    users: Array<{ id: number; username: string }>
  }>
}

class NotificationWebSocketService {
  // Chat WebSocket
  private chatWs: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private chatHeartbeatInterval: NodeJS.Timeout | null = null
  private isChatIntentionalClose = false
  private currentThreadId: string | null = null

  // Global Notification WebSocket
  private notificationWs: WebSocket | null = null
  private notificationHeartbeatInterval: NodeJS.Timeout | null = null
  private isNotificationIntentionalClose = false
  private notificationReconnectAttempts = 0
  
  // Token-aware reconnection settings
  private readonly TOKEN_RETRY_DELAY = 10000 // 10 seconds - wait for token refresh
  private readonly MAX_TOKEN_RETRIES = 6 // Max 6 retries (1 minute total)
  private notificationTokenRetries = 0
  private chatTokenRetries = 0
  private notificationReconnectTimer: NodeJS.Timeout | null = null
  private chatReconnectTimer: NodeJS.Timeout | null = null

  // Reactive state
  private _isConnected: Ref<boolean> = ref(false)
  private _isConnecting: Ref<boolean> = ref(false)
  private _connectionError: Ref<string | null> = ref(null)
  private _isNotificationConnected: Ref<boolean> = ref(false)

  // Event listeners
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map()

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

  get isNotificationConnected() {
    return computed(() => this._isNotificationConnected.value)
  }

  // ============================================
  // EVENT HANDLING METHODS
  // ============================================

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    
    this.eventListeners.get(event)!.push(callback)
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
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event)!
      
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error)
        }
      })
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
      reconnectAttempts: this.reconnectAttempts,
      currentThreadId: this.currentThreadId
    }
  }

  // ============================================
  // CHAT WEBSOCKET METHODS
  // ============================================

  /**
   * Connect to chat WebSocket for a specific thread
   * Includes token-aware retry logic for handling token refresh scenarios
   */
  async connectToChat(threadId: string): Promise<void> {
    if (!envConfig.websocketEnabled) {
      const errorMessage = 'WebSocket is disabled in configuration'
      logger.debug('Chat WebSocket connection skipped:', errorMessage)
      return
    }

    // Clear any pending reconnect timer
    if (this.chatReconnectTimer) {
      clearTimeout(this.chatReconnectTimer)
      this.chatReconnectTimer = null
    }

    // Try to get token from jwtAuthService first, fallback to localStorage
    let token = getAccessToken()
    if (!token) {
      // Fallback to localStorage for compatibility
      token = localStorage.getItem('access_token')
    }
    
    if (!token) {
      // Token not available - likely being refreshed
      // Schedule retry after TOKEN_RETRY_DELAY
      if (this.chatTokenRetries < this.MAX_TOKEN_RETRIES) {
        this.chatTokenRetries++
        logger.warn(`Chat WebSocket: No token, scheduling retry ${this.chatTokenRetries}/${this.MAX_TOKEN_RETRIES}`)
        
        // Store threadId for retry
        this.currentThreadId = threadId
        
        this.chatReconnectTimer = setTimeout(() => {
          this.connectToChat(threadId).catch(error => {
            logger.error('Chat WebSocket retry failed:', error)
          })
        }, this.TOKEN_RETRY_DELAY)
        
        return // Don't throw error, just wait and retry
      } else {
        // Max retries exceeded
        const errorMessage = 'No authentication token available for chat after max retries'
        console.error(`❌ [Chat WebSocket] ${errorMessage}`)
        logger.error(errorMessage)
        this.chatTokenRetries = 0 // Reset for future attempts
        throw new Error(errorMessage)
      }
    }

    // Token available - reset token retry counter
    this.chatTokenRetries = 0

    // Disconnect from previous thread if connected
    if (this.chatWs && this.currentThreadId !== threadId) {
      this.disconnectFromChat()
    }

    if (this.chatWs?.readyState === WebSocket.OPEN && this.currentThreadId === threadId) {
      logger.debug('Chat WebSocket already connected to this thread')
      return
    }

    this.isChatIntentionalClose = false
    this.currentThreadId = threadId

    try {
      // Use VITE_WS_URL for proper environment-based WebSocket URL
      let wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
      if (wsBaseUrl.endsWith('/')) {
        wsBaseUrl = wsBaseUrl.slice(0, -1)
      }
      const wsUrl = `${wsBaseUrl}/ws/internal-chat/threads/${threadId}/?token=${token}`
      logger.debug('Chat WebSocket connecting to:', wsUrl.replace(token, '[TOKEN]'))
      
      this.chatWs = new WebSocket(wsUrl)
      
      this.chatWs.onopen = this.handleChatOpen.bind(this)
      this.chatWs.onmessage = this.handleChatMessage.bind(this)
      this.chatWs.onclose = this.handleChatClose.bind(this)
      this.chatWs.onerror = this.handleChatError.bind(this)

    } catch (error) {
      logger.error('Failed to create chat WebSocket connection:', error)
      this.currentThreadId = null
      throw error
    }
  }

  /**
   * Disconnect from chat WebSocket
   */
  disconnectFromChat(): void {
    this.isChatIntentionalClose = true
    this.stopChatHeartbeat()
    
    // Clear any pending reconnect timers
    if (this.chatReconnectTimer) {
      clearTimeout(this.chatReconnectTimer)
      this.chatReconnectTimer = null
    }
    
    // Reset retry counters
    this.reconnectAttempts = 0
    this.chatTokenRetries = 0
    
    if (this.chatWs) {
      this.chatWs.close(1000, 'Client disconnect')
      this.chatWs = null
    }
    
    this.currentThreadId = null
  }

  /**
   * Send message to chat WebSocket
   */
  private sendChat(data: any): void {
    if (this.chatWs && this.chatWs.readyState === WebSocket.OPEN) {
      this.chatWs.send(JSON.stringify(data))
      logger.debug('📤 Chat message sent:', data.type)
    } else {
      logger.error('Chat WebSocket is not connected')
    }
  }

  /**
   * Send a chat message
   */
  sendChatMessage(content: string, replyToId?: string, attachmentIds?: string[]): void {
    this.sendChat({
      type: 'message.send',
      content: content,
      reply_to: replyToId,
      attachment_ids: attachmentIds || []
    })
  }

  /**
   * Send pong response to server ping
   */
  private sendChatPong(): void {
    this.sendChat({
      type: 'pong'
    })
  }

  /**
   * Start typing indicator
   */
  startTyping(): void {
    this.sendChat({ type: 'typing.start' })
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    this.sendChat({ type: 'typing.stop' })
  }

  /**
   * Mark message as read
   */
  markChatMessageAsRead(messageId: string): void {
    this.sendChat({
      type: 'message.read',
      message_id: messageId
    })
  }

  /**
   * Add reaction to chat message
   */
  addChatReaction(messageId: string, emoji: string): void {
    this.sendChat({
      type: 'reaction.add',
      message_id: messageId,
      emoji: emoji
    })
  }

  /**
   * Remove reaction from chat message
   */
  removeChatReaction(messageId: string, emoji: string): void {
    this.sendChat({
      type: 'reaction.remove',
      message_id: messageId,
      emoji: emoji
    })
  }

  /**
   * Handle chat WebSocket open event
   */
  private handleChatOpen(_event: Event): void {
    logger.debug('✅ Chat WebSocket connected successfully')
    
    // Reset ALL retry counters on successful connection
    this.reconnectAttempts = 0
    this.chatTokenRetries = 0
    
    // Clear any pending reconnect timer
    if (this.chatReconnectTimer) {
      clearTimeout(this.chatReconnectTimer)
      this.chatReconnectTimer = null
    }
    
    this.startChatHeartbeat()
    this.trigger('chat.connected', { threadId: this.currentThreadId })
  }

  /**
   * Handle incoming chat WebSocket messages
   */
  private handleChatMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      logger.debug('📨 Chat message received:', data.type, data)
      
      // Log full data for debugging
      if (data.type === ChatEventType.MESSAGE_NEW) {
        logger.debug('📩 New message data structure:', JSON.stringify(data, null, 2))
      }
      
      // Handle chat unread count updates (support both event names from backend)
      if (data.type === 'chat.unread.update' || data.type === 'chat.unread.count.update') {
        // Always trigger as 'chat.unread.update' for consistency
        this.trigger('chat.unread.update', data)
        return
      }
      
      // Trigger specific event based on message type
      switch (data.type) {
        case ChatEventType.CONNECTION_ESTABLISHED:
          this.trigger('chat.connection.established', data)
          break
        case ChatEventType.MESSAGE_NEW:
          this.trigger('chat.message.new', data)
          break
        case ChatEventType.MESSAGE_UPDATED:
          this.trigger('chat.message.updated', data)
          break
        case ChatEventType.MESSAGE_DELETED:
          this.trigger('chat.message.deleted', data)
          break
        case ChatEventType.TYPING_START:
          this.trigger('chat.typing.start', data)
          break
        case ChatEventType.TYPING_STOP:
          this.trigger('chat.typing.stop', data)
          break
        case ChatEventType.RECEIPT_READ:
          this.trigger('chat.receipt.read', data)
          break
        case ChatEventType.REACTION_ADDED:
          this.trigger('chat.reaction.added', data)
          break
        case ChatEventType.REACTION_REMOVED:
          this.trigger('chat.reaction.removed', data)
          break
        case ChatEventType.MEMBER_ADDED:
          this.trigger('chat.member.added', data)
          break
        case ChatEventType.MEMBER_REMOVED:
          this.trigger('chat.member.removed', data)
          break
        case ChatEventType.THREAD_UPDATED:
          this.trigger('chat.thread.updated', data)
          break
        case ChatEventType.PING:
          // Respond to ping with pong
          logger.debug('📡 Received ping, sending pong')
          this.sendChatPong()
          this.trigger('chat.ping', data)
          break
        case ChatEventType.PONG:
          // Pong received from server
          logger.debug('📡 Received pong from server')
          this.trigger('chat.pong', data)
          break
        case ChatEventType.ERROR:
          // Only log as error if it's not about ping/pong
          if (data.message && data.message.toLowerCase().includes('ping')) {
            logger.debug('Ignoring ping-related error message:', data.message)
          } else {
            logger.error('Chat WebSocket error:', data.message)
            this.trigger('chat.error', data)
          }
          break
        default:
          // Log unknown types but don't treat as critical error
          logger.debug('Unhandled chat message type:', data.type)
          // Still trigger the event in case someone is listening for it
          this.trigger(`chat.${data.type}`, data)
          break
      }
    } catch (error) {
      logger.error('Failed to parse chat WebSocket message:', error)
    }
  }

  /**
   * Handle chat WebSocket close event
   * Includes smart reconnection logic for token expiry scenarios
   */
  private handleChatClose(event: CloseEvent): void {
    logger.debug('🔌 Chat WebSocket closed:', event.code, event.reason)
    this.stopChatHeartbeat()
    
    // Determine if this is a token-related closure
    const isTokenRelatedClosure = 
      event.code === 1006 || // Abnormal closure (often auth issues)
      event.code === 4001 || // Custom: unauthorized
      event.code === 4003 || // Custom: forbidden
      event.code === 3000 || // Custom: token expired
      (event.reason && event.reason.toLowerCase().includes('token')) ||
      (event.reason && event.reason.toLowerCase().includes('auth'))
    
    this.trigger('chat.disconnected', { 
      code: event.code, 
      reason: event.reason,
      threadId: this.currentThreadId
    })
    
    // Only reconnect if not intentionally closed
    if (!this.isChatIntentionalClose && this.currentThreadId) {
      if (isTokenRelatedClosure) {
        // Token-related closure - use longer delay to allow token refresh
        logger.warn('Token-related chat WebSocket closure, scheduling delayed reconnect')
        
        // Clear any existing timer
        if (this.chatReconnectTimer) {
          clearTimeout(this.chatReconnectTimer)
        }
        
        // Reset standard reconnect attempts
        this.reconnectAttempts = 0
        
        const threadIdToReconnect = this.currentThreadId
        this.chatReconnectTimer = setTimeout(() => {
          this.connectToChat(threadIdToReconnect).catch((error) => {
            logger.error('Chat reconnection after token refresh failed:', error)
          })
        }, this.TOKEN_RETRY_DELAY)
        
      } else if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        // Standard reconnection with exponential backoff
        this.scheduleChatReconnect()
      }
    }
  }

  /**
   * Handle chat WebSocket error event
   */
  private handleChatError(event: Event): void {
    logger.error('❌ Chat WebSocket error:', event)
    this.trigger('chat.error', { event })
  }

  /**
   * Schedule chat reconnection with exponential backoff
   */
  private scheduleChatReconnect(): void {
    if (!this.currentThreadId) return

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000)
    
    logger.debug(`🔄 Scheduling chat WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (!this.isChatIntentionalClose && this.currentThreadId) {
        this.connectToChat(this.currentThreadId).catch(error => {
          logger.error('Chat reconnection failed:', error)
        })
      }
    }, delay)
  }

  /**
   * Start heartbeat for chat connection
   */
  private startChatHeartbeat(): void {
    this.stopChatHeartbeat()
    this.chatHeartbeatInterval = setInterval(() => {
      if (this.chatWs && this.chatWs.readyState === WebSocket.OPEN) {
        this.sendChat({ type: 'ping' })
      }
    }, 30000)
  }

  /**
   * Stop chat heartbeat
   */
  private stopChatHeartbeat(): void {
    if (this.chatHeartbeatInterval) {
      clearInterval(this.chatHeartbeatInterval)
      this.chatHeartbeatInterval = null
    }
  }

  /**
   * Check if chat WebSocket is connected
   */
  isChatConnected(): boolean {
    return this.chatWs?.readyState === WebSocket.OPEN
  }

  /**
   * Get current chat thread ID
   */
  getCurrentChatThreadId(): string | null {
    return this.currentThreadId
  }

  // ============================================
  // GLOBAL NOTIFICATION WEBSOCKET METHODS
  // ============================================

  /**
   * Connect to global notification WebSocket
   * This connection receives all notifications including chat unread updates
   * Includes token-aware retry logic for handling token refresh scenarios
   */
  async connectToNotifications(): Promise<void> {
    if (this.notificationWs?.readyState === WebSocket.OPEN) {
      logger.debug('Notification WebSocket already connected')
      return
    }

    // Clear any pending reconnect timer
    if (this.notificationReconnectTimer) {
      clearTimeout(this.notificationReconnectTimer)
      this.notificationReconnectTimer = null
    }

    // Get JWT token from the auth service (in-memory token after initialization)
    let token = getAccessToken()
    
    if (!token) {
      // Token not available - likely being refreshed
      // Schedule retry after TOKEN_RETRY_DELAY
      if (this.notificationTokenRetries < this.MAX_TOKEN_RETRIES) {
        this.notificationTokenRetries++
        logger.warn(`Notification WebSocket: No token, scheduling retry ${this.notificationTokenRetries}/${this.MAX_TOKEN_RETRIES}`)
        
        this.notificationReconnectTimer = setTimeout(() => {
          this.connectToNotifications().catch(error => {
            logger.error('Notification WebSocket retry failed:', error)
            // Trigger error event so UI can update state
            this.trigger('notification.error', { message: error.message || 'Connection failed' })
          })
        }, this.TOKEN_RETRY_DELAY)
        
        return // Don't throw error, just wait and retry
      } else {
        // Max retries exceeded
        const errorMessage = 'No authentication token available for notification WebSocket after max retries'
        console.error(`❌ [WebSocket] ${errorMessage}`)
        logger.error(errorMessage)
        this.notificationTokenRetries = 0 // Reset for future attempts
        throw new Error(errorMessage)
      }
    }

    // Token available - reset token retry counter
    this.notificationTokenRetries = 0
    this.isNotificationIntentionalClose = false

    try {
      let wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
      if (wsBaseUrl.endsWith('/')) {
        wsBaseUrl = wsBaseUrl.slice(0, -1)
      }
      const wsUrl = `${wsBaseUrl}/ws/notifications/?token=${token}`
      
      logger.debug('Notification WebSocket connecting to:', wsUrl.replace(token, '[TOKEN]'))
      
      this.notificationWs = new WebSocket(wsUrl)
      
      this.notificationWs.onopen = this.handleNotificationOpen.bind(this)
      this.notificationWs.onmessage = this.handleNotificationMessage.bind(this)
      this.notificationWs.onclose = this.handleNotificationClose.bind(this)
      this.notificationWs.onerror = this.handleNotificationError.bind(this)
      
      this._isNotificationConnected.value = true
    } catch (error) {
      logger.error('Failed to create notification WebSocket connection:', error)
      throw error
    }
  }

  /**
   * Disconnect from notification WebSocket
   */
  disconnectFromNotifications(): void {
    this.isNotificationIntentionalClose = true
    this.stopNotificationHeartbeat()
    
    // Clear any pending reconnect timers
    if (this.notificationReconnectTimer) {
      clearTimeout(this.notificationReconnectTimer)
      this.notificationReconnectTimer = null
    }
    
    // Reset retry counters
    this.notificationReconnectAttempts = 0
    this.notificationTokenRetries = 0
    
    if (this.notificationWs) {
      this.notificationWs.close(1000, 'Client disconnect')
      this.notificationWs = null
    }
    
    this._isNotificationConnected.value = false
  }

  /**
   * Handle notification WebSocket open
   */
  private handleNotificationOpen(_event: Event): void {
    logger.debug('✅ Notification WebSocket connected successfully')
    this._isNotificationConnected.value = true
    
    // Reset ALL retry counters on successful connection
    this.notificationReconnectAttempts = 0
    this.notificationTokenRetries = 0
    
    // Clear any pending reconnect timer
    if (this.notificationReconnectTimer) {
      clearTimeout(this.notificationReconnectTimer)
      this.notificationReconnectTimer = null
    }
    
    this.startNotificationHeartbeat()
    this.trigger('notification.connected', { timestamp: new Date().toISOString() })
  }

  /**
   * Handle incoming notification WebSocket messages
   */
  private handleNotificationMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      logger.debug('📨 Notification message received:', data.type, data)
      
      // Handle specific message types
      if (data.type === 'notification.count') {
        // New simplified notification count update
        this.trigger('notification.count', data)
      } else if (data.type === 'chat.unread.update' || data.type === 'chat.unread.count.update') {
        // Handle chat unread count updates (support both event names from backend)
        // Always trigger as 'chat.unread.update' for consistency
        this.trigger('chat.unread.update', data)
      } else if (data.type === 'unread.counts.initial') {
        this.trigger('unread.counts.initial', data)
      } else if (data.type === 'connection.success') {
        this.trigger('notification.connection.success', data)
      } else if (data.type === 'ping') {
        // Respond to server ping with pong
        logger.debug('📡 Received ping, sending pong')
        if (this.notificationWs && this.notificationWs.readyState === WebSocket.OPEN) {
          this.notificationWs.send(JSON.stringify({ type: 'pong' }))
        }
      } else {
        // Trigger generic event for any other message type
        this.trigger(`notification.${data.type}`, data)
        this.trigger('notification.message', data)
      }
    } catch (error) {
      logger.error('Failed to parse notification WebSocket message:', error)
    }
  }

  /**
   * Handle notification WebSocket close
   * Includes smart reconnection logic for token expiry scenarios
   */
  private handleNotificationClose(event: CloseEvent): void {
    this._isNotificationConnected.value = false
    this.stopNotificationHeartbeat()
    
    logger.debug('Notification WebSocket closed:', event.code, event.reason)
    
    // Determine if this is a token-related closure
    // Common codes: 1006 = abnormal closure, 4001/4003 = auth failure (custom)
    const isTokenRelatedClosure = 
      event.code === 1006 || // Abnormal closure (often auth issues)
      event.code === 4001 || // Custom: unauthorized
      event.code === 4003 || // Custom: forbidden
      event.code === 3000 || // Custom: token expired
      (event.reason && event.reason.toLowerCase().includes('token')) ||
      (event.reason && event.reason.toLowerCase().includes('auth'))
    
    if (!this.isNotificationIntentionalClose) {
      if (isTokenRelatedClosure) {
        // Token-related closure - use longer delay to allow token refresh
        logger.warn('Token-related WebSocket closure, scheduling delayed reconnect')
        
        // Clear any existing timer
        if (this.notificationReconnectTimer) {
          clearTimeout(this.notificationReconnectTimer)
        }
        
        // Reset standard reconnect attempts but track token retries
        this.notificationReconnectAttempts = 0
        
        this.notificationReconnectTimer = setTimeout(() => {
          this.connectToNotifications().catch((error) => {
            logger.error('Notification reconnection after token refresh failed:', error)
            // Trigger error event so UI can update state
            this.trigger('notification.error', { message: error.message || 'Reconnection failed' })
          })
        }, this.TOKEN_RETRY_DELAY)
        
      } else if (this.notificationReconnectAttempts < this.maxReconnectAttempts) {
        // Standard reconnection with exponential backoff
        logger.debug('Attempting to reconnect notification WebSocket...')
        this.scheduleNotificationReconnect()
      } else {
        logger.error('Max notification WebSocket reconnection attempts reached')
      }
    }
    
    this.trigger('notification.disconnected', { code: event.code, reason: event.reason })
  }

  /**
   * Handle notification WebSocket error
   */
  private handleNotificationError(event: Event): void {
    logger.error('Notification WebSocket error:', event)
    this.trigger('notification.error', { event })
  }

  /**
   * Schedule notification WebSocket reconnection
   */
  private scheduleNotificationReconnect(): void {
    this.notificationReconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.notificationReconnectAttempts - 1)
    
    logger.debug(`Scheduling notification reconnection in ${delay}ms (attempt ${this.notificationReconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (!this.isNotificationIntentionalClose && this.notificationReconnectAttempts <= this.maxReconnectAttempts) {
        this.connectToNotifications().catch((error) => {
          logger.error('Notification reconnection failed:', error)
        })
      }
    }, delay)
  }

  /**
   * Start heartbeat for notification connection
   */
  private startNotificationHeartbeat(): void {
    this.stopNotificationHeartbeat()
    this.notificationHeartbeatInterval = setInterval(() => {
      if (this.notificationWs && this.notificationWs.readyState === WebSocket.OPEN) {
        this.notificationWs.send(JSON.stringify({ type: 'ping' }))
        logger.debug('📡 Sent ping to notification WebSocket')
      }
    }, 30000) // Ping every 30 seconds
  }

  /**
   * Stop notification heartbeat
   */
  private stopNotificationHeartbeat(): void {
    if (this.notificationHeartbeatInterval) {
      clearInterval(this.notificationHeartbeatInterval)
      this.notificationHeartbeatInterval = null
    }
  }

  /**
   * Check if notification WebSocket is connected
   */
  isNotificationWsConnected(): boolean {
    return this.notificationWs?.readyState === WebSocket.OPEN
  }

  /**
   * Force reconnection with fresh token
   * Call this after token refresh to reconnect immediately with new token
   */
  async reconnectWithFreshToken(): Promise<void> {
    // Reset all retry counters
    this.notificationTokenRetries = 0
    this.chatTokenRetries = 0
    this.notificationReconnectAttempts = 0
    this.reconnectAttempts = 0
    
    // Clear all pending timers
    if (this.notificationReconnectTimer) {
      clearTimeout(this.notificationReconnectTimer)
      this.notificationReconnectTimer = null
    }
    if (this.chatReconnectTimer) {
      clearTimeout(this.chatReconnectTimer)
      this.chatReconnectTimer = null
    }
    
    // Reconnect notification WebSocket
    if (this.notificationWs) {
      this.isNotificationIntentionalClose = false
      this.notificationWs.close(1000, 'Token refresh')
      this.notificationWs = null
    }
    
    try {
      await this.connectToNotifications()
      logger.debug('Notification WebSocket reconnected with fresh token')
    } catch (error) {
      logger.error('Failed to reconnect notification WebSocket:', error)
    }
    
    // Reconnect chat WebSocket if there was an active thread
    if (this.currentThreadId) {
      const threadId = this.currentThreadId
      this.isChatIntentionalClose = false
      
      if (this.chatWs) {
        this.chatWs.close(1000, 'Token refresh')
        this.chatWs = null
      }
      
      try {
        await this.connectToChat(threadId)
        logger.debug('Chat WebSocket reconnected with fresh token')
      } catch (error) {
        logger.error('Failed to reconnect chat WebSocket:', error)
      }
    }
  }

  /**
   * Get detailed status information including retry counters
   */
  getDetailedStatus() {
    return {
      notification: {
        isConnected: this._isNotificationConnected.value,
        reconnectAttempts: this.notificationReconnectAttempts,
        tokenRetries: this.notificationTokenRetries,
        hasPendingReconnect: !!this.notificationReconnectTimer
      },
      chat: {
        isConnected: this.chatWs?.readyState === WebSocket.OPEN,
        currentThreadId: this.currentThreadId,
        reconnectAttempts: this.reconnectAttempts,
        tokenRetries: this.chatTokenRetries,
        hasPendingReconnect: !!this.chatReconnectTimer
      },
      settings: {
        tokenRetryDelay: this.TOKEN_RETRY_DELAY,
        maxTokenRetries: this.MAX_TOKEN_RETRIES,
        maxReconnectAttempts: this.maxReconnectAttempts
      }
    }
  }
}

// Export singleton instance
export const websocketService = new NotificationWebSocketService()
export default websocketService


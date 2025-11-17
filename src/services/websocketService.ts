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
      reconnectAttempts: this.reconnectAttempts,
      currentThreadId: this.currentThreadId
    }
  }

  // ============================================
  // CHAT WEBSOCKET METHODS
  // ============================================

  /**
   * Connect to chat WebSocket for a specific thread
   */
  async connectToChat(threadId: string): Promise<void> {
    if (!envConfig.websocketEnabled) {
      const errorMessage = 'WebSocket is disabled in configuration'
      logger.debug('Chat WebSocket connection skipped:', errorMessage)
      return
    }

    // Try to get token from jwtAuthService first, fallback to localStorage
    let token = getAccessToken()
    if (!token) {
      // Fallback to localStorage for compatibility
      token = localStorage.getItem('access_token')
    }
    
    if (!token) {
      const errorMessage = 'No authentication token available for chat'
      logger.warn('Chat WebSocket connection aborted:', errorMessage)
      throw new Error(errorMessage)
    }

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
      const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
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
      
      // Handle chat unread count updates
      if (data.type === 'chat.unread.update') {
        console.log('📨 Received:', {
          type: data.type,
          thread_id: data.thread_id,
          unread_count: data.unread_count,
          total_unread: data.total_unread
        })
        this.trigger('chat.unread.update', data)
        return
      }
      
      // Trigger specific event based on message type
      switch (data.type) {
        case ChatEventType.CONNECTION_ESTABLISHED:
        case 'connection.established':
          console.log('✅ Connected to notification WebSocket')
          this.trigger('chat.connection.established', data)
          break
        case ChatEventType.MESSAGE_NEW:
        case 'message.new':
          this.trigger('chat.message.new', data)
          break
        case ChatEventType.MESSAGE_UPDATED:
        case 'message.updated':
          this.trigger('chat.message.updated', data)
          break
        case ChatEventType.MESSAGE_DELETED:
        case 'message.deleted':
          this.trigger('chat.message.deleted', data)
          break
        case ChatEventType.TYPING_START:
        case 'typing.start':
          this.trigger('chat.typing.start', data)
          break
        case ChatEventType.TYPING_STOP:
        case 'typing.stop':
          this.trigger('chat.typing.stop', data)
          break
        case ChatEventType.RECEIPT_READ:
        case 'receipt.read':
          this.trigger('chat.receipt.read', data)
          break
        case ChatEventType.REACTION_ADDED:
        case 'reaction.added':
          this.trigger('chat.reaction.added', data)
          break
        case ChatEventType.REACTION_REMOVED:
        case 'reaction.removed':
          this.trigger('chat.reaction.removed', data)
          break
        case ChatEventType.MEMBER_ADDED:
        case 'member.added':
          this.trigger('chat.member.added', data)
          break
        case ChatEventType.MEMBER_REMOVED:
        case 'member.removed':
          this.trigger('chat.member.removed', data)
          break
        case ChatEventType.THREAD_UPDATED:
        case 'thread.updated':
          this.trigger('chat.thread.updated', data)
          break
        case ChatEventType.PING:
        case 'ping':
          // Respond to ping with pong
          logger.debug('📡 Received ping, sending pong')
          this.sendChatPong()
          this.trigger('chat.ping', data)
          break
        case ChatEventType.PONG:
        case 'pong':
          // Pong received from server
          logger.debug('📡 Received pong from server')
          this.trigger('chat.pong', data)
          break
        case ChatEventType.ERROR:
        case 'error':
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
   */
  private handleChatClose(event: CloseEvent): void {
    logger.debug('🔌 Chat WebSocket closed:', event.code, event.reason)
    this.stopChatHeartbeat()
    
    this.trigger('chat.disconnected', { 
      code: event.code, 
      reason: event.reason,
      threadId: this.currentThreadId
    })
    
    // Only reconnect if not intentionally closed and within retry limits
    if (!this.isChatIntentionalClose && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleChatReconnect()
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
   */
  async connectToNotifications(): Promise<void> {
    if (this.notificationWs?.readyState === WebSocket.OPEN) {
      logger.debug('Notification WebSocket already connected')
      return
    }

    // Get JWT token from the auth service (in-memory token after initialization)
    let token = getAccessToken()
    
    if (!token) {
      const errorMessage = 'No authentication token available for notification WebSocket'
      logger.warn('Notification WebSocket connection aborted:', errorMessage)
      logger.debug('Token status:', {
        hasToken: !!token,
        message: 'Make sure auth is initialized before connecting WebSocket'
      })
      throw new Error(errorMessage)
    }

    this.isNotificationIntentionalClose = false

    try {
      const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000'
      const wsUrl = `${wsBaseUrl}/ws/notifications/?token=${token}`
      
      console.log('🔌 Connecting to notification WebSocket:', wsUrl.replace(token, '[TOKEN]'))
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
    console.log('✅ Connected to notification WebSocket')
    logger.debug('✅ Notification WebSocket connected successfully')
    this.notificationReconnectAttempts = 0
    this.startNotificationHeartbeat()
    this.trigger('notification.connected', { timestamp: new Date().toISOString() })
  }

  /**
   * Handle incoming notification WebSocket messages
   */
  private handleNotificationMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      // Log all received messages to console
      console.log('📨 Received:', data)
      logger.debug('📨 Notification message received:', data.type, data)
      
      // Handle specific message types
      if (data.type === 'chat.unread.update') {
        console.log('📨 Received:', {
          type: data.type,
          thread_id: data.thread_id,
          unread_count: data.unread_count,
          total_unread: data.total_unread
        })
        this.trigger('chat.unread.update', data)
      } else if (data.type === 'unread.counts.initial') {
        console.log('📨 Initial unread counts received:', {
          type: data.type,
          total_unread: data.total_unread,
          threads: data.threads
        })
        this.trigger('unread.counts.initial', data)
      } else if (data.type === 'connection.success') {
        console.log('✅ Connection confirmed by server')
        this.trigger('notification.connection.success', data)
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
   */
  private handleNotificationClose(event: CloseEvent): void {
    this._isNotificationConnected.value = false
    this.stopNotificationHeartbeat()
    
    logger.debug('Notification WebSocket closed:', event.code, event.reason)
    
    if (!this.isNotificationIntentionalClose && this.notificationReconnectAttempts < this.maxReconnectAttempts) {
      logger.debug('Attempting to reconnect notification WebSocket...')
      this.scheduleNotificationReconnect()
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
}

// Export singleton instance
export const websocketService = new NotificationWebSocketService()
export default websocketService


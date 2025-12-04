// Internal Chat Composable with WebSocket Real-Time Updates
// Based on FRONTEND_INTEGRATION_GUIDE.md - WebSocket Integration

import { ref, computed, onUnmounted, triggerRef } from 'vue'
import { chatAPI, getThreadDisplayName, getThreadAvatar } from '../services/chatService'
import { websocketService } from '../services/websocketService'
import type {
  Thread,
  Message,
  CreateThreadRequest,
  SendMessageRequest,
  ThreadFilters,
  UploadProgress
} from '../types/chat.types'

// ============================================
// Shared State (Global)
// ============================================

const threads = ref<Thread[]>([])
const currentThread = ref<Thread | null>(null)
const messages = ref<Message[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// WebSocket state
const isWebSocketConnected = ref(false)
const typingUsers = ref<Map<number, string>>(new Map())
// Typing timeout map - auto-clear typing indicators after timeout
const typingTimeouts = new Map<number, NodeJS.Timeout>()

// Rate limiting state
const rateLimits = ref({
  message_send: { limit: 60, window: 60, current: 0, remaining: 60 },
  reaction_add: { limit: 120, window: 60, current: 0, remaining: 120 },
  typing_start: { limit: 30, window: 60, current: 0, remaining: 30 }
})
const isRateLimited = ref(false)
const rateLimitCooldown = ref(0)

// Track which thread is actively visible to user
const activeThreadId = ref<string | null>(null)
const isChatPageVisible = ref(false)

// Pending unread counts (for threads not yet loaded)
const pendingUnreadCounts = ref<Map<string, number>>(new Map())
const hasInitializedThreads = ref(false)
const isAutoFetchingThreads = ref(false)

// WebSocket unread counts - these are authoritative and should not be overwritten by API
// Key: thread_id, Value: { count: number, timestamp: number }
const websocketUnreadCounts = ref<Map<string, { count: number; timestamp: number }>>(new Map())

// Debounce control for fetchThreads to prevent race conditions with WebSocket updates
let fetchThreadsDebounceTimer: NodeJS.Timeout | null = null
const WEBSOCKET_PRIORITY_WINDOW_MS = 3000 // WebSocket values take priority for 3 seconds

// Track if WebSocket listeners have been set up (only once globally)
// Split into two flags: notification listeners (never removed) and chat listeners (removed on unmount)
let notificationListenersSetup = false
let chatListenersSetup = false

// UI state
const selectedThreadId = ref<string | null>(null)
const replyingTo = ref<Message | null>(null)
const editingMessage = ref<Message | null>(null)
const uploadProgress = ref<UploadProgress[]>([])

// Pagination state
const threadsTotalCount = ref(0)
const threadsCurrentPage = ref(1)
const messagesNextCursor = ref<string | null>(null)
const messagesPrevCursor = ref<string | null>(null)
const hasMoreMessages = ref(true)

// ============================================
// Composable Hook
// ============================================

export const useChat = () => {
  // Get current user ID (from auth composable)
  // Get current user ID (from auth composable)
  // We use a ref initialized from localStorage to ensure we have the ID immediately
  const currentUserId = ref<number | string | null>(null)

  const initUserId = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        // Ensure ID is a number if possible, to match ChatUser type
        const parsedId = parseInt(user.id)
        currentUserId.value = !isNaN(parsedId) ? parsedId : (user.id || null)
      } catch (e) {
        console.error('Failed to parse user from localStorage', e)
        currentUserId.value = null
      }
    }
  }

  // Initialize on creation
  initUserId()

  // ============================================
  // Thread Management
  // ============================================

  const fetchThreads = async (filters?: ThreadFilters, silent = false): Promise<void> => {
    try {
      if (!silent) isLoading.value = true
      error.value = null

      const response = await chatAPI.listThreads(filters)
      const now = Date.now()

      // Apply API results but PRESERVE WebSocket unread counts within priority window
      // This prevents race conditions where stale API data overwrites fresh WebSocket data
      threads.value = response.results.map(apiThread => {
        const wsData = websocketUnreadCounts.value.get(apiThread.id)

        // If we have a recent WebSocket update for this thread, use that count instead
        if (wsData && (now - wsData.timestamp) < WEBSOCKET_PRIORITY_WINDOW_MS) {
          return { ...apiThread, unread_count: wsData.count }
        }

        // Check pending counts as well
        if (pendingUnreadCounts.value.has(apiThread.id)) {
          const count = pendingUnreadCounts.value.get(apiThread.id)!
          return { ...apiThread, unread_count: count }
        }

        return apiThread
      })

      threadsTotalCount.value = response.count

      if (filters?.page) {
        threadsCurrentPage.value = filters.page
      }

      // Clear pending counts that were applied
      pendingUnreadCounts.value.clear()

      // Clean up old WebSocket entries (older than priority window)
      websocketUnreadCounts.value.forEach((data, threadId) => {
        if ((now - data.timestamp) >= WEBSOCKET_PRIORITY_WINDOW_MS) {
          websocketUnreadCounts.value.delete(threadId)
        }
      })

      hasInitializedThreads.value = true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to fetch threads'
      console.error('Error fetching threads:', err)
    } finally {
      if (!silent) isLoading.value = false
      isAutoFetchingThreads.value = false
    }
  }

  const createThread = async (data: CreateThreadRequest): Promise<Thread | null> => {
    try {
      isLoading.value = true
      error.value = null

      const newThread = await chatAPI.createThread(data)

      // Add to threads list
      threads.value.unshift(newThread)

      // Select the new thread
      await selectThread(newThread.id)

      return newThread
    } catch (err: any) {
      // Handle duplicate direct thread
      if (err.response?.data?.existing_thread_id) {
        await selectThread(err.response.data.existing_thread_id)
        return null
      }

      error.value = err.response?.data?.error || err.message || 'Failed to create thread'
      console.error('Error creating thread:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const selectThread = async (threadId: string): Promise<void> => {
    try {
      selectedThreadId.value = threadId
      activeThreadId.value = threadId
      isLoading.value = true
      error.value = null

      // Fetch thread details
      currentThread.value = await chatAPI.getThread(threadId)

      // Fetch messages
      await fetchMessages(threadId)

      // Mark as read on server
      await chatAPI.markThreadAsRead(threadId)

      // Update unread count in threads list with proper reactivity (array replacement)
      threads.value = threads.value.map(t => {
        if (t.id === threadId) {
          return { ...t, unread_count: 0 }
        }
        return t
      })

      // Connect to WebSocket for real-time updates
      await connectToChatWebSocket(threadId)
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to select thread'
      console.error('Error selecting thread:', err)
    } finally {
      isLoading.value = false
    }
  }

  const leaveThread = async (threadId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      await chatAPI.leaveThread(threadId)

      // Remove from threads list
      threads.value = threads.value.filter(t => t.id !== threadId)

      // Clear selection if current thread
      if (selectedThreadId.value === threadId) {
        selectedThreadId.value = null
        currentThread.value = null
        messages.value = []
        disconnectFromChatWebSocket()
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to leave thread'
      console.error('Error leaving thread:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const addMembers = async (threadId: string, userIds: number[], role?: 'admin' | 'member'): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      await chatAPI.addMembers(threadId, { user_ids: userIds, role })

      // Refresh thread details
      if (currentThread.value?.id === threadId) {
        currentThread.value = await chatAPI.getThread(threadId)
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to add members'
      console.error('Error adding members:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const removeMember = async (threadId: string, userId: number): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      await chatAPI.removeMember(threadId, { user_id: userId })

      // Refresh thread details
      if (currentThread.value?.id === threadId) {
        currentThread.value = await chatAPI.getThread(threadId)
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to remove member'
      console.error('Error removing member:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const changeRole = async (threadId: string, userId: number, role: 'admin' | 'member'): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      await chatAPI.changeRole(threadId, { user_id: userId, role })

      // Refresh thread details
      if (currentThread.value?.id === threadId) {
        currentThread.value = await chatAPI.getThread(threadId)
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to change role'
      console.error('Error changing role:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Update group settings (admin/owner only)
  const updateGroupSettings = async (
    threadId: string,
    settings: { posting_mode?: 'all' | 'admins_only'; members_can_add_others?: boolean }
  ): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await chatAPI.updateGroupSettings(threadId, settings)

      // Update the currentThread with new settings
      if (currentThread.value?.id === threadId) {
        currentThread.value = {
          ...currentThread.value,
          group_settings: {
            ...currentThread.value.group_settings,
            posting_mode: response.posting_mode,
            members_can_add_others: response.members_can_add_others,
            updated_at: response.updated_at,
            updated_by: response.updated_by
          }
        }
      }

      // Also update in threads list with proper array replacement
      threads.value = threads.value.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            group_settings: {
              ...t.group_settings,
              posting_mode: response.posting_mode,
              members_can_add_others: response.members_can_add_others,
              updated_at: response.updated_at,
              updated_by: response.updated_by
            }
          }
        }
        return t
      })

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to update group settings'
      console.error('Error updating group settings:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // Message Management
  // ============================================

  const fetchMessages = async (threadId: string, cursor?: string): Promise<void> => {
    try {
      const response = await chatAPI.listMessages(threadId, { cursor })

      if (cursor) {
        // Load more (append to existing)
        messages.value = [...messages.value, ...response.results]
      } else {
        // Initial load
        messages.value = response.results.reverse() // Reverse to show oldest first
      }

      messagesNextCursor.value = response.next
      messagesPrevCursor.value = response.previous
      hasMoreMessages.value = !!response.next
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to fetch messages'
      console.error('Error fetching messages:', err)
    }
  }

  const loadMoreMessages = async (): Promise<void> => {
    if (!selectedThreadId.value || !hasMoreMessages.value || !messagesNextCursor.value) return

    await fetchMessages(selectedThreadId.value, messagesNextCursor.value)
  }

  const sendMessage = async (content: string, attachmentIds?: string[]): Promise<boolean> => {
    if (!selectedThreadId.value) return false

    try {
      const data: SendMessageRequest = {
        content,
        reply_to: replyingTo.value?.id,
        attachment_ids: attachmentIds
      }

      // Optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        thread: selectedThreadId.value,
        sender: {
          id: Number(currentUserId.value) || 0,
          email: '',
          first_name: '',
          last_name: '',
          full_name: 'You',
          role: 'user'
        },
        content,
        reply_to: replyingTo.value ? {
          id: replyingTo.value.id,
          content: replyingTo.value.content,
          sender: replyingTo.value.sender,
          attachments: replyingTo.value.attachments
        } : null,
        has_attachments: !!attachmentIds?.length,
        created_at: new Date().toISOString(),
        edited_at: null,
        reactions: [],
        attachments: []
      }

      messages.value.push(tempMessage)

      // Clear reply state
      replyingTo.value = null

      // Send to server
      const newMessage = await chatAPI.sendMessage(selectedThreadId.value, data)

      // Replace temp message with real one
      const tempIndex = messages.value.findIndex(m => m.id === tempMessage.id)
      if (tempIndex !== -1) {
        messages.value[tempIndex] = newMessage
      }

      // Update thread's last message in list
      const threadIndex = threads.value.findIndex(t => t.id === selectedThreadId.value)
      if (threadIndex !== -1 && threads.value[threadIndex].last_message) {
        threads.value[threadIndex].last_message = {
          id: newMessage.id,
          sender: newMessage.sender,
          content: newMessage.content,
          created_at: newMessage.created_at,
          has_attachments: newMessage.has_attachments
        }
        threads.value[threadIndex].updated_at = newMessage.created_at
      }

      return true
    } catch (err: any) {
      // Remove optimistic message on error
      messages.value = messages.value.filter(m => !m.id.startsWith('temp-'))

      error.value = err.response?.data?.error || err.message || 'Failed to send message'
      console.error('Error sending message:', err)
      return false
    }
  }

  const editMessage = async (messageId: string, content: string): Promise<boolean> => {
    try {
      const updatedMessage = await chatAPI.editMessage(messageId, { content })

      // Update message in list
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        messages.value[messageIndex] = updatedMessage
      }

      // Clear editing state
      editingMessage.value = null

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to edit message'
      console.error('Error editing message:', err)
      return false
    }
  }

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    try {
      await chatAPI.deleteMessage(messageId)

      // Update message to show as deleted
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        messages.value[messageIndex].content = '[Message deleted]'
        messages.value[messageIndex].is_deleted = true
      }

      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to delete message'
      console.error('Error deleting message:', err)
      return false
    }
  }

  const addReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      // Optimistic update - immediately update UI
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji)

        if (reactionIndex !== -1) {
          // Add user to existing reaction
          if (!message.reactions[reactionIndex].users.find(u => u.id === currentUserId.value)) {
            message.reactions[reactionIndex].users.push({
              id: Number(currentUserId.value) || 0,
              email: '',
              first_name: '',
              last_name: '',
              full_name: 'You',
              role: 'user'
            })
          }
        } else {
          // Create new reaction
          message.reactions.push({
            emoji,
            users: [{
              id: Number(currentUserId.value) || 0,
              email: '',
              first_name: '',
              last_name: '',
              full_name: 'You',
              role: 'user'
            }]
          })
        }

        // Trigger Vue reactivity for immediate UI update
        triggerRef(messages)
      }

      // Send via WebSocket for real-time broadcast to other users
      if (isWebSocketConnected.value) {
        websocketService.addChatReaction(messageId, emoji)
        return true
      } else {
        // Fallback to REST API if WebSocket is not connected
        console.warn('⚠️ [useChat] WebSocket not connected, using REST API fallback')
        const updatedMessage = await chatAPI.addReaction(messageId, { emoji })

        // Update with server response
        if (messageIndex !== -1) {
          messages.value[messageIndex] = updatedMessage
          triggerRef(messages)
        }

        return true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to add reaction'
      console.error('❌ [useChat] Error adding reaction:', err)
      return false
    }
  }

  const removeReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      // Optimistic update - immediately update UI
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reaction = message.reactions.find(r => r.emoji === emoji)

        if (reaction) {
          // Remove current user from reaction
          reaction.users = reaction.users.filter(u => u.id !== currentUserId.value)

          // Remove reaction if no users left
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji)
          }

          // Trigger Vue reactivity for immediate UI update
          triggerRef(messages)
        }
      }

      // Send via WebSocket for real-time broadcast to other users
      if (isWebSocketConnected.value) {
        websocketService.removeChatReaction(messageId, emoji)
        return true
      } else {
        // Fallback to REST API if WebSocket is not connected
        const updatedMessage = await chatAPI.removeReaction(messageId, emoji)

        // Update with server response
        if (messageIndex !== -1) {
          messages.value[messageIndex] = updatedMessage
          triggerRef(messages)
        }

        return true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to remove reaction'
      console.error('❌ [useChat] Error removing reaction:', err)
      return false
    }
  }

  // ============================================
  // File Upload
  // ============================================

  const uploadFile = async (file: File, caption?: string): Promise<string | null> => {
    const uploadId = `upload-${Date.now()}-${Math.random()}`

    try {
      // Add to upload progress
      uploadProgress.value.push({
        id: uploadId,
        file_name: file.name,
        progress: 0,
        status: 'uploading',
        caption: caption
      })

      const response = await chatAPI.uploadAttachment(file, caption, (progress) => {
        const uploadIndex = uploadProgress.value.findIndex(u => u.id === uploadId)
        if (uploadIndex !== -1) {
          uploadProgress.value[uploadIndex].progress = progress
        }
      })

      // Update to completed
      const uploadIndex = uploadProgress.value.findIndex(u => u.id === uploadId)
      if (uploadIndex !== -1) {
        uploadProgress.value[uploadIndex].status = 'completed'
        uploadProgress.value[uploadIndex].attachmentId = response.id
      }

      return response.id
    } catch (err: any) {
      // Update to error
      const uploadIndex = uploadProgress.value.findIndex(u => u.id === uploadId)
      if (uploadIndex !== -1) {
        uploadProgress.value[uploadIndex].status = 'error'
      }

      error.value = err.response?.data?.error || err.message || 'Failed to upload file'
      console.error('❌ [useChat] Error uploading file:', err)
      return null
    }
  }

  const removeUpload = (uploadId: string): void => {
    uploadProgress.value = uploadProgress.value.filter(u => u.id !== uploadId)
  }

  const clearUploads = (): void => {
    uploadProgress.value = []
  }

  const updateUploadCaption = (uploadId: string, caption: string): void => {
    const uploadIndex = uploadProgress.value.findIndex(u => u.id === uploadId)
    if (uploadIndex !== -1) {
      uploadProgress.value[uploadIndex].caption = caption
    }
  }

  // ============================================
  // WebSocket Integration
  // ============================================

  /**
   * Setup GLOBAL notification listeners for unread count updates.
   * These are set up ONCE at app start and NEVER removed.
   * They must persist across all pages for the sidebar badge to work.
   */
  const setupNotificationListeners = (): void => {
    if (notificationListenersSetup) {
      return
    }

    notificationListenersSetup = true

    // Unread count updates from backend - CRITICAL for sidebar badge
    websocketService.on('chat.unread.update', (data: any) => {
      const now = Date.now()

      // ALWAYS store in WebSocket counts map with timestamp - this is authoritative
      // This ensures the value persists even if fetchThreads races with this update
      websocketUnreadCounts.value.set(data.thread_id, {
        count: data.unread_count,
        timestamp: now
      })

      // Update specific thread unread count with proper reactivity
      const threadIndex = threads.value.findIndex(t => t.id === data.thread_id)

      if (threadIndex !== -1) {
        // Create a new array to trigger Vue reactivity (full replacement)
        threads.value = threads.value.map((t, i) =>
          i === threadIndex ? { ...t, unread_count: data.unread_count } : t
        )
      } else {
        // Store in pending map
        pendingUnreadCounts.value.set(data.thread_id, data.unread_count)

        // Auto-fetch threads if not yet initialized and not already fetching
        if (!hasInitializedThreads.value && !isAutoFetchingThreads.value) {
          isAutoFetchingThreads.value = true
          fetchThreads(undefined, true).catch(() => {
            isAutoFetchingThreads.value = false
          })
        }
      }
    })

    // Legacy format unread count updates
    websocketService.on('unread.count.update', (data: any) => {
      // Support legacy format from backend with proper reactivity
      const threadIndex = threads.value.findIndex(t => t.id === data.thread_id)
      if (threadIndex !== -1) {
        threads.value = threads.value.map((t, i) =>
          i === threadIndex ? { ...t, unread_count: data.unread_count } : t
        )
      } else {
        pendingUnreadCounts.value.set(data.thread_id, data.unread_count)

        if (!hasInitializedThreads.value && !isAutoFetchingThreads.value) {
          isAutoFetchingThreads.value = true
          fetchThreads(undefined, true).catch(() => {
            isAutoFetchingThreads.value = false
          })
        }
      }
    })

    // Initial unread counts from notification WebSocket
    websocketService.on('unread.counts.initial', (data: any) => {
      // Update all thread unread counts from initial data with proper reactivity
      if (data.threads && Array.isArray(data.threads)) {
        // Create a map of thread_id -> unread_count for efficient lookup
        const unreadMap = new Map<string, number>()
        data.threads.forEach((threadData: any) => {
          unreadMap.set(threadData.thread_id, threadData.unread_count)
        })

        // Replace entire array to ensure Vue reactivity
        threads.value = threads.value.map(t => {
          if (unreadMap.has(t.id)) {
            const newCount = unreadMap.get(t.id)!
            return { ...t, unread_count: newCount }
          }
          return t
        })
      }
    })

    // Error handling (keep global for debugging)
    websocketService.on('chat.error', (data: any) => {
      console.error('Chat WebSocket error:', data.message)

      // Handle rate limit exceeded
      if (data.code === 'RATE_LIMIT_EXCEEDED') {
        isRateLimited.value = true
        rateLimitCooldown.value = 60 // 60 seconds cooldown

        // Show user-friendly error message
        error.value = 'أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار قليلاً.'

        // Start countdown
        const interval = setInterval(() => {
          rateLimitCooldown.value--
          if (rateLimitCooldown.value <= 0) {
            isRateLimited.value = false
            error.value = null
            clearInterval(interval)
          }
        }, 1000)

        console.warn('⚠️ Rate limit exceeded:', data.message)
      } else {
        error.value = data.message || 'WebSocket error occurred'
      }
    })

    // WORKAROUND: Listen for notification.count and refresh threads
    // This is needed because backend sends notification.count for ALL notifications
    // Debounced to prevent race conditions with chat.unread.update events
    let lastNotificationCount = -1
    websocketService.on('notification.count', (data: any) => {
      // Only refresh if count actually changed
      if (data.count !== lastNotificationCount) {
        lastNotificationCount = data.count

        // Cancel any pending fetchThreads call
        if (fetchThreadsDebounceTimer) {
          clearTimeout(fetchThreadsDebounceTimer)
          fetchThreadsDebounceTimer = null
        }

        // Debounce fetchThreads to allow chat.unread.update to process first
        // This prevents the API call from overwriting fresh WebSocket data
        fetchThreadsDebounceTimer = setTimeout(() => {
          // If we have recent WebSocket updates, they'll be preserved by fetchThreads
          // The WEBSOCKET_PRIORITY_WINDOW ensures fresh WS values aren't overwritten
          fetchThreads(undefined, true).catch(() => {
            // Failed to refresh threads
          })

          fetchThreadsDebounceTimer = null
        }, 500) // 500ms debounce to let WebSocket events process first
      }
    })
  }

  /**
   * Setup CHAT-SPECIFIC listeners for active thread communication.
   * These are set up when entering chat page and removed when leaving.
   */
  const setupChatListeners = (): void => {
    if (chatListenersSetup) {
      return
    }

    chatListenersSetup = true

    // Connection events
    websocketService.on('chat.connected', (_data: any) => {
      isWebSocketConnected.value = true
    })

    websocketService.on('chat.connection.established', (data: any) => {
      if (data.rate_limits) {
        // Merge rate limits instead of replacing to avoid breaking reactivity
        // and ensure all required properties exist
        rateLimits.value = {
          message_send: data.rate_limits.message_send || rateLimits.value.message_send,
          reaction_add: data.rate_limits.reaction_add || rateLimits.value.reaction_add,
          typing_start: data.rate_limits.typing_start || rateLimits.value.typing_start
        }
      }
      isWebSocketConnected.value = true
    })

    websocketService.on('chat.disconnected', (data: any) => {
      isWebSocketConnected.value = false

      // Handle payload too large (code 1009)
      if (data.code === 1009) {
        error.value = 'الرسالة كبيرة جداً. يرجى تقليل حجم المرفقات.'
      }
    })

    // New message received
    websocketService.on('chat.message.new', (data: any) => {
      const rawMessage = data.message

      // Normalize thread field (backend sends thread_id, frontend uses thread)
      const newMessage: Message = {
        ...rawMessage,
        thread: rawMessage.thread_id || rawMessage.thread
      }

      // Clear typing indicator for this user when they send a message
      if (newMessage.sender.id !== currentUserId.value) {
        typingUsers.value.delete(newMessage.sender.id)
      }

      // Check if this message is for a thread that's not currently active
      const isThreadActive = activeThreadId.value === newMessage.thread && isChatPageVisible.value
      const isOwnMessage = newMessage.sender.id === currentUserId.value

      // Show notification if message is not from current user and thread is not active
      if (!isOwnMessage && !isThreadActive) {
        showChatMessageNotification(newMessage)
      }

      // ✅ CRITICAL FIX: Only add message to messages array if it belongs to the CURRENTLY SELECTED thread
      // This fixes group chat real-time updates - messages were being added regardless of thread
      const isForCurrentThread = selectedThreadId.value === newMessage.thread

      if (isForCurrentThread && !messages.value.find(m => m.id === newMessage.id)) {
        messages.value.push(newMessage)
      }

      // Update thread's last message and unread count
      const threadIndex = threads.value.findIndex(t => t.id === newMessage.thread)
      if (threadIndex !== -1) {
        threads.value[threadIndex].last_message = newMessage
        threads.value[threadIndex].updated_at = newMessage.created_at

        // Increment unread count if message is from another user and thread is not active
        if (!isOwnMessage && !isThreadActive) {
          threads.value[threadIndex].unread_count++
        }
      }
    })

    // Message updated
    websocketService.on('chat.message.updated', (data: any) => {
      const updatedMessage = data.message as Message

      // ✅ Only update message if it belongs to the currently selected thread
      if (selectedThreadId.value !== updatedMessage.thread) {
        return
      }

      const index = messages.value.findIndex(m => m.id === updatedMessage.id)
      if (index !== -1) {
        messages.value[index] = updatedMessage
      }
    })

    // Message deleted
    websocketService.on('chat.message.deleted', (data: any) => {
      // ✅ Check if the deleted message belongs to current thread before removing
      const messageToDelete = messages.value.find(m => m.id === data.message_id)
      if (!messageToDelete) {
        return
      }

      if (selectedThreadId.value !== messageToDelete.thread) {
        return
      }

      const index = messages.value.findIndex(m => m.id === data.message_id)
      if (index !== -1) {
        messages.value.splice(index, 1)
      }
    })

    // Typing indicators with auto-timeout (clear after 5 seconds if no stop event)
    websocketService.on('chat.typing.start', (data: any) => {
      // Extract user info from data.user object
      const userId = data.user?.id || data.user_id
      if (userId !== currentUserId.value) {
        // Create display name from first_name and last_name
        const firstName = data.user?.first_name || ''
        const lastName = data.user?.last_name || ''
        const displayName = firstName && lastName ? `${firstName} ${lastName}` :
          firstName || lastName || data.user?.username || 'User'

        // Clear any existing timeout for this user
        const existingTimeout = typingTimeouts.get(userId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        // Store with user ID as key and display name as value
        typingUsers.value.set(userId, displayName)

        // Auto-clear typing indicator after 5 seconds (fallback if stop event is lost)
        const timeout = setTimeout(() => {
          typingUsers.value.delete(userId)
          typingTimeouts.delete(userId)
        }, 5000)

        typingTimeouts.set(userId, timeout)
      }
    })

    websocketService.on('chat.typing.stop', (data: any) => {
      const userId = data.user?.id || data.user_id
      if (userId !== currentUserId.value) {
        // Clear the auto-timeout since we received explicit stop
        const existingTimeout = typingTimeouts.get(userId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
          typingTimeouts.delete(userId)
        }

        typingUsers.value.delete(userId)
      }
    })

    // Read receipts
    websocketService.on('chat.receipt.read', (_data: any) => {
      // Message read - update read status in UI if needed
    })

    // Reactions
    websocketService.on('chat.reaction.added', (data: any) => {
      // Skip if this is from the current user (already handled by optimistic update)
      // Use == instead of === to handle type coercion (number vs string)
      if (data.user_id == currentUserId.value) {
        return
      }

      const messageIndex = messages.value.findIndex(m => m.id === data.message_id)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reaction = message.reactions.find(r => r.emoji === data.emoji)

        if (reaction) {
          // Add user to existing reaction if not already present
          if (!reaction.users.find(u => u.id === data.user_id)) {
            reaction.users.push({
              id: data.user_id,
              email: data.email || '',
              first_name: data.first_name || data.username || 'User',
              last_name: data.last_name || '',
              full_name: data.full_name || data.username || 'User',
              role: 'user'
            })
          }
        } else {
          // Create new reaction
          message.reactions.push({
            emoji: data.emoji,
            users: [{
              id: data.user_id,
              email: data.email || '',
              first_name: data.first_name || data.username || 'User',
              last_name: data.last_name || '',
              full_name: data.full_name || data.username || 'User',
              role: 'user'
            }]
          })
        }

        // Trigger Vue reactivity
        triggerRef(messages)
      }
    })

    websocketService.on('chat.reaction.removed', (data: any) => {
      // Skip if this is from the current user (already handled by optimistic update)
      // Use == instead of === to handle type coercion (number vs string)
      if (data.user_id == currentUserId.value) {
        return
      }

      const messageIndex = messages.value.findIndex(m => m.id === data.message_id)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reaction = message.reactions.find(r => r.emoji === data.emoji)

        if (reaction) {
          reaction.users = reaction.users.filter(u => u.id !== data.user_id)

          // Remove reaction if no users left
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== data.emoji)
          }

          // Trigger Vue reactivity
          triggerRef(messages)
        }
      }
    })

    // Thread updates
    websocketService.on('chat.thread.updated', (data: any) => {
      if (currentThread.value && data.thread.id === currentThread.value.id) {
        currentThread.value = data.thread
      }

      // Update in threads list with proper array replacement
      threads.value = threads.value.map(t => t.id === data.thread.id ? data.thread : t)
    })

    // Member events
    websocketService.on('chat.member.added', (_data: any) => {
      // Refresh thread participants if needed
      if (currentThread.value) {
        selectThread(currentThread.value.id)
      }
    })

    websocketService.on('chat.member.removed', (_data: any) => {
      // Refresh thread participants if needed
      if (currentThread.value) {
        selectThread(currentThread.value.id)
      }
    })

    // Group settings updated event
    websocketService.on('group.settings.updated', (data: any) => {
      const threadId = data.thread_id
      const newSettings = data.settings
      const updatedBy = data.updated_by

      // Update currentThread if it's the affected thread
      if (currentThread.value && currentThread.value.id === threadId) {
        currentThread.value = {
          ...currentThread.value,
          group_settings: {
            ...currentThread.value.group_settings,
            posting_mode: newSettings.posting_mode,
            members_can_add_others: newSettings.members_can_add_others,
            updated_at: data.timestamp,
            updated_by: updatedBy
          }
        }
      }

      // Update in threads list with proper array replacement
      threads.value = threads.value.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            group_settings: {
              ...t.group_settings,
              posting_mode: newSettings.posting_mode,
              members_can_add_others: newSettings.members_can_add_others,
              updated_at: data.timestamp,
              updated_by: updatedBy
            }
          }
        }
        return t
      })
    })

    // Ping/Pong handlers (for WebSocket keepalive)
    websocketService.on('chat.ping', (_data: any) => {
      // WebSocket service automatically handles sending pong response
    })

    websocketService.on('chat.pong', (_data: any) => {
      // Connection is alive
    })
  }

  /**
   * Setup all WebSocket listeners - calls both notification and chat listener setup
   */
  const setupWebSocketListeners = (): void => {
    // Always set up notification listeners (they persist)
    setupNotificationListeners()
    // Set up chat listeners (can be removed when leaving chat page)
    setupChatListeners()
  }

  /**
   * Connect to chat WebSocket for a specific thread
   */
  const connectToChatWebSocket = async (threadId: string): Promise<void> => {
    try {
      await websocketService.connectToChat(threadId)
    } catch (err: any) {
      console.error('Failed to connect to chat WebSocket:', err)
      error.value = err.message || 'Failed to connect to chat'
    }
  }

  /**
   * Disconnect from chat WebSocket
   */
  const disconnectFromChatWebSocket = (): void => {
    websocketService.disconnectFromChat()
    isWebSocketConnected.value = false

    // Clear all typing indicators and their timeouts
    typingUsers.value.clear()
    typingTimeouts.forEach(timeout => clearTimeout(timeout))
    typingTimeouts.clear()

    activeThreadId.value = null
  }

  /**
   * Show browser notification for chat message
   */
  const showChatMessageNotification = (message: Message): void => {
    const thread = threads.value.find(t => t.id === message.thread)
    if (!thread) return

    const senderName = message.sender.full_name || `${message.sender.first_name} ${message.sender.last_name}`.trim()
    const threadName = thread.chat_name || thread.title || 'محادثة'

    // Create notification title and body
    const title = thread.type === 'direct' ? senderName : `${senderName} في ${threadName}`
    const body = message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `chat-${message.thread}`,
        requireInteraction: false,
        silent: false
      })

      notification.onclick = () => {
        window.focus()
        selectThread(message.thread)
        notification.close()
      }
    }

    // Show in-app toast notification
    showInAppChatNotification(title, body, message.thread)

    // Play notification sound
    playChatNotificationSound()
  }

  /**
   * Show in-app toast notification for chat message
   */
  const showInAppChatNotification = (title: string, body: string, threadId: string): void => {
    // Create toast notification element
    const toastContainer = document.getElementById('chat-toast-container') || createToastContainer()

    const toast = document.createElement('div')
    toast.className = 'chat-notification-toast'
    toast.innerHTML = `
      <div class="toast-header">
        <i class="bi bi-chat-left-text-fill"></i>
        <strong>${escapeHtml(title)}</strong>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
          <i class="bi bi-x"></i>
        </button>
      </div>
      <div class="toast-body">${escapeHtml(body)}</div>
    `

    toast.onclick = (e) => {
      if (!(e.target as HTMLElement).classList.contains('toast-close') &&
        !(e.target as HTMLElement).closest('.toast-close')) {
        selectThread(threadId)
        toast.remove()
      }
    }

    toastContainer.appendChild(toast)

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => toast.remove(), 300)
    }, 5000)
  }

  /**
   * Create toast container if it doesn't exist
   */
  const createToastContainer = (): HTMLElement => {
    const container = document.createElement('div')
    container.id = 'chat-toast-container'
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `
    document.body.appendChild(container)

    // Add styles
    if (!document.getElementById('chat-toast-styles')) {
      const style = document.createElement('style')
      style.id = 'chat-toast-styles'
      style.textContent = `
        .chat-notification-toast {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          cursor: pointer;
          animation: slideIn 0.3s ease-out;
          border-left: 4px solid #0d6efd;
        }
        
        .toast-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        
        .toast-header i.bi-chat-left-text-fill {
          color: #0d6efd;
          font-size: 18px;
        }
        
        .toast-header strong {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #212529;
        }
        
        .toast-close {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6c757d;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toast-close:hover {
          color: #212529;
        }
        
        .toast-body {
          padding: 12px 16px;
          font-size: 13px;
          color: #495057;
          line-height: 1.5;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    return container
  }

  /**
   * Escape HTML to prevent XSS
   */
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Play chat notification sound
   */
  const playChatNotificationSound = (): void => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 600
      oscillator.type = 'sine'
      gainNode.gain.value = 0.15

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.15)

      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)

        oscillator2.frequency.value = 800
        oscillator2.type = 'sine'
        gainNode2.gain.value = 0.15

        oscillator2.start()
        oscillator2.stop(audioContext.currentTime + 0.15)
      }, 100)
    } catch {
      // Silent fail if audio context not supported
    }
  }

  /**
   * Set chat page visibility
   */
  const setChatPageVisibility = (visible: boolean): void => {
    isChatPageVisible.value = visible
    if (!visible) {
      activeThreadId.value = null
    }
  }

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = (isTyping: boolean): void => {
    if (isTyping) {
      websocketService.startTyping()
    } else {
      websocketService.stopTyping()
    }
  }

  // Setup WebSocket listeners on composable initialization
  setupWebSocketListeners()

  // Cleanup on unmount - only disconnect chat WebSocket when leaving the ACTIVE CHAT page
  // CRITICAL: DO NOT remove global notification listeners here!
  // The notificationListenersSetup flag ensures notification listeners are only set up once globally,
  // and they should NEVER be removed. Chat listeners can be removed and re-added.
  onUnmounted(() => {
    // Only disconnect from chat WebSocket if we're on the chat page
    // This prevents breaking the connection when other components using useChat unmount
    if (isChatPageVisible.value) {
      disconnectFromChatWebSocket()

      // Only remove CHAT-SPECIFIC listeners when leaving chat page
      // These are for active thread communication, not global badge updates
      websocketService.removeAllListeners('chat.connected')
      websocketService.removeAllListeners('chat.disconnected')
      websocketService.removeAllListeners('chat.connection.established')
      websocketService.removeAllListeners('chat.message.new')
      websocketService.removeAllListeners('chat.message.updated')
      websocketService.removeAllListeners('chat.message.deleted')
      websocketService.removeAllListeners('chat.typing.start')
      websocketService.removeAllListeners('chat.typing.stop')
      websocketService.removeAllListeners('chat.receipt.read')
      websocketService.removeAllListeners('chat.reaction.added')
      websocketService.removeAllListeners('chat.reaction.removed')
      websocketService.removeAllListeners('chat.thread.updated')
      websocketService.removeAllListeners('chat.member.added')
      websocketService.removeAllListeners('chat.member.removed')
      websocketService.removeAllListeners('group.settings.updated')
      websocketService.removeAllListeners('chat.ping')
      websocketService.removeAllListeners('chat.pong')

      // Reset only the CHAT listeners flag - notification listeners persist
      chatListenersSetup = false
    }

    // NEVER remove these global notification listeners - they persist across all pages:
    // - chat.unread.update (critical for sidebar badge)
    // - unread.count.update (legacy format)
    // - unread.counts.initial (initial count on connect)
    // - chat.error (for error handling)
    // notificationListenersSetup is NEVER reset!
  })

  // ============================================
  // Computed Properties
  // ============================================

  const sortedThreads = computed(() => {
    return [...threads.value].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  })

  const unreadThreadsCount = computed(() => {
    return threads.value.reduce((count, thread) => count + (thread.unread_count > 0 ? 1 : 0), 0)
  })

  const totalUnreadCount = computed(() => {
    const now = Date.now()
    let threadsTotal = 0

    // Calculate total from threads, but use WebSocket values if they're fresher
    threads.value.forEach(thread => {
      const wsData = websocketUnreadCounts.value.get(thread.id)
      if (wsData && (now - wsData.timestamp) < WEBSOCKET_PRIORITY_WINDOW_MS) {
        // Use WebSocket value - it's fresher
        threadsTotal += wsData.count
      } else {
        // Use thread's stored value
        threadsTotal += thread.unread_count
      }
    })

    // Add pending counts for threads not yet loaded
    const pendingTotal = Array.from(pendingUnreadCounts.value.values()).reduce((sum, count) => sum + count, 0)

    // Add WebSocket counts for threads not in our list yet
    let wsOnlyTotal = 0
    websocketUnreadCounts.value.forEach((data, threadId) => {
      if ((now - data.timestamp) < WEBSOCKET_PRIORITY_WINDOW_MS) {
        const existsInThreads = threads.value.some(t => t.id === threadId)
        const existsInPending = pendingUnreadCounts.value.has(threadId)
        if (!existsInThreads && !existsInPending) {
          wsOnlyTotal += data.count
        }
      }
    })

    const total = threadsTotal + pendingTotal + wsOnlyTotal

    return total
  })

  const currentThreadDisplayName = computed(() => {
    if (!currentThread.value || !currentUserId.value) return ''
    return getThreadDisplayName(currentThread.value, currentUserId.value)
  })

  const currentThreadAvatar = computed(() => {
    if (!currentThread.value || !currentUserId.value) return '?'
    return getThreadAvatar(currentThread.value, currentUserId.value)
  })

  const canPostMessages = computed(() => {
    if (!currentThread.value) return false
    if (currentThread.value.type === 'direct') return true

    const settings = currentThread.value.group_settings
    if (!settings) return true

    if (settings.posting_mode === 'admins_only') {
      return currentThread.value.my_role === 'admin' || currentThread.value.my_role === 'owner'
    }

    return true
  })

  const canManageMembers = computed(() => {
    if (!currentThread.value || currentThread.value.type === 'direct') return false
    return currentThread.value.my_role === 'admin' || currentThread.value.my_role === 'owner'
  })

  // ============================================
  // Return API
  // ============================================

  return {
    // State
    threads: sortedThreads,
    currentThread,
    messages,
    isLoading,
    error,
    selectedThreadId,
    replyingTo,
    editingMessage,
    uploadProgress,

    // Rate limiting state
    rateLimits,
    isRateLimited,
    rateLimitCooldown,

    // Computed
    unreadThreadsCount,
    totalUnreadCount,
    currentThreadDisplayName,
    currentThreadAvatar,
    canPostMessages,
    canManageMembers,
    hasMoreMessages,
    currentUserId,

    // Thread actions
    fetchThreads,
    createThread,
    selectThread,
    leaveThread,
    addMembers,
    removeMember,
    changeRole,
    updateGroupSettings,

    // Message actions
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,

    // File upload
    uploadFile,
    removeUpload,
    clearUploads,
    updateUploadCaption,

    // WebSocket
    connectToChatWebSocket,
    disconnectFromChatWebSocket,
    sendTypingIndicator,
    isWebSocketConnected,
    typingUsers,

    // UI state
    setReplyingTo: (message: Message | null) => { replyingTo.value = message },
    setEditingMessage: (message: Message | null) => { editingMessage.value = message },
    clearError: () => { error.value = null },
    setChatPageVisibility
  }
}

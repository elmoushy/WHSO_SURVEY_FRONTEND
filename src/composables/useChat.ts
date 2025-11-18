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

// Track which thread is actively visible to user
const activeThreadId = ref<string | null>(null)
const isChatPageVisible = ref(false)

// Pending unread counts (for threads not yet loaded)
const pendingUnreadCounts = ref<Map<string, number>>(new Map())
const hasInitializedThreads = ref(false)
const isAutoFetchingThreads = ref(false)

// Track if WebSocket listeners have been set up (only once globally)
let webSocketListenersSetup = false

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
  const currentUserId = computed(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
      const user = JSON.parse(userStr)
      return user.id || null
    } catch {
      return null
    }
  })

  // ============================================
  // Thread Management
  // ============================================

  const fetchThreads = async (filters?: ThreadFilters, silent = false): Promise<void> => {
    try {
      if (!silent) isLoading.value = true
      error.value = null
      
      const response = await chatAPI.listThreads(filters)
      threads.value = response.results
      threadsTotalCount.value = response.count
      
      if (filters?.page) {
        threadsCurrentPage.value = filters.page
      }
      
      // Apply any pending unread counts
      if (pendingUnreadCounts.value.size > 0) {
        console.log('📦 Applying pending unread counts:', Array.from(pendingUnreadCounts.value.entries()))
        pendingUnreadCounts.value.forEach((count, threadId) => {
          const threadIndex = threads.value.findIndex(t => t.id === threadId)
          if (threadIndex !== -1) {
            threads.value[threadIndex] = {
              ...threads.value[threadIndex],
              unread_count: count
            }
            console.log(`✅ Applied pending count ${count} to thread ${threadId}`)
          }
        })
        pendingUnreadCounts.value.clear()
      }
      
      hasInitializedThreads.value = true
      console.log('✅ Threads fetched:', threads.value.length)
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
      
      // Update unread count in threads list with proper reactivity
      const threadIndex = threads.value.findIndex(t => t.id === threadId)
      if (threadIndex !== -1) {
        threads.value[threadIndex] = {
          ...threads.value[threadIndex],
          unread_count: 0
        }
        triggerRef(threads)
        console.log(`✅ Cleared unread count for thread ${threadId}`)
      }
      
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
          id: currentUserId.value || 0,
          email: '',
          first_name: '',
          last_name: '',
          full_name: 'You',
          role: 'user'
        },
        content,
        reply_to: replyingTo.value?.id || null,
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
      console.log(`🚀 [useChat] Adding reaction ${emoji} to message ${messageId}`)
      
      // Optimistic update - immediately update UI
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji)
        
        if (reactionIndex !== -1) {
          // Add user to existing reaction
          if (!message.reactions[reactionIndex].users.find(u => u.id === currentUserId.value)) {
            message.reactions[reactionIndex].users.push({
              id: currentUserId.value || 0,
              email: '',
              first_name: '',
              last_name: '',
              full_name: 'You',
              role: 'user'
            })
            console.log(`📝 [useChat] Optimistic: Added to existing reaction ${emoji}`)
          }
        } else {
          // Create new reaction
          message.reactions.push({
            emoji,
            users: [{
              id: currentUserId.value || 0,
              email: '',
              first_name: '',
              last_name: '',
              full_name: 'You',
              role: 'user'
            }]
          })
          console.log(`📝 [useChat] Optimistic: Created new reaction ${emoji}`)
        }
        
        // Trigger Vue reactivity for immediate UI update
        triggerRef(messages)
        console.log('🔄 [useChat] Triggered messages ref for optimistic reaction update')
      }
      
      // Send via WebSocket for real-time broadcast to other users
      if (isWebSocketConnected.value) {
        websocketService.addChatReaction(messageId, emoji)
        console.log(`✨ [useChat] Sent reaction.add via WebSocket`)
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
      console.log(`🗑️ [useChat] Removing reaction ${emoji} from message ${messageId}`)
      
      // Optimistic update - immediately update UI
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reaction = message.reactions.find(r => r.emoji === emoji)
        
        if (reaction) {
          // Remove current user from reaction
          reaction.users = reaction.users.filter(u => u.id !== currentUserId.value)
          console.log(`📝 [useChat] Optimistic: Removed user from reaction ${emoji}`)
          
          // Remove reaction if no users left
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji)
            console.log(`📝 [useChat] Optimistic: Removed empty reaction ${emoji}`)
          }
          
          // Trigger Vue reactivity for immediate UI update
          triggerRef(messages)
          console.log('🔄 [useChat] Triggered messages ref for optimistic reaction removal')
        }
      }
      
      // Send via WebSocket for real-time broadcast to other users
      if (isWebSocketConnected.value) {
        websocketService.removeChatReaction(messageId, emoji)
        console.log(`✨ [useChat] Sent reaction.remove via WebSocket`)
        return true
      } else {
        // Fallback to REST API if WebSocket is not connected
        console.warn('⚠️ [useChat] WebSocket not connected, using REST API fallback')
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
      console.log(`📤 [useChat] Uploading file: ${file.name}`, caption ? `with caption: "${caption}"` : '')
      
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
      
      console.log(`✅ [useChat] File uploaded successfully: ${response.id}`)
      
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
      console.log(`📝 [useChat] Updated caption for upload ${uploadId}`)
    }
  }

  // ============================================
  // WebSocket Integration
  // ============================================

  /**
   * Setup WebSocket event listeners for real-time chat updates
   * This should only be called ONCE globally, not per component
   */
  const setupWebSocketListeners = (): void => {
    // Prevent duplicate listener setup
    if (webSocketListenersSetup) {
      console.log('⏭️ WebSocket listeners already set up, skipping')
      return
    }
    
    console.log('🎧 Setting up WebSocket listeners for chat...')
    webSocketListenersSetup = true
    // Connection events
    websocketService.on('chat.connected', (data: any) => {
      console.log('✅ Chat WebSocket connected to thread:', data.threadId)
      isWebSocketConnected.value = true
    })

    websocketService.on('chat.disconnected', (data: any) => {
      console.log('🔌 Chat WebSocket disconnected:', data.reason)
      isWebSocketConnected.value = false
    })

    // New message received
    websocketService.on('chat.message.new', (data: any) => {
      console.log('📩 New message received via WebSocket:', data.message)
      const newMessage = data.message as Message
      
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
        console.log(`✅ Added new message to current thread ${newMessage.thread}`)
      } else if (!isForCurrentThread) {
        console.log(`⏭️ Message is for thread ${newMessage.thread}, but current thread is ${selectedThreadId.value}`)
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
      console.log('✏️ Message updated via WebSocket:', data.message)
      const updatedMessage = data.message as Message
      
      // ✅ Only update message if it belongs to the currently selected thread
      if (selectedThreadId.value !== updatedMessage.thread) {
        console.log(`⏭️ Updated message is for thread ${updatedMessage.thread}, but current thread is ${selectedThreadId.value}`)
        return
      }
      
      const index = messages.value.findIndex(m => m.id === updatedMessage.id)
      if (index !== -1) {
        messages.value[index] = updatedMessage
        console.log(`✅ Updated message ${updatedMessage.id} in current thread`)
      }
    })

    // Message deleted
    websocketService.on('chat.message.deleted', (data: any) => {
      console.log('🗑️ Message deleted via WebSocket:', data.message_id)
      
      // ✅ Check if the deleted message belongs to current thread before removing
      const messageToDelete = messages.value.find(m => m.id === data.message_id)
      if (!messageToDelete) {
        console.log(`⏭️ Message ${data.message_id} not found in current messages`)
        return
      }
      
      if (selectedThreadId.value !== messageToDelete.thread) {
        console.log(`⏭️ Deleted message is for thread ${messageToDelete.thread}, but current thread is ${selectedThreadId.value}`)
        return
      }
      
      const index = messages.value.findIndex(m => m.id === data.message_id)
      if (index !== -1) {
        messages.value.splice(index, 1)
        console.log(`✅ Removed deleted message ${data.message_id} from current thread`)
      }
    })

    // Typing indicators
    websocketService.on('chat.typing.start', (data: any) => {
      // Extract user info from data.user object
      const userId = data.user?.id || data.user_id
      if (userId !== currentUserId.value) {
        // Create display name from first_name and last_name
        const firstName = data.user?.first_name || ''
        const lastName = data.user?.last_name || ''
        const displayName = firstName && lastName ? `${firstName} ${lastName}` : 
                          firstName || lastName || data.user?.username || 'User'
        
        console.log('⌨️ User started typing:', displayName)
        // Store with user ID as key and display name as value
        typingUsers.value.set(userId, displayName)
      }
    })

    websocketService.on('chat.typing.stop', (data: any) => {
      const userId = data.user?.id || data.user_id
      if (userId !== currentUserId.value) {
        console.log('⌨️ User stopped typing')
        typingUsers.value.delete(userId)
      }
    })

    // Read receipts
    websocketService.on('chat.receipt.read', (data: any) => {
      console.log('👁️ Message read:', data.message_id, 'by user:', data.user_id)
      // Update read status in UI if needed
    })

    // Reactions
    websocketService.on('chat.reaction.added', (data: any) => {
      console.log('👍 [useChat] Reaction added via WebSocket:', { emoji: data.emoji, messageId: data.message_id, userId: data.user_id })
      console.log('🔍 [useChat] Type check - data.user_id:', data.user_id, typeof data.user_id, 'currentUserId:', currentUserId.value, typeof currentUserId.value)
      
      // Skip if this is from the current user (already handled by optimistic update)
      // Use == instead of === to handle type coercion (number vs string)
      if (data.user_id == currentUserId.value) {
        console.log('🚫 [useChat] Ignoring own reaction event (optimistic update already applied)')
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
            console.log(`✅ [useChat] Added user ${data.user_id} to existing reaction ${data.emoji}`)
          } else {
            console.log(`⏭️ [useChat] User ${data.user_id} already has reaction ${data.emoji}`)
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
          console.log(`✅ [useChat] Created new reaction ${data.emoji} for message ${data.message_id}`)
        }
        
        // Trigger Vue reactivity
        triggerRef(messages)
        console.log('🔄 [useChat] Triggered messages ref update for reaction added')
      } else {
        console.warn(`⚠️ [useChat] Message ${data.message_id} not found for reaction.added event`)
      }
    })

    websocketService.on('chat.reaction.removed', (data: any) => {
      console.log('❌ [useChat] Reaction removed via WebSocket:', { emoji: data.emoji, messageId: data.message_id, userId: data.user_id })
      console.log('🔍 [useChat] Type check - data.user_id:', data.user_id, typeof data.user_id, 'currentUserId:', currentUserId.value, typeof currentUserId.value)
      
      // Skip if this is from the current user (already handled by optimistic update)
      // Use == instead of === to handle type coercion (number vs string)
      if (data.user_id == currentUserId.value) {
        console.log('🚫 [useChat] Ignoring own reaction removal event (optimistic update already applied)')
        return
      }
      
      const messageIndex = messages.value.findIndex(m => m.id === data.message_id)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        const reaction = message.reactions.find(r => r.emoji === data.emoji)
        
        if (reaction) {
          const originalUserCount = reaction.users.length
          reaction.users = reaction.users.filter(u => u.id !== data.user_id)
          
          console.log(`🗑️ [useChat] Removed user ${data.user_id} from reaction ${data.emoji} (${originalUserCount} → ${reaction.users.length} users)`)
          
          // Remove reaction if no users left
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== data.emoji)
            console.log(`🧹 [useChat] Removed empty reaction ${data.emoji} from message`)
          }
          
          // Trigger Vue reactivity
          triggerRef(messages)
          console.log('🔄 [useChat] Triggered messages ref update for reaction removed')
        } else {
          console.warn(`⚠️ [useChat] Reaction ${data.emoji} not found on message ${data.message_id}`)
        }
      } else {
        console.warn(`⚠️ [useChat] Message ${data.message_id} not found for reaction.removed event`)
      }
    })

    // Thread updates
    websocketService.on('chat.thread.updated', (data: any) => {
      console.log('⚙️ Thread updated via WebSocket')
      if (currentThread.value && data.thread.id === currentThread.value.id) {
        currentThread.value = data.thread
      }
      
      const index = threads.value.findIndex(t => t.id === data.thread.id)
      if (index !== -1) {
        threads.value[index] = data.thread
      }
    })

    // Member events
    websocketService.on('chat.member.added', (data: any) => {
      console.log('👥 Member added:', data.username)
      // Refresh thread participants if needed
      if (currentThread.value) {
        selectThread(currentThread.value.id)
      }
    })

    websocketService.on('chat.member.removed', (data: any) => {
      console.log('👥 Member removed:', data.user_id)
      // Refresh thread participants if needed
      if (currentThread.value) {
        selectThread(currentThread.value.id)
      }
    })

    // Ping/Pong handlers (for WebSocket keepalive)
    websocketService.on('chat.ping', (_data: any) => {
      console.log('📡 Ping received from server')
      // WebSocket service automatically handles sending pong response
    })

    websocketService.on('chat.pong', (_data: any) => {
      console.log('📡 Pong received from server')
      // Connection is alive
    })

    // Unread count updates from backend
    console.log('👂 Registering listener for: chat.unread.update')
    websocketService.on('chat.unread.update', (data: any) => {
      console.log('📊 [useChat] Unread count update received:', data)
      console.log('📊 [useChat] Current threads:', threads.value.length)
      console.log('📊 [useChat] Looking for thread:', data.thread_id)
      
      // Update specific thread unread count with proper reactivity
      const threadIndex = threads.value.findIndex(t => t.id === data.thread_id)
      console.log('🔍 [useChat] Thread index found:', threadIndex)
      
      if (threadIndex !== -1) {
        // Create a new object to trigger Vue reactivity
        const oldCount = threads.value[threadIndex].unread_count
        threads.value[threadIndex] = {
          ...threads.value[threadIndex],
          unread_count: data.unread_count
        }
        // Force Vue to detect the change by triggering the ref
        triggerRef(threads)
        console.log(`✅ [useChat] Updated thread ${data.thread_id} unread_count: ${oldCount} → ${data.unread_count}`)
        console.log(`✅ [useChat] Total unread count is now: ${totalUnreadCount.value}`)
        console.log(`🔄 [useChat] Triggered ref update for reactivity`)
      } else {
        console.warn(`⚠️ [useChat] Thread ${data.thread_id} not found in ${threads.value.length} threads`)
        console.log('📊 [useChat] Storing as pending and will auto-fetch')
        // Store in pending map
        pendingUnreadCounts.value.set(data.thread_id, data.unread_count)
        console.log(`📊 [useChat] Pending counts now:`, Array.from(pendingUnreadCounts.value.entries()))
        
        // Auto-fetch threads if not yet initialized and not already fetching
        if (!hasInitializedThreads.value && !isAutoFetchingThreads.value) {
          console.log('🔄 [useChat] Auto-fetching threads to apply unread counts...')
          isAutoFetchingThreads.value = true
          fetchThreads(undefined, true).catch(err => {
            console.error('❌ [useChat] Auto-fetch threads failed:', err)
            isAutoFetchingThreads.value = false
          })
        } else {
          console.log(`🚫 [useChat] Not auto-fetching: hasInit=${hasInitializedThreads.value}, isFetching=${isAutoFetchingThreads.value}`)
        }
      }
    })

    websocketService.on('unread.count.update', (data: any) => {
      console.log('📊 Unread count update (legacy format):', data)
      
      // Support legacy format from backend with proper reactivity
      const threadIndex = threads.value.findIndex(t => t.id === data.thread_id)
      if (threadIndex !== -1) {
        threads.value[threadIndex] = {
          ...threads.value[threadIndex],
          unread_count: data.unread_count
        }
        triggerRef(threads)
        console.log(`✅ Updated thread ${data.thread_id} unread_count to ${data.unread_count} (legacy)`)
        console.log(`✅ Total unread count is now: ${totalUnreadCount.value}`)
      } else {
        console.warn(`⚠️ Thread ${data.thread_id} not found (legacy), storing as pending`)
        pendingUnreadCounts.value.set(data.thread_id, data.unread_count)
        
        if (!hasInitializedThreads.value && !isAutoFetchingThreads.value) {
          console.log('🔄 Auto-fetching threads to apply unread counts (legacy)...')
          isAutoFetchingThreads.value = true
          fetchThreads(undefined, true).catch(err => {
            console.error('Auto-fetch threads failed:', err)
            isAutoFetchingThreads.value = false
          })
        }
      }
    })

    // Initial unread counts from notification WebSocket
    websocketService.on('unread.counts.initial', (data: any) => {
      console.log('📊 Initial unread counts received:', data)
      
      // Update all thread unread counts from initial data with proper reactivity
      if (data.threads && Array.isArray(data.threads)) {
        data.threads.forEach((threadData: any) => {
          const threadIndex = threads.value.findIndex(t => t.id === threadData.thread_id)
          if (threadIndex !== -1) {
            threads.value[threadIndex] = {
              ...threads.value[threadIndex],
              unread_count: threadData.unread_count
            }
            console.log(`✅ Updated thread ${threadData.thread_id} unread_count to ${threadData.unread_count}`)
          }
        })
        triggerRef(threads)
      }
      
      console.log('✅ Total unread count after initial:', totalUnreadCount.value)
    })

    // Error handling
    websocketService.on('chat.error', (data: any) => {
      console.error('Chat WebSocket error:', data.message)
      error.value = data.message || 'WebSocket error occurred'
    })
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
    typingUsers.value.clear()
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
  console.log('🚀 useChat() called, about to setup WebSocket listeners...')
  console.log('🔍 webSocketListenersSetup status:', webSocketListenersSetup)
  setupWebSocketListeners()
  console.log('✅ setupWebSocketListeners() completed')

  // Cleanup on unmount - only disconnect chat WebSocket, keep notification listeners
  onUnmounted(() => {
    console.log('🧹 Component unmounting, disconnecting chat WebSocket but keeping notification listeners...')
    disconnectFromChatWebSocket()
    
    // Remove only chat-specific listeners (for active thread communication)
    // These are thread-specific and should be cleaned up when leaving the chat page
    websocketService.removeAllListeners('chat.connected')
    websocketService.removeAllListeners('chat.disconnected')
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
    websocketService.removeAllListeners('chat.ping')
    websocketService.removeAllListeners('chat.pong')
    
    // DO NOT remove these global notification listeners - they need to persist across all pages
    // for the badge to work correctly:
    // - chat.unread.update (critical for badge updates)
    // - unread.count.update
    console.log('✅ Chat-specific listeners removed, notification listeners preserved')
    websocketService.removeAllListeners('unread.counts.initial')
    websocketService.removeAllListeners('chat.error')
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
    const threadsTotal = threads.value.reduce((count, thread) => count + thread.unread_count, 0)
    const pendingTotal = Array.from(pendingUnreadCounts.value.values()).reduce((sum, count) => sum + count, 0)
    const total = threadsTotal + pendingTotal
    
    // Only log when count changes or when there are pending items
    if (total > 0 || pendingUnreadCounts.value.size > 0) {
      console.log('🔢 totalUnreadCount computed:', {
        total,
        threadsTotal,
        pendingTotal,
        threadsCount: threads.value.length,
        pendingCount: pendingUnreadCounts.value.size
      })
    }
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

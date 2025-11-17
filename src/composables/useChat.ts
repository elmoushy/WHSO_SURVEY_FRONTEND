// Internal Chat Composable with Polling Logic
// Based on FRONTEND_INTEGRATION_GUIDE_PART6.md - Polling Strategy

import { ref, computed, onUnmounted } from 'vue'
import { chatAPI, getThreadDisplayName, getThreadAvatar } from '../services/chatService'
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

// Polling state
const threadPollingInterval = ref<NodeJS.Timeout | null>(null)
const messagePollingInterval = ref<NodeJS.Timeout | null>(null)
const isPollingActive = ref(false)

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

  const fetchThreads = async (filters?: ThreadFilters): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await chatAPI.listThreads(filters)
      threads.value = response.results
      threadsTotalCount.value = response.count
      
      if (filters?.page) {
        threadsCurrentPage.value = filters.page
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to fetch threads'
      console.error('Error fetching threads:', err)
    } finally {
      isLoading.value = false
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
      isLoading.value = true
      error.value = null
      
      // Fetch thread details
      currentThread.value = await chatAPI.getThread(threadId)
      
      // Fetch messages
      await fetchMessages(threadId)
      
      // Mark as read
      await chatAPI.markThreadAsRead(threadId)
      
      // Update unread count in threads list
      const threadIndex = threads.value.findIndex(t => t.id === threadId)
      if (threadIndex !== -1) {
        threads.value[threadIndex].unread_count = 0
      }
      
      // Start message polling
      startMessagePolling(threadId)
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
        stopMessagePolling()
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
      // Optimistic update
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
        }
      }
      
      // Send to server
      const updatedMessage = await chatAPI.addReaction(messageId, { emoji })
      
      // Update with server response
      if (messageIndex !== -1) {
        messages.value[messageIndex] = updatedMessage
      }
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to add reaction'
      console.error('Error adding reaction:', err)
      return false
    }
  }

  const removeReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      const updatedMessage = await chatAPI.removeReaction(messageId, emoji)
      
      // Update message in list
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        messages.value[messageIndex] = updatedMessage
      }
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to remove reaction'
      console.error('Error removing reaction:', err)
      return false
    }
  }

  // ============================================
  // File Upload
  // ============================================

  const uploadFile = async (file: File): Promise<string | null> => {
    const uploadId = `upload-${Date.now()}`
    
    try {
      // Add to upload progress
      uploadProgress.value.push({
        id: uploadId,
        filename: file.name,
        progress: 0,
        status: 'uploading'
      })
      
      const response = await chatAPI.uploadAttachment(file, (progress) => {
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
      console.error('Error uploading file:', err)
      return null
    }
  }

  const removeUpload = (uploadId: string): void => {
    uploadProgress.value = uploadProgress.value.filter(u => u.id !== uploadId)
  }

  const clearUploads = (): void => {
    uploadProgress.value = []
  }

  // ============================================
  // Polling Logic
  // ============================================

  const startThreadPolling = (): void => {
    if (threadPollingInterval.value) return
    
    // Poll threads every 30 seconds
    threadPollingInterval.value = setInterval(() => {
      if (!document.hidden) {
        fetchThreads({ page: threadsCurrentPage.value })
      }
    }, 30000)
    
    isPollingActive.value = true
  }

  const stopThreadPolling = (): void => {
    if (threadPollingInterval.value) {
      clearInterval(threadPollingInterval.value)
      threadPollingInterval.value = null
    }
  }

  const startMessagePolling = (threadId: string): void => {
    // Stop existing polling
    stopMessagePolling()
    
    // Poll messages every 3 seconds
    messagePollingInterval.value = setInterval(() => {
      if (!document.hidden && selectedThreadId.value === threadId) {
        // Fetch only new messages (without cursor to get latest)
        chatAPI.listMessages(threadId).then(response => {
          const newMessages = response.results.reverse()
          
          // Find new messages not already in the list
          const lastMessageId = messages.value[messages.value.length - 1]?.id
          const newMessagesIndex = newMessages.findIndex(m => m.id === lastMessageId)
          
          if (newMessagesIndex !== -1 && newMessagesIndex < newMessages.length - 1) {
            // Add new messages
            const messagesToAdd = newMessages.slice(newMessagesIndex + 1)
            messages.value.push(...messagesToAdd)
          } else if (newMessagesIndex === -1 && newMessages.length > 0) {
            // Complete refresh if we can't find the last message
            messages.value = newMessages
          }
        }).catch(err => {
          console.error('Error polling messages:', err)
        })
      }
    }, 3000)
  }

  const stopMessagePolling = (): void => {
    if (messagePollingInterval.value) {
      clearInterval(messagePollingInterval.value)
      messagePollingInterval.value = null
    }
  }

  // Handle visibility change (pause polling when tab hidden)
  const handleVisibilityChange = (): void => {
    if (document.hidden) {
      stopThreadPolling()
      stopMessagePolling()
    } else {
      if (threads.value.length > 0) {
        startThreadPolling()
      }
      if (selectedThreadId.value) {
        startMessagePolling(selectedThreadId.value)
      }
    }
  }

  // Watch for visibility changes
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopThreadPolling()
    stopMessagePolling()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
    return threads.value.reduce((count, thread) => count + thread.unread_count, 0)
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
    
    // Polling
    startThreadPolling,
    stopThreadPolling,
    startMessagePolling,
    stopMessagePolling,
    
    // UI state
    setReplyingTo: (message: Message | null) => { replyingTo.value = message },
    setEditingMessage: (message: Message | null) => { editingMessage.value = message },
    clearError: () => { error.value = null }
  }
}

// Internal Chat API Service
// Based on FRONTEND_INTEGRATION_GUIDE documentation

import { apiClient } from './jwtAuthService'
import type {
  Thread,
  Message,
  PaginatedThreadsResponse,
  CursorPaginatedMessagesResponse,
  CreateThreadRequest,
  SendMessageRequest,
  EditMessageRequest,
  AddReactionRequest,
  AddMembersRequest,
  RemoveMemberRequest,
  ChangeRoleRequest,
  UpdateGroupSettingsRequest,
  AddMembersResponse,
  RemoveMemberResponse,
  ChangeRoleResponse,
  UpdateGroupSettingsResponse,
  MarkAsReadResponse,
  LeaveThreadResponse,
  AttachmentUploadResponse,
  ThreadFilters,
  MessageFilters,
  MessageAttachment,
  ChatUser,
  MessageReaction
} from '../types/chat.types'
import type { AxiosProgressEvent } from 'axios'

// Base URL for chat endpoints
const CHAT_BASE = '/internal-chat'

// ============================================
// Data Transformation Helpers
// ============================================

// Transform API message response to match frontend Message type
const transformMessage = (apiMessage: any): Message => {
  // Transform sender to include full_name
  const sender = {
    id: apiMessage.sender.id,
    email: apiMessage.sender.email,
    first_name: apiMessage.sender.first_name,
    last_name: apiMessage.sender.last_name,
    full_name: `${apiMessage.sender.first_name} ${apiMessage.sender.last_name}`.trim(),
    role: apiMessage.sender.role || 'user'
  }

  // Transform reactions - API returns array of {id, emoji, user, created_at}
  // Frontend expects array of {emoji, users: [...]}
  const reactionsMap = new Map<string, ChatUser[]>()

  if (apiMessage.reactions && Array.isArray(apiMessage.reactions)) {
    apiMessage.reactions.forEach((reaction: any) => {
      if (!reactionsMap.has(reaction.emoji)) {
        reactionsMap.set(reaction.emoji, [])
      }
      const users = reactionsMap.get(reaction.emoji)!
      const user = {
        id: reaction.user.id,
        email: reaction.user.email,
        first_name: reaction.user.first_name,
        last_name: reaction.user.last_name,
        full_name: `${reaction.user.first_name} ${reaction.user.last_name}`.trim(),
        role: reaction.user.role || 'user'
      }
      // Avoid duplicates
      if (!users.some(u => u.id === user.id)) {
        users.push(user)
      }
    })
  }

  const reactions: MessageReaction[] = Array.from(reactionsMap.entries()).map(([emoji, users]) => ({
    emoji,
    users
  }))

  return {
    id: apiMessage.id,
    thread: apiMessage.thread,
    sender,
    content: apiMessage.content,
    reply_to: apiMessage.reply_to,
    has_attachments: apiMessage.has_attachments,
    created_at: apiMessage.created_at,
    edited_at: apiMessage.edited_at,
    reactions,
    attachments: apiMessage.attachments || [],
    is_deleted: apiMessage.is_deleted || false
  }
}

// ============================================
// User Management
// ============================================

export interface SearchUsersResponse {
  count: number          // Total matching results (max 100)
  next: string | null    // URL to next page
  previous: string | null // URL to previous page
  results: ChatUser[]    // Array of user objects (max 50 per page)
}

// Legacy interface for backward compatibility (deprecated)
export interface ChatUserListResponse {
  count: number
  users: Array<{
    id: number
    email: string
    full_name: string
    role: 'user' | 'admin' | 'super_admin'
  }>
}

// ============================================
// Thread Management
// ============================================

export const chatAPI = {
  // Get all users with pagination (no search required)
  getUsers: async (page: number = 1, pageSize: number = 20): Promise<SearchUsersResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    })

    const response = await apiClient.get<SearchUsersResponse>(
      `${CHAT_BASE}/users/?${params.toString()}`
    )
    return response.data
  },

  // Search users with optional search query
  searchUsers: async (searchQuery: string, page: number = 1): Promise<SearchUsersResponse> => {
    const params = new URLSearchParams({
      page: page.toString()
    })

    // Add search parameter if provided
    if (searchQuery && searchQuery.trim().length > 0) {
      params.append('search', searchQuery.trim())
    }

    const response = await apiClient.get<SearchUsersResponse>(
      `${CHAT_BASE}/users/?${params.toString()}`
    )
    return response.data
  },

  // Legacy method - Now works as alias for getUsers
  listUsers: async (page: number = 1): Promise<SearchUsersResponse> => {
    return chatAPI.getUsers(page)
  },

  // List all threads with optional filters
  listThreads: async (filters?: ThreadFilters): Promise<PaginatedThreadsResponse> => {
    const params = new URLSearchParams()

    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.page_size) params.append('page_size', filters.page_size.toString())
    if (filters?.type) params.append('type', filters.type)
    if (filters?.search) params.append('search', filters.search)

    const response = await apiClient.get<PaginatedThreadsResponse>(
      `${CHAT_BASE}/threads/?${params.toString()}`
    )
    return response.data
  },

  // Get thread details
  getThread: async (threadId: string): Promise<Thread> => {
    const response = await apiClient.get<Thread>(`${CHAT_BASE}/threads/${threadId}/`)
    return response.data
  },

  // Create new thread (direct or group)
  createThread: async (data: CreateThreadRequest): Promise<Thread> => {
    console.log('🟢 [chatAPI] createThread called with:', data)
    console.log('🟢 [chatAPI] Posting to:', `${CHAT_BASE}/threads/`)
    const response = await apiClient.post<Thread>(`${CHAT_BASE}/threads/`, data)
    console.log('🟢 [chatAPI] createThread response:', response.data)
    return response.data
  },

  // Update thread (group settings for group threads)
  updateThread: async (threadId: string, data: { title?: string }): Promise<Thread> => {
    const response = await apiClient.patch<Thread>(`${CHAT_BASE}/threads/${threadId}/`, data)
    return response.data
  },

  // Delete thread (soft delete)
  deleteThread: async (threadId: string): Promise<void> => {
    await apiClient.delete(`${CHAT_BASE}/threads/${threadId}/`)
  },

  // ============================================
  // Thread Actions
  // ============================================

  // Mark thread as read
  markThreadAsRead: async (threadId: string): Promise<MarkAsReadResponse> => {
    const response = await apiClient.post<MarkAsReadResponse>(
      `${CHAT_BASE}/threads/${threadId}/mark-read/`
    )
    return response.data
  },

  // Mute/unmute thread notifications
  muteThread: async (threadId: string, mute: boolean): Promise<{ message: string; is_muted: boolean }> => {
    const response = await apiClient.post<{ message: string; is_muted: boolean }>(
      `${CHAT_BASE}/threads/${threadId}/mute/`,
      { muted: mute }
    )
    return response.data
  },

  // Leave thread (remove self from participants)
  leaveThread: async (threadId: string): Promise<LeaveThreadResponse> => {
    const response = await apiClient.post<LeaveThreadResponse>(
      `${CHAT_BASE}/threads/${threadId}/leave/`
    )
    return response.data
  },

  // Add members to group thread
  addMembers: async (threadId: string, data: AddMembersRequest): Promise<AddMembersResponse> => {
    const response = await apiClient.post<AddMembersResponse>(
      `${CHAT_BASE}/threads/${threadId}/add-members/`,
      data
    )
    return response.data
  },

  // Remove member from group thread
  removeMember: async (threadId: string, data: RemoveMemberRequest): Promise<RemoveMemberResponse> => {
    const response = await apiClient.post<RemoveMemberResponse>(
      `${CHAT_BASE}/threads/${threadId}/remove-member/`,
      data
    )
    return response.data
  },

  // Change member role in group thread
  changeRole: async (threadId: string, data: ChangeRoleRequest): Promise<ChangeRoleResponse> => {
    const response = await apiClient.post<ChangeRoleResponse>(
      `${CHAT_BASE}/threads/${threadId}/change-role/`,
      data
    )
    return response.data
  },

  // Get group settings (any participant)
  getGroupSettings: async (threadId: string): Promise<UpdateGroupSettingsResponse> => {
    const response = await apiClient.get<UpdateGroupSettingsResponse>(
      `${CHAT_BASE}/threads/${threadId}/group-settings/`
    )
    return response.data
  },

  // Update group settings (admins and owners only)
  updateGroupSettings: async (
    threadId: string,
    data: UpdateGroupSettingsRequest
  ): Promise<UpdateGroupSettingsResponse> => {
    const response = await apiClient.patch<UpdateGroupSettingsResponse>(
      `${CHAT_BASE}/threads/${threadId}/group-settings/`,
      data
    )
    return response.data
  },

  // ============================================
  // Message Management
  // ============================================

  // List messages in thread with cursor pagination
  listMessages: async (threadId: string, filters?: MessageFilters): Promise<CursorPaginatedMessagesResponse> => {
    const params = new URLSearchParams()
    if (filters?.cursor) params.append('cursor', filters.cursor)

    const response = await apiClient.get<any>(
      `${CHAT_BASE}/threads/${threadId}/messages/?${params.toString()}`
    )

    // Transform API response to match expected structure
    return {
      next: response.data.next,
      previous: response.data.previous,
      results: response.data.results.map((msg: any) => transformMessage(msg))
    }
  },

  // Send new message
  sendMessage: async (threadId: string, data: SendMessageRequest): Promise<Message> => {
    const response = await apiClient.post<any>(
      `${CHAT_BASE}/threads/${threadId}/messages/`,
      data
    )
    return transformMessage(response.data)
  },

  // Get message details
  getMessage: async (messageId: string): Promise<Message> => {
    const response = await apiClient.get<any>(`${CHAT_BASE}/messages/${messageId}/`)
    return transformMessage(response.data)
  },

  // Edit message
  editMessage: async (messageId: string, data: EditMessageRequest): Promise<Message> => {
    const response = await apiClient.patch<any>(
      `${CHAT_BASE}/messages/${messageId}/`,
      data
    )
    return transformMessage(response.data)
  },

  // Delete message (soft delete)
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`${CHAT_BASE}/messages/${messageId}/`)
  },

  // ============================================
  // Reactions
  // ============================================

  // Add reaction to message
  addReaction: async (messageId: string, data: AddReactionRequest): Promise<Message> => {
    const response = await apiClient.post<any>(
      `${CHAT_BASE}/messages/${messageId}/react/`,
      data
    )
    return transformMessage(response.data)
  },

  // Remove reaction from message
  removeReaction: async (messageId: string, emoji: string): Promise<Message> => {
    const response = await apiClient.post<any>(
      `${CHAT_BASE}/messages/${messageId}/unreact/`,
      { emoji }
    )
    return transformMessage(response.data)
  },

  // ============================================
  // Attachments
  // ============================================

  // Upload file attachment
  uploadAttachment: async (
    file: File,
    caption?: string,
    onProgress?: (progress: number) => void
  ): Promise<AttachmentUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    // Add caption if provided
    if (caption && caption.trim()) {
      formData.append('caption', caption.trim())
    }

    const response = await apiClient.post<AttachmentUploadResponse>(
      `${CHAT_BASE}/attachments/upload/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percentCompleted)
          }
        }
      }
    )
    return response.data
  },

  // Get attachment details
  getAttachment: async (attachmentId: string): Promise<MessageAttachment> => {
    const response = await apiClient.get<MessageAttachment>(
      `${CHAT_BASE}/attachments/${attachmentId}/`
    )
    return response.data
  },

  // Delete attachment (only before message is sent)
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await apiClient.delete(`${CHAT_BASE}/attachments/${attachmentId}/`)
  },

  // Fetch image as authenticated blob for preview
  fetchImageAsBlob: async (attachmentId: string): Promise<string> => {
    try {
      console.log(`🖼️ Fetching image preview for attachment: ${attachmentId}`)

      const response = await apiClient.get(
        `${CHAT_BASE}/attachments/${attachmentId}/download/`,
        {
          responseType: 'blob'
        }
      )

      // Convert blob to base64 data URL (bypasses CSP blob: restrictions)
      const blob = new Blob([response.data])

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result as string
          console.log(`✅ Image converted to base64 data URL`)
          resolve(base64data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('❌ Failed to fetch image:', error)
      throw error
    }
  },

  // Download attachment using dedicated endpoint
  downloadAttachmentFile: async (
    attachmentId: string,
    filename: string
  ): Promise<void> => {
    try {
      console.log(`📥 Downloading attachment: ${filename}`)

      const response = await apiClient.get(
        `${CHAT_BASE}/attachments/${attachmentId}/download/`,
        {
          responseType: 'blob'
        }
      )

      // ✅ CRITICAL: Use the filename parameter from attachment.file_name
      // Don't rely on blob.name (it's undefined) or Content-Disposition parsing
      const downloadFilename = filename

      // Create blob URL and trigger download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.style.display = 'none'
      link.href = url
      link.download = downloadFilename // ✅ Use the provided filename

      document.body.appendChild(link)
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      console.log(`✅ Downloaded: ${downloadFilename}`)
    } catch (error) {
      console.error('❌ Download error:', error)
      throw error
    }
  },

  // Get attachment download URL (for simple cases)
  downloadAttachment: (attachmentUrl: string): string => {
    // If URL is relative, prepend base URL
    if (attachmentUrl.startsWith('/')) {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      return `${baseURL}${attachmentUrl}`
    }
    return attachmentUrl
  }
}

// ============================================
// Utility Functions
// ============================================

// Validate file before upload
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ]

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds maximum limit of 10 MB' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF'
    }
  }

  if (file.name.length > 255) {
    return { valid: false, error: 'Filename exceeds maximum length of 255 characters' }
  }

  return { valid: true }
}

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Get file icon based on content type
export const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return 'bi-file-image'
  if (contentType.includes('pdf')) return 'bi-file-pdf'
  if (contentType.includes('word')) return 'bi-file-word'
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'bi-file-excel'
  if (contentType.includes('text')) return 'bi-file-text'
  return 'bi-file-earmark'
}

// Format relative time (e.g., "2m ago", "Yesterday")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

// Format message timestamp
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Check if message is from current user
export const isMyMessage = (message: Message, currentUserId: number | string): boolean => {
  if (!currentUserId) return false
  return String(message.sender.id) === String(currentUserId)
}

// Get thread display name (for direct threads, show other participant's name)
export const getThreadDisplayName = (thread: Thread, currentUserId: number | string): string => {
  if (thread.type === 'group') {
    return thread.title || 'Untitled Group'
  }

  // For direct threads, find the other participant
  const otherParticipant = thread.participants.find(p => String(p.user.id) !== String(currentUserId))
  if (!otherParticipant) return 'Unknown User'

  const { first_name, last_name } = otherParticipant.user
  return `${first_name} ${last_name}`.trim() || 'Unknown User'
}

// Get thread avatar (for direct threads, show other participant's initials)
export const getThreadAvatar = (thread: Thread, currentUserId: number | string): string => {
  if (thread.type === 'group') {
    return thread.title?.charAt(0).toUpperCase() || 'G'
  }

  const otherParticipant = thread.participants.find(p => String(p.user.id) !== String(currentUserId))
  if (!otherParticipant) return '?'

  const firstName = otherParticipant.user.first_name?.charAt(0) || ''
  const lastName = otherParticipant.user.last_name?.charAt(0) || ''
  return (firstName + lastName).toUpperCase() || '?'
}

export default chatAPI

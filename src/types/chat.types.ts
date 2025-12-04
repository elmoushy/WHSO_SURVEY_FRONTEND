// Internal Chat Type Definitions
// Based on FRONTEND_INTEGRATION_GUIDE documentation

// ============================================
// User and Participant Types
// ============================================

export interface ChatUser {
  id: number
  username?: string // Added for new API format
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_online?: boolean // Added for new API format
  last_seen?: string // Added for new API format (ISO 8601 datetime)
  role: 'admin' | 'super_admin' | 'user'
}

export type ParticipantRole = 'owner' | 'admin' | 'member'

export interface ThreadParticipant {
  user: ChatUser
  role: ParticipantRole
  joined_at: string
  is_muted: boolean
  unread_count: number
}

// ============================================
// Thread Types
// ============================================

export type ThreadType = 'direct' | 'group'
export type PostingMode = 'all' | 'admins_only'

export interface GroupSettings {
  thread_id?: string
  posting_mode: PostingMode
  members_can_add_others: boolean
  mentions_enabled?: boolean
  reactions_enabled?: boolean
  updated_at?: string
  updated_by?: {
    id: number
    first_name: string
    last_name: string
  } | null
}

export interface Thread {
  id: string
  type: ThreadType
  title: string | null
  chat_name?: string
  created_at: string
  updated_at: string
  unread_count: number
  last_message: LastMessage | null
  participants: ThreadParticipant[]
  my_role: ParticipantRole
  group_settings: GroupSettings | null
}

export interface LastMessage {
  id: string
  sender: ChatUser
  content: string
  created_at: string
  has_attachments: boolean
}

// ============================================
// Message Types
// ============================================

export interface MessageReaction {
  emoji: string
  users: ChatUser[]
}

export interface MessageAttachment {
  id: string
  file_name: string  // Backend uses file_name (snake_case)
  url: string  // Backend uses url (not 'file')
  content_type: string
  size: number
  size_mb: number  // Backend also provides size_mb
  created_at: string
  caption?: string  // Optional caption/comment for the attachment
}

export interface ReplyToMessage {
  id: string
  content: string
  sender: ChatUser
  attachments?: MessageAttachment[]
}

export interface Message {
  id: string
  thread: string
  sender: ChatUser
  content: string
  reply_to: ReplyToMessage | null
  has_attachments: boolean
  created_at: string
  edited_at: string | null
  reactions: MessageReaction[]
  attachments: MessageAttachment[]
  is_deleted?: boolean
}

// ============================================
// Request/Response Types
// ============================================

// Thread Creation
export interface CreateDirectThreadRequest {
  type: 'direct'
  participant_ids: [number]
}

export interface CreateGroupThreadRequest {
  type: 'group'
  title: string
  participant_ids: number[]
  group_settings?: Partial<GroupSettings>
}

export type CreateThreadRequest = CreateDirectThreadRequest | CreateGroupThreadRequest

// Thread Actions
export interface AddMembersRequest {
  user_ids: number[]
  role?: 'admin' | 'member'
}

export interface RemoveMemberRequest {
  user_id: number
}

export interface ChangeRoleRequest {
  user_id: number
  role: 'admin' | 'member'
}

export interface UpdateGroupSettingsRequest {
  posting_mode?: PostingMode
  members_can_add_others?: boolean
}

// Message Sending
export interface SendMessageRequest {
  content: string
  reply_to?: string
  attachment_ids?: string[]
}

export interface EditMessageRequest {
  content: string
}

export interface AddReactionRequest {
  emoji: string
}

// ============================================
// Paginated Response Types
// ============================================

export interface PaginatedThreadsResponse {
  count: number
  next: string | null
  previous: string | null
  results: Thread[]
}

export interface CursorPaginatedMessagesResponse {
  next: string | null
  previous: string | null
  results: Message[]
}

// ============================================
// API Response Types
// ============================================

export interface AddMembersResponse {
  message: string
  added_users: ChatUser[]
}

export interface RemoveMemberResponse {
  message: string
  removed_user: ChatUser
}

export interface ChangeRoleResponse {
  message: string
  user: ChatUser
  new_role: ParticipantRole
}

export interface UpdateGroupSettingsResponse {
  thread_id: string
  posting_mode: PostingMode
  members_can_add_others: boolean
  mentions_enabled: boolean
  reactions_enabled: boolean
  updated_at: string
  updated_by: {
    id: number
    first_name: string
    last_name: string
  } | null
}

// WebSocket event for group settings update
export interface GroupSettingsUpdatedEvent {
  type: 'group.settings.updated'
  thread_id: string
  settings: {
    posting_mode: PostingMode
    members_can_add_others: boolean
  }
  updated_by: {
    id: number
    first_name: string
    last_name: string
  }
  timestamp: string
}

export interface MarkAsReadResponse {
  message: string
  thread_id: string
  unread_count: number
}

export interface LeaveThreadResponse {
  message: string
  thread_id: string
}

export interface AttachmentUploadResponse {
  id: string
  file_name: string  // Backend uses file_name (snake_case)
  url: string  // Backend uses url (not 'file')
  content_type: string
  size: number
  size_mb: number
  created_at: string
  caption?: string  // Optional caption from upload
}

// ============================================
// UI State Types
// ============================================

export interface ChatUIState {
  selectedThreadId: string | null
  isThreadListOpen: boolean
  isThreadInfoOpen: boolean
  replyingTo: Message | null
  editingMessage: Message | null
}

export interface UploadProgress {
  id: string
  file_name: string  // Match backend naming convention
  progress: number
  status: 'uploading' | 'completed' | 'error'
  attachmentId?: string
  caption?: string  // Optional caption for the attachment
}

// ============================================
// Filter and Search Types
// ============================================

export interface ThreadFilters {
  type?: ThreadType
  search?: string
  page?: number
  page_size?: number
}

export interface MessageFilters {
  cursor?: string
}

// ============================================
// Error Types
// ============================================

export interface ChatAPIError {
  error?: string
  detail?: string
  [key: string]: any
}

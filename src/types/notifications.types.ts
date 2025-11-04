// Notification Types
export interface NotificationTranslations {
  en: string
  ar: string
}

export interface NotificationMetadata {
  [key: string]: any
  survey_id?: string
  survey_title?: string
  assigned_by?: string
  maintenance_id?: string
  duration_hours?: number
}

export type NotificationType = 
  | 'survey_assigned'
  | 'survey_completed'
  | 'survey_shared'
  | 'survey_updated'
  | 'survey_deleted'
  | 'admin_message'
  | 'system_alert'
  | 'user_mention'
  | 'group_invitation'
  | 'response_received'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  recipient: number
  sender?: number
  sender_name?: string
  title: NotificationTranslations
  body: NotificationTranslations
  title_localized: string
  body_localized: string
  notification_type: NotificationType
  priority: NotificationPriority
  action_url?: string
  metadata: NotificationMetadata
  is_read: boolean
  read_at?: string
  created_at: string
  expires_at?: string
  is_expired: boolean
  sent_via_websocket: boolean
  websocket_sent_at?: string
}

export interface NotificationStats {
  total_notifications: number
  unread_notifications: number
  read_notifications: number
  notifications_by_type: Record<NotificationType, number>
  notifications_by_priority: Record<NotificationPriority, number>
  recent_notifications_count: number
  expired_notifications_count: number
}

export interface NotificationPreferences {
  id: number
  user: number
  email_notifications: boolean
  websocket_notifications: boolean
  notification_types: Record<NotificationType, boolean>
  preferred_language: 'en' | 'ar'
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  page?: number
  page_size?: number
  is_read?: boolean
  type?: NotificationType
  priority?: NotificationPriority
  date_from?: string
  date_to?: string
  exclude_expired?: boolean
  search?: string
  ordering?: string
  lang?: 'en' | 'ar'
}

export interface NotificationListResponse {
  count: number
  next?: string
  previous?: string
  results: Notification[]
  meta: {
    filters_applied: NotificationFilters
    lang: string
  }
}

export interface BulkNotificationAction {
  notification_ids: string[]
  action: 'mark_read' | 'delete'
}

export interface BulkNotificationResult {
  status: 'success' | 'error'
  message: string
  data: {
    action: string
    processed_count: number
    total_selected: number
  }
}

export interface CreateNotificationRequest {
  recipient_ids: number[]
  title: NotificationTranslations
  body: NotificationTranslations
  notification_type: NotificationType
  priority?: NotificationPriority
  action_url?: string
  metadata?: NotificationMetadata
  expires_at?: string
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  status?: string
}

// Notification type configurations
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  survey_assigned: 'fas fa-clipboard-list',
  survey_completed: 'fas fa-check-circle',
  survey_shared: 'fas fa-share',
  survey_updated: 'fas fa-edit',
  survey_deleted: 'fas fa-trash',
  admin_message: 'fas fa-bullhorn',
  system_alert: 'fas fa-exclamation-triangle',
  user_mention: 'fas fa-at',
  group_invitation: 'fas fa-users',
  response_received: 'fas fa-reply'
}

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: '#22c55e',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
}

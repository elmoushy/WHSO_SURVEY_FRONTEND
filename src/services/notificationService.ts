import { apiClient } from './apiService'
import { getAccessToken } from './jwtAuthService'
import type {
  Notification,
  NotificationListResponse,
  NotificationStats,
  NotificationPreferences,
  NotificationFilters,
  BulkNotificationAction,
  BulkNotificationResult,
  CreateNotificationRequest,
  ApiResponse
} from '../types/notifications.types'

class NotificationService {
  private baseURL = '/notifications'

  /**
   * Get list of notifications with filtering and pagination
   */
  async getNotifications(filters?: NotificationFilters): Promise<NotificationListResponse> {
    try {
      const params = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      const url = `${this.baseURL}/${params.toString() ? `?${params.toString()}` : ''}`
      // console.log('NotificationService: Making request to:', url)
      
      // Get JWT token and send it explicitly like surveyService
      const token = getAccessToken()
      // console.log('NotificationService: Using token:', token ? 'Token present' : 'No token')
      
      const response = await apiClient.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      // console.log('NotificationService: Response received:', response.data)
      
      // Handle response similar to surveyService pattern
      if (response.data && response.data.status === 'success') {
        return response.data.data
      }
      return response.data
    } catch (error: any) {
      console.error('NotificationService: API Error:', error)
      if (error.response) {
        console.error('NotificationService: Response status:', error.response.status)
        console.error('NotificationService: Response data:', error.response.data)
      }
      throw error
    }
  }

  /**
   * Get a specific notification by ID
   */
  async getNotification(notificationId: string, lang?: 'en' | 'ar'): Promise<Notification> {
    const params = lang ? `?lang=${lang}` : ''
    const token = getAccessToken()
    const response = await apiClient.get(`${this.baseURL}/${notificationId}/${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    return response.data
  }

  /**
   * Mark a notification as read/unread
   */
  async updateNotification(notificationId: string, isRead: boolean): Promise<Notification> {
    const token = getAccessToken()
    const response = await apiClient.patch(`${this.baseURL}/${notificationId}/`, {
      is_read: isRead
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    return response.data
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(lang?: 'en' | 'ar'): Promise<ApiResponse<{ updated_count: number }>> {
    const params = lang ? `?lang=${lang}` : ''
    const token = getAccessToken()
    const response = await apiClient.post(
      `${this.baseURL}/mark-all-read/${params}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data && response.data.status === 'success') {
      return response.data
    }
    return response.data
  }

  /**
   * Perform bulk actions on notifications
   */
  async bulkAction(actionData: BulkNotificationAction): Promise<BulkNotificationResult> {
    const token = getAccessToken()
    const response = await apiClient.post(
      `${this.baseURL}/bulk-action/`,
      actionData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    return response.data
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(lang?: 'en' | 'ar'): Promise<ApiResponse<NotificationStats>> {
    const params = lang ? `?lang=${lang}` : ''
    const token = getAccessToken()
    const response = await apiClient.get(
      `${this.baseURL}/stats/${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data && response.data.status === 'success') {
      return response.data
    }
    return response.data
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const token = getAccessToken()
    const response = await apiClient.get(`${this.baseURL}/preferences/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    return response.data
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const token = getAccessToken()
    const response = await apiClient.patch(
      `${this.baseURL}/preferences/`,
      preferences,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data && response.data.status === 'success') {
      return response.data.data
    }
    return response.data
  }

  /**
   * Create and send notification (Admin only)
   */
  async createNotification(notificationData: CreateNotificationRequest): Promise<ApiResponse<{ id: string; recipients_count: number; sent_via_websocket: boolean }>> {
    const token = getAccessToken()
    const response = await apiClient.post(
      `${this.baseURL}/admin/create/`,
      notificationData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.data && response.data.status === 'success') {
      return response.data
    }
    return response.data
  }

  /**
   * Get unread notification count (optimized for header badge)
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.getNotifications({
        is_read: false,
        page_size: 1
      })
      return response.count
    } catch (error) {
      console.error('Failed to get unread notification count:', error)
      return 0
    }
  }

  /**
   * Get recent notifications for dropdown (limited to 10)
   */
  async getRecentNotifications(lang?: 'en' | 'ar'): Promise<Notification[]> {
    try {
      // console.log('NotificationService: Getting recent notifications with lang:', lang)
      const response = await this.getNotifications({
        page_size: 10,
        ordering: '-created_at',
        exclude_expired: true,
        lang
      })
      // console.log('NotificationService: Received response:', response)
      return response.results || []
    } catch (error) {
      console.error('Failed to get recent notifications:', error)
      return []
    }
  }

  /**
   * Format notification time for display
   */
  formatNotificationTime(createdAt: string): string {
    const now = new Date()
    const notificationDate = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`
      } else {
        return notificationDate.toLocaleDateString('en-US', { calendar: 'gregory' })
      }
    }
  }

  /**
   * Format notification time for Arabic display
   */
  formatNotificationTimeAr(createdAt: string): string {
    const now = new Date()
    const notificationDate = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return 'الآن'
    } else if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60)
      return `منذ ${hours} ساعة`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      if (days < 7) {
        return `منذ ${days} يوم`
      } else {
        return notificationDate.toLocaleDateString('ar-EG', { calendar: 'gregory' })
      }
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService

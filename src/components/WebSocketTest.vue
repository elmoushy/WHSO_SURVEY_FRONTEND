<!-- WebSocket Notifications Test Component -->
<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <h1>WebSocket Notifications Test</h1>
    
    <!-- Connection Status -->
    <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #f8f9fa;">
      <h3>Connection Status</h3>
      <p><strong>Authenticated:</strong> {{ isAuthenticated ? '✅ Yes' : '❌ No' }}</p>
      <p><strong>User:</strong> {{ user?.email || 'Not logged in' }}</p>
      <p><strong>Connected:</strong> {{ isConnected ? '✅ Yes' : '❌ No' }}</p>
      <p><strong>Connecting:</strong> {{ isConnecting ? '🔄 Yes' : '❌ No' }}</p>
      <p><strong>Error:</strong> {{ connectionError || 'None' }}</p>
      <p><strong>Unread Count:</strong> {{ unreadCount }}</p>
    </div>

    <!-- Controls -->
    <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button @click="connect" :disabled="isConnected" style="padding: 8px 16px;">
        Connect
      </button>
      <button @click="disconnect" :disabled="!isConnected" style="padding: 8px 16px;">
        Disconnect
      </button>
      <button @click="refreshUnreadCount" :disabled="!isConnected" style="padding: 8px 16px;">
        Refresh Count
      </button>
      <button @click="requestPermission" style="padding: 8px 16px;">
        Request Browser Permission
      </button>
      <button @click="clearNotifications" style="padding: 8px 16px;">
        Clear Notifications
      </button>
    </div>

    <!-- Realtime Notifications -->
    <div style="margin-bottom: 20px;">
      <h3>Real-time Notifications ({{ realtimeNotifications.length }})</h3>
      <div v-if="realtimeNotifications.length === 0" style="padding: 20px; text-align: center; color: #666;">
        No real-time notifications received yet
      </div>
      <div v-for="notification in realtimeNotifications" :key="notification.id" 
           style="margin-bottom: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0;">{{ notification.title_localized }}</h4>
            <p style="margin: 0 0 10px 0; color: #666;">{{ notification.body_localized }}</p>
            <small style="color: #999;">
              {{ notification.notification_type }} | 
              {{ notification.priority }} | 
              {{ formatTime(notification.created_at) }}
            </small>
          </div>
          <div style="display: flex; gap: 10px; margin-left: 15px;">
            <span :style="{ 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '12px', 
              background: notification.is_read ? '#d4edda' : '#fff3cd',
              color: notification.is_read ? '#155724' : '#856404'
            }">
              {{ notification.is_read ? 'Read' : 'Unread' }}
            </span>
            <button v-if="!notification.is_read" @click="markAsRead(notification.id)" 
                    style="padding: 4px 8px; font-size: 12px;">
              Mark Read
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Info -->
    <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <h3>Connection Details</h3>
      <pre style="background: #fff; padding: 10px; border-radius: 4px; font-size: 12px;">{{ 
        JSON.stringify(getConnectionStatus(), null, 2) 
      }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebSocketNotifications } from '../composables/useWebSocketNotifications'
import { useSimpleAuth } from '../composables/useSimpleAuth'

// Authentication state
const { isAuthenticated, user } = useSimpleAuth()

// WebSocket composable
const {
  realtimeNotifications,
  isConnected,
  isConnecting,
  connectionError,
  unreadCount,
  connect,
  disconnect,
  markAsRead,
  refreshUnreadCount,
  requestNotificationPermission,
  clearRealtimeNotifications,
  getConnectionStatus
} = useWebSocketNotifications({
  autoConnect: false, // Manual control for testing
  showBrowserNotifications: true,
  subscribeToTypes: ['survey_assigned', 'admin_message', 'system_alert', 'test_notification']
})

// Methods
const requestPermission = async () => {
  const permission = await requestNotificationPermission()
  alert(`Browser notification permission: ${permission}`)
}

const clearNotifications = () => {
  clearRealtimeNotifications()
}

const formatTime = (createdAt: string): string => {
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
</script>

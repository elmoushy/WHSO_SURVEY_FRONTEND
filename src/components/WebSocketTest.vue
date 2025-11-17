<!-- WebSocket Notifications Test Component -->
<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <h1>WebSocket Notifications Test</h1>
    
    <!-- Connection Status -->
    <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #f8f9fa;">
      <h3>Connection Status</h3>
      <p><strong>Authenticated:</strong> {{ isAuthenticated ? '✅ Yes' : '❌ No' }}</p>
      <p><strong>User:</strong> {{ user?.email || 'Not logged in' }}</p>
      <p><strong>Global Notification WebSocket:</strong> {{ isNotificationConnected ? '✅ Connected' : '❌ Disconnected' }}</p>
    </div>

    <!-- Backend Verification -->
    <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #e7f3ff; border: 1px solid #b3d9ff;">
      <h3>Backend Verification Test</h3>
      <p style="margin: 5px 0; color: #666; font-size: 14px;">
        Test direct WebSocket connection to backend (check browser console for logs)
      </p>
      <button @click="testBackendConnection" style="padding: 8px 16px; margin-top: 10px;">
        🧪 Test Backend WebSocket
      </button>
      <div v-if="backendTestStatus" style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 4px;">
        <strong>Status:</strong> {{ backendTestStatus }}
      </div>
    </div>

    <!-- Controls -->
    <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button @click="connectNotifications" :disabled="isNotificationConnected" style="padding: 8px 16px;">
        Connect to Notifications
      </button>
      <button @click="disconnectNotifications" :disabled="!isNotificationConnected" style="padding: 8px 16px;">
        Disconnect Notifications
      </button>
      <button @click="clearMessages" style="padding: 8px 16px;">
        Clear Messages
      </button>
    </div>

    <!-- Realtime Notifications -->
    <div style="margin-bottom: 20px;">
      <h3>Real-time Messages ({{ receivedMessages.length }})</h3>
      <div v-if="receivedMessages.length === 0" style="padding: 20px; text-align: center; color: #666;">
        No messages received yet. Once connected, you'll see chat unread updates and other notifications here.
      </div>
      <div v-for="(message, index) in receivedMessages" :key="index" 
           style="margin-bottom: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f8f9fa;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: #2563eb;">{{ message.type }}</h4>
            <pre style="margin: 0; font-size: 12px; color: #666; white-space: pre-wrap; word-wrap: break-word;">{{ JSON.stringify(message.data, null, 2) }}</pre>
            <small style="color: #999; display: block; margin-top: 8px;">
              {{ formatTimestamp(message.timestamp) }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { websocketService } from '../services/websocketService'
import { useSimpleAuth } from '../composables/useSimpleAuth'

// Authentication state
const { isAuthenticated, user } = useSimpleAuth()

// Backend test status
const backendTestStatus = ref<string>('')

// Received messages
const receivedMessages = ref<Array<{ type: string; data: any; timestamp: Date }>>([])

// Connection state
const isNotificationConnected = computed(() => websocketService.isNotificationWsConnected())

// Methods
const connectNotifications = async () => {
  try {
    await websocketService.connectToNotifications()
  } catch (error) {
    console.error('Failed to connect:', error)
  }
}

const disconnectNotifications = () => {
  websocketService.disconnectFromNotifications()
}

const clearMessages = () => {
  receivedMessages.value = []
}

const testBackendConnection = () => {
  backendTestStatus.value = '🔄 Testing connection... Check browser console'
  
  // Get JWT token
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    backendTestStatus.value = '❌ No authentication token found'
    console.error('❌ Cannot test: No authentication token available')
    return
  }
  
  // Verify Backend is Working
  // Open browser console on frontend
  const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`)

  ws.onopen = () => {
    console.log('✅ Connected')
    backendTestStatus.value = '✅ Connected - Check console for details'
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('📨 Received:', data)
    backendTestStatus.value = `📨 Receiving messages - Check console`
  }

  ws.onerror = (error) => {
    console.error('❌ WebSocket Error:', error)
    backendTestStatus.value = '❌ Connection error - Check console'
  }

  ws.onclose = (event) => {
    console.log('🔌 Connection closed:', event.code, event.reason)
    backendTestStatus.value = `🔌 Connection closed (${event.code})`
  }

  // Close connection after 10 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close()
      console.log('🛑 Test connection closed after 10 seconds')
    }
  }, 10000)
}

const formatTimestamp = (timestamp: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

  if (diffInSeconds < 1) {
    return 'Just now'
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return timestamp.toLocaleTimeString()
  }
}

// Setup event listeners
const handleChatUnreadUpdate = (data: any) => {
  receivedMessages.value.unshift({
    type: 'chat.unread.update',
    data,
    timestamp: new Date()
  })
}

const handleNotificationMessage = (data: any) => {
  receivedMessages.value.unshift({
    type: 'notification.message',
    data,
    timestamp: new Date()
  })
}

const handleConnectionSuccess = () => {
  receivedMessages.value.unshift({
    type: 'connection.success',
    data: { message: 'Connected to notification WebSocket' },
    timestamp: new Date()
  })
}

onMounted(() => {
  // Listen for events
  websocketService.on('chat.unread.update', handleChatUnreadUpdate)
  websocketService.on('notification.message', handleNotificationMessage)
  websocketService.on('notification.connected', handleConnectionSuccess)
})

onUnmounted(() => {
  // Cleanup listeners
  websocketService.off('chat.unread.update', handleChatUnreadUpdate)
  websocketService.off('notification.message', handleNotificationMessage)
  websocketService.off('notification.connected', handleConnectionSuccess)
})
</script>

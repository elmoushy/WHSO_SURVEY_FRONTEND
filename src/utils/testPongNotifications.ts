// Test utility for simulating WebSocket pong notifications
// This file is for development/testing purposes only

import { websocketService } from '../services/websocketService'
import { envConfig } from './envConfig'
import type { NotificationWebSocketData, PongMessageData } from '../services/websocketService'

// Only initialize if WebSocket is enabled
if (envConfig.websocketEnabled) {
  
  /**
   * Simulate a pong message with new notification trigger (matching the provided structure)
   * This is for testing purposes only - in production, pong messages come from the server
   */
  function simulatePongNotification(notificationData?: Partial<NotificationWebSocketData>) {
  // Create a mock notification
  const mockNotification: NotificationWebSocketData = {
    id: `ad7c8ebd-0172-4493-8924-e58054f4534a`,
    recipient: 1,
    title: { en: 'Test Pong Notification', ar: 'إشعار اختبار Pong' },
    body: { en: 'This notification was delivered via pong message', ar: 'تم تسليم هذا الإشعار عبر رسالة pong' },
    title_localized: 'Test Pong Notification',
    body_localized: 'This notification was delivered via pong message',
    notification_type: 'system_alert',
    priority: 'normal',
    is_read: false,
    created_at: new Date().toISOString(),
    ...notificationData
  }

  // Create the pong message data matching the provided structure
  const pongData: PongMessageData = {
    trigger: 'new_notification',
    notification_id: mockNotification.id,
    timestamp: new Date().toISOString(),
    notification: mockNotification // Include full notification for testing
  }

  // Simulate receiving the pong message using the test method
  websocketService.simulatePongMessage(pongData)

  return mockNotification
}

/**
 * Simulate a pong message with only notification_id (more realistic scenario)
 */
  function simulatePongNotificationIdOnly(notificationId?: string) {
  const pongData: PongMessageData = {
    trigger: 'new_notification',
    notification_id: notificationId || `notif_${Date.now()}`,
    timestamp: new Date().toISOString()
  }

  // Simulate receiving the pong message
  websocketService.simulatePongMessage(pongData)

  return pongData
}

/**
 * Simulate a regular pong message without notification
 */
  function simulateRegularPong() {
  const pongData: PongMessageData = {
    timestamp: new Date().toISOString()
  }

  // Simulate receiving the pong message
  websocketService.simulatePongMessage(pongData)

  }

  /**
   * Add these functions to the global window for easy testing in browser console
   */
  if (typeof window !== 'undefined') {
    (window as any).testPongNotifications = {
      simulatePongNotification,
      simulatePongNotificationIdOnly,
      simulateRegularPong
    }
    
    // Test functions available in browser console for development testing
  }

} // End of WebSocket enabled check

// Test utility for debugging pong notification event flow
import { websocketService } from '../services/websocketService'

declare global {
  interface Window {
    testPongNotificationFlow: () => void
    testDirectEventTrigger: () => void
    checkEventListeners: () => void
  }
}

// Test function to simulate a pong message with debug info
export const testPongNotificationFlow = () => {
  
  // Simulate what the WebSocket service would receive
  const mockPongMessage = {
    type: 'pong',
    trigger: 'new_notification',
    notification_id: 'test-notification-id',
    timestamp: new Date().toISOString()
  }
  
  // Call the private handlePongMessage method through the simulate method
  if (websocketService && typeof (websocketService as any).simulatePongMessage === 'function') {
    (websocketService as any).simulatePongMessage(mockPongMessage)
  } else {
    console.error('🧪 [TEST] simulatePongMessage method not available')
  }
}

// Test function to trigger the event directly
export const testDirectEventTrigger = () => {
  
  // Trigger the pong_notification event directly
  if (websocketService && typeof (websocketService as any).trigger === 'function') {
    (websocketService as any).trigger('pong_notification', {
      trigger: 'new_notification',
      notification_id: 'direct-test-id',
      timestamp: new Date().toISOString()
    })
  } else {
    console.error('🧪 [TEST] Direct event trigger not available')
  }
}

// Check what event listeners are registered
export const checkEventListeners = () => {
  
  if (websocketService && typeof (websocketService as any).eventListeners !== 'undefined') {
    const listeners = (websocketService as any).eventListeners
    
    listeners.forEach((_callbacks: any[], _event: string) => {
      // Event listener debugging information available in development
    })
  } else {
    console.error('🧪 [TEST] Cannot access event listeners')
  }
}

// Make functions available globally for easy testing in console
if (typeof window !== 'undefined') {
  window.testPongNotificationFlow = testPongNotificationFlow
  window.testDirectEventTrigger = testDirectEventTrigger
  window.checkEventListeners = checkEventListeners
}

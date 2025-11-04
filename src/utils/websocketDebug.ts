import { getAccessToken } from '../services/jwtAuthService'
import { useSimpleAuth } from '../composables/useSimpleAuth'
import { logger } from './logger'
import { envConfig } from './envConfig'

/**
 * Debug utility for WebSocket authentication issues
 * Uses secure logging that redacts sensitive information
 */
export class WebSocketDebugger {
  static checkAuthenticationState() {
    // Skip WebSocket debugging in production to reduce console noise
    if (envConfig.isProduction && !envConfig.debugMode) {
      return {
        isAuthenticated: false,
        hasUser: false,
        hasToken: false,
        tokenLength: 0
      }
    }

    const { isAuthenticated, user } = useSimpleAuth()
    const token = getAccessToken()
    
    if (!envConfig.isProduction || envConfig.debugMode) {
      console.group('🔍 WebSocket Authentication Debug')
      logger.log('🔐 Is Authenticated:', isAuthenticated.value)
      logger.log('👤 User:', user.value)
      logger.log('🎫 JWT Token Available:', !!token)
      logger.log('🎫 JWT Token Length:', token ? token.length : 0)
      logger.log('🎫 JWT Token Preview:', token ? `${token.substring(0, 20)}...` : 'None')
    }
    
    // Check if token looks valid (basic JWT format check)
    if (token && (!envConfig.isProduction || envConfig.debugMode)) {
      try {
        const parts = token.split('.')
        logger.log('🔍 JWT Parts Count:', parts.length)
        logger.log('✅ JWT Format Valid:', parts.length === 3)
        
        // Try to decode payload (without verification)
        const payload = JSON.parse(atob(parts[1]))
        logger.log('📋 JWT Payload:', payload)
        logger.log('⏰ JWT Expires At:', payload.exp ? new Date(payload.exp * 1000) : 'No expiration')
        logger.log('⏰ JWT Is Expired:', payload.exp ? Date.now() > payload.exp * 1000 : 'Cannot determine')
      } catch (error) {
        logger.error('❌ JWT Decode Error:', error)
      }
    }
    
    if (!envConfig.isProduction || envConfig.debugMode) {
      console.groupEnd()
    }
    
    return {
      isAuthenticated: isAuthenticated.value,
      hasUser: !!user.value,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    }
  }
  
  static logWebSocketAttempt() {
    // Skip WebSocket debugging in production to reduce console noise
    if (envConfig.isProduction && !envConfig.debugMode) {
      return false
    }

    const auth = this.checkAuthenticationState()
    
    if (!auth.isAuthenticated) {
      logger.warn('🚫 WebSocket Connection Blocked: User not authenticated')
      return false
    }
    
    if (!auth.hasToken) {
      logger.warn('🚫 WebSocket Connection Blocked: No JWT token available')
      return false
    }

    logger.debug('✅ WebSocket Connection Ready: All authentication checks passed')
    return true
  }
}

// Export for use in components
export const debugWebSocket = WebSocketDebugger

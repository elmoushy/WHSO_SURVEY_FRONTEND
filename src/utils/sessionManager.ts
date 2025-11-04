// Session management utilities with security enhancements
// Implements secure session handling, timeout management, and cookie security

import { logger } from './logger'

// Session configuration from environment
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 30 // 30 minutes default
const IDLE_WARNING_TIME = parseInt(import.meta.env.VITE_IDLE_WARNING_MINUTES) || 25 // 5 minutes before timeout
const SESSION_CHECK_INTERVAL = 60000 // Check every minute
const ACTIVITY_THROTTLE = 5000 // Throttle activity updates to every 5 seconds

interface SessionState {
  lastActivity: number
  warningShown: boolean
  isActive: boolean
  timeoutId?: number
  intervalId?: number
}

class SessionManager {
  private state: SessionState = {
    lastActivity: Date.now(),
    warningShown: false,
    isActive: false
  }
  
  private activityThrottle: number = 0
  private onTimeoutCallback?: () => void
  private onWarningCallback?: (remainingTime: number) => void

  /**
   * Initialize session management
   */
  initialize(callbacks: {
    onTimeout?: () => void
    onWarning?: (remainingTime: number) => void
  } = {}): void {
    this.onTimeoutCallback = callbacks.onTimeout
    this.onWarningCallback = callbacks.onWarning
    
    this.updateActivity()
    this.startSessionMonitoring()
    this.setupActivityListeners()
    
    logger.log('Session manager initialized with', SESSION_TIMEOUT, 'minute timeout')
  }

  /**
   * Start the session
   */
  startSession(): void {
    this.state.isActive = true
    this.state.lastActivity = Date.now()
    this.state.warningShown = false
    
    logger.log('Session started')
  }

  /**
   * End the session
   */
  endSession(): void {
    this.state.isActive = false
    this.state.warningShown = false
    
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId)
    }
    
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
    
    logger.log('Session ended')
  }

  /**
   * Update activity timestamp
   */
  updateActivity(): void {
    const now = Date.now()
    
    // Throttle activity updates
    if (now - this.activityThrottle < ACTIVITY_THROTTLE) {
      return
    }
    
    this.activityThrottle = now
    this.state.lastActivity = now
    this.state.warningShown = false
    
    logger.debug('Activity updated')
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    if (!this.state.isActive) return false
    
    const timeElapsed = Date.now() - this.state.lastActivity
    const timeoutMs = SESSION_TIMEOUT * 60 * 1000
    
    return timeElapsed > timeoutMs
  }

  /**
   * Get remaining session time in minutes
   */
  getRemainingTime(): number {
    if (!this.state.isActive) return 0
    
    const timeElapsed = Date.now() - this.state.lastActivity
    const timeoutMs = SESSION_TIMEOUT * 60 * 1000
    const remainingMs = timeoutMs - timeElapsed
    
    return Math.max(0, Math.floor(remainingMs / (60 * 1000)))
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.state.isActive) {
          this.updateActivity()
        }
      }, { passive: true })
    })
  }

  /**
   * Start monitoring session timeout
   */
  private startSessionMonitoring(): void {
    this.state.intervalId = window.setInterval(() => {
      if (!this.state.isActive) return
      
      const timeElapsed = Date.now() - this.state.lastActivity
      const warningTimeMs = IDLE_WARNING_TIME * 60 * 1000
      const timeoutMs = SESSION_TIMEOUT * 60 * 1000
      
      // Show warning
      if (timeElapsed >= warningTimeMs && !this.state.warningShown) {
        this.state.warningShown = true
        const remainingTime = Math.max(0, Math.floor((timeoutMs - timeElapsed) / (60 * 1000)))
        
        if (this.onWarningCallback) {
          this.onWarningCallback(remainingTime)
        }
        
        logger.warn('Session timeout warning:', remainingTime, 'minutes remaining')
      }
      
      // Check for timeout
      if (timeElapsed >= timeoutMs) {
        this.handleTimeout()
      }
    }, SESSION_CHECK_INTERVAL)
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    logger.warn('Session timeout occurred')
    
    this.endSession()
    
    if (this.onTimeoutCallback) {
      this.onTimeoutCallback()
    }
  }
}

// Cookie utilities with security enhancements
export class SecureCookies {
  /**
   * Set a secure cookie with proper attributes
   */
  static set(name: string, value: string, options: {
    expires?: number // Days
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    domain?: string
    path?: string
  } = {}): void {
    const defaults = {
      secure: window.location.protocol === 'https:',
      sameSite: 'strict' as const,
      path: '/',
      httpOnly: false // Note: JavaScript can't set httpOnly cookies
    }
    
    const opts = { ...defaults, ...options }
    
    let cookieString = `${name}=${encodeURIComponent(value)}`
    
    if (opts.expires) {
      const expiryDate = new Date()
      expiryDate.setTime(expiryDate.getTime() + (opts.expires * 24 * 60 * 60 * 1000))
      cookieString += `; expires=${expiryDate.toUTCString()}`
    }
    
    if (opts.path) {
      cookieString += `; path=${opts.path}`
    }
    
    if (opts.domain) {
      cookieString += `; domain=${opts.domain}`
    }
    
    if (opts.secure) {
      cookieString += `; secure`
    }
    
    if (opts.sameSite) {
      cookieString += `; samesite=${opts.sameSite}`
    }
    
    // Note: We can't set httpOnly from JavaScript
    // This should be done server-side for sensitive cookies
    
    document.cookie = cookieString
    
    logger.debug('Secure cookie set:', name)
  }

  /**
   * Get cookie value
   */
  static get(name: string): string | null {
    const cookies = document.cookie.split(';')
    
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=')
      if (cookieName === name) {
        return decodeURIComponent(cookieValue)
      }
    }
    
    return null
  }

  /**
   * Delete a cookie
   */
  static delete(name: string, options: {
    domain?: string
    path?: string
  } = {}): void {
    const opts = {
      path: '/',
      ...options
    }
    
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`
    
    if (opts.path) {
      cookieString += `; path=${opts.path}`
    }
    
    if (opts.domain) {
      cookieString += `; domain=${opts.domain}`
    }
    
    document.cookie = cookieString
    
    logger.debug('Cookie deleted:', name)
  }

  /**
   * Clear all cookies (that JavaScript can access)
   */
  static clearAll(): void {
    const cookies = document.cookie.split(';')
    
    cookies.forEach(cookie => {
      const [name] = cookie.trim().split('=')
      if (name) {
        this.delete(name)
      }
    })
    
    logger.debug('All accessible cookies cleared')
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()

// Session timeout hook for Vue components
export function useSessionTimeout() {
  const startSession = () => sessionManager.startSession()
  const endSession = () => sessionManager.endSession()
  const updateActivity = () => sessionManager.updateActivity()
  const isExpired = () => sessionManager.isSessionExpired()
  const remainingTime = () => sessionManager.getRemainingTime()
  
  return {
    startSession,
    endSession,
    updateActivity,
    isExpired,
    remainingTime
  }
}

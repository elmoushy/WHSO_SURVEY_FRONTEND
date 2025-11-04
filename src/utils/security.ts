// Security utility functions and constants
import type { SecurityError, RateLimitResponse } from '../types/auth.types'

export const SECURITY_MESSAGES = {
  HTML_DETECTED: "For security reasons, HTML tags have been removed from your input.",
  RATE_LIMITED: "Too many failed login attempts. Please wait before trying again.",
  INPUT_SANITIZED: "Some characters were removed from your input for security reasons.",
  ACCOUNT_LOCKED: "Account temporarily locked due to multiple failed attempts.",
  INVALID_CHARS_EMAIL: "Invalid characters detected in email address",
  INVALID_CHARS_FIELD: "Invalid characters detected in {field}",
  XSS_ATTEMPT: "Potentially unsafe characters detected and removed",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  MAX_LENGTH_EXCEEDED: "Input exceeds maximum allowed length of {max} characters"
} as const

export const DANGEROUS_PATTERNS = {
  // Basic XSS patterns
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  JAVASCRIPT_URLS: /javascript:/gi,
  DATA_URLS: /data:/gi,
  VBSCRIPT_URLS: /vbscript:/gi,
  
  // Event handlers
  EVENT_HANDLERS: /on\w+\s*=/gi,
  
  // Comprehensive dangerous pattern
  DANGEROUS_CHARS: /<|>|script|javascript:|data:|onerror=|onload=|vbscript:|expression\(|eval\(|\${/i
} as const

export const RATE_LIMIT_CONFIG = {
  WARNING_THRESHOLD: 3, // Show warning when attempts remaining <= 3
  MAX_ATTEMPTS: 5,
  LOCKOUT_MESSAGE_MIN_DISPLAY: 2000 // Minimum time to display lockout message (ms)
} as const

export const INPUT_LIMITS = {
  EMAIL: 254,
  PASSWORD: 128,
  FIRST_NAME: 50,
  LAST_NAME: 50,
  TITLE: 255,
  DESCRIPTION: 1000,
  QUESTION: 500,
  OPTION: 200
} as const

/**
 * Sanitize user input by removing potentially dangerous characters
 */
export const sanitizeInput = (value: string): { sanitized: string; wasSanitized: boolean } => {
  if (!value) return { sanitized: '', wasSanitized: false }
  
  const original = value
  let sanitized = value
  
  // Remove HTML tags
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.HTML_TAGS, '')
  
  // Remove script tags (case insensitive)
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.SCRIPT_TAGS, '')
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.JAVASCRIPT_URLS, '')
  
  // Remove data: URLs
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.DATA_URLS, '')
  
  // Remove vbscript: URLs  
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.VBSCRIPT_URLS, '')
  
  // Remove event handlers
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.EVENT_HANDLERS, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  return {
    sanitized,
    wasSanitized: original !== sanitized
  }
}

/**
 * Check if input contains potentially dangerous characters
 */
export const hasDangerousCharacters = (value: string): boolean => {
  if (!value) return false
  return DANGEROUS_PATTERNS.DANGEROUS_CHARS.test(value)
}

/**
 * Validate input length against limits
 */
export const validateInputLength = (value: string, field: keyof typeof INPUT_LIMITS): { valid: boolean; error?: string } => {
  const maxLength = INPUT_LIMITS[field]
  if (!maxLength) return { valid: true }
  
  if (value.length > maxLength) {
    return {
      valid: false,
      error: SECURITY_MESSAGES.MAX_LENGTH_EXCEEDED.replace('{max}', maxLength.toString())
    }
  }
  
  return { valid: true }
}

/**
 * Handle security errors from API responses
 */
export const handleSecurityError = (error: any): SecurityError | null => {
  if (!error.response) return null
  
  const status = error.response.status
  const data = error.response.data
  
  if (status === 429) {
    // Rate limit exceeded
    return {
      type: 'rate_limit',
      message: SECURITY_MESSAGES.RATE_LIMITED,
      details: {
        retry_after: data.retry_after_seconds,
        remaining_attempts: 0
      }
    }
  }
  
  if (status === 400 && data.errors) {
    // Validation/sanitization errors
    return {
      type: 'validation',
      message: 'Input validation failed',
      details: {
        field_errors: data.errors
      }
    }
  }
  
  if (status === 401) {
    // Authentication error
    return {
      type: 'authentication',
      message: data.detail || 'Authentication failed'
    }
  }
  
  return null
}

/**
 * Create user-friendly security messages
 */
export const getSecurityMessage = (type: SecurityError['type'], details?: SecurityError['details']): string => {
  switch (type) {
    case 'rate_limit':
      if (details?.retry_after) {
        const minutes = Math.ceil(details.retry_after / 60)
        return `${SECURITY_MESSAGES.ACCOUNT_LOCKED} Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
      }
      return SECURITY_MESSAGES.RATE_LIMITED
      
    case 'validation':
      return 'Please correct the highlighted fields and try again.'
      
    case 'sanitization':
      return SECURITY_MESSAGES.INPUT_SANITIZED
      
    case 'authentication':
      return 'Invalid email or password. Please try again.'
      
    default:
      return 'A security error occurred. Please try again.'
  }
}

/**
 * Format countdown time for display
 */
export const formatCountdownTime = (seconds: number): string => {
  if (seconds <= 0) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Check if user should see rate limit warning
 */
export const shouldShowRateLimitWarning = (remainingAttempts: number): boolean => {
  return remainingAttempts > 0 && remainingAttempts <= RATE_LIMIT_CONFIG.WARNING_THRESHOLD
}

/**
 * Get lockout time from rate limit response
 */
export const getLockoutTime = (response: RateLimitResponse): number => {
  return response.retry_after_seconds || 0
}

/**
 * Store lockout time in localStorage with expiration
 */
export const storeLockoutTime = (retryAfterSeconds: number): void => {
  try {
    const lockoutUntil = Date.now() + (retryAfterSeconds * 1000)
    localStorage.setItem('lockout_until', lockoutUntil.toString())
  } catch (error) {
    console.warn('Failed to store lockout time:', error)
  }
}

/**
 * Get remaining lockout time from localStorage
 */
export const getRemainingLockoutTime = (): number => {
  try {
    const lockoutUntil = localStorage.getItem('lockout_until')
    if (!lockoutUntil) return 0
    
    const remaining = parseInt(lockoutUntil) - Date.now()
    if (remaining <= 0) {
      localStorage.removeItem('lockout_until')
      return 0
    }
    
    return Math.ceil(remaining / 1000)
  } catch (error) {
    console.warn('Failed to get lockout time:', error)
    return 0
  }
}

/**
 * Clear stored lockout time
 */
export const clearLockoutTime = (): void => {
  try {
    localStorage.removeItem('lockout_until')
  } catch (error) {
    console.warn('Failed to clear lockout time:', error)
  }
}

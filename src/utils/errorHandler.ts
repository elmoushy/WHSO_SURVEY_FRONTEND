// Secure error handling utility
// Sanitizes error messages to prevent information disclosure

const isDevelopment = import.meta.env.MODE === 'development'
const isTest = import.meta.env.MODE === 'test'

// Sensitive information patterns to redact
const sensitivePatterns = [
  /jwt/i,
  /token/i,
  /bearer/i,
  /authorization/i,
  /password/i,
  /secret/i,
  /key/i,
  /credential/i,
  /api[_-]?key/i,
  /session[_-]?id/i,
  /csrf/i
]

/**
 * Sanitizes error messages to remove sensitive information
 */
function sanitizeErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'
  
  let message = ''
  
  // Extract basic error information
  if (typeof error === 'string') {
    message = error
  } else if (error.message) {
    message = error.message
  } else if (error.error) {
    message = typeof error.error === 'string' ? error.error : 'Request failed'
  } else {
    message = 'An error occurred'
  }
  
  // In production, remove sensitive patterns
  if (!isDevelopment && !isTest) {
    sensitivePatterns.forEach(pattern => {
      message = message.replace(pattern, '[REDACTED]')
    })
    
    // Remove potential URLs, paths, or technical details
    message = message.replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]')
    message = message.replace(/\/[^\s]*\.(js|ts|vue|json)[^\s]*/g, '[REDACTED_PATH]')
    
    // Generic error messages for common cases
    if (message.toLowerCase().includes('network error') || 
        message.toLowerCase().includes('fetch failed') ||
        message.toLowerCase().includes('failed to fetch')) {
      return 'Network connection error. Please check your internet connection and try again.'
    }
    
    if (message.toLowerCase().includes('unauthorized') || 
        message.toLowerCase().includes('401')) {
      return 'Authentication failed. Please log in again.'
    }
    
    if (message.toLowerCase().includes('forbidden') || 
        message.toLowerCase().includes('403')) {
      return 'Access denied. You do not have permission to perform this action.'
    }
    
    if (message.toLowerCase().includes('not found') || 
        message.toLowerCase().includes('404')) {
      return 'The requested resource was not found.'
    }
    
    if (message.toLowerCase().includes('server error') || 
        message.toLowerCase().includes('500')) {
      return 'A server error occurred. Please try again later.'
    }
  }
  
  return message
}

/**
 * Sanitizes stack traces to remove internal system details in production
 */
function sanitizeStackTrace(error: any): string | undefined {
  if (!isDevelopment || !error?.stack) return undefined
  
  // Only show stack traces in development
  return error.stack
}

/**
 * Safe error object for user display and logging
 */
export interface SafeError {
  message: string
  code?: string | number
  type?: string
  stack?: string
  timestamp: string
}

/**
 * Creates a safe error object from any error input
 */
export function createSafeError(error: any, context?: string): SafeError {
  const sanitizedMessage = sanitizeErrorMessage(error)
  const stack = sanitizeStackTrace(error)
  
  const safeError: SafeError = {
    message: context ? `${context}: ${sanitizedMessage}` : sanitizedMessage,
    timestamp: new Date().toISOString()
  }
  
  // Add additional context only in development
  if (isDevelopment || isTest) {
    if (error?.code) safeError.code = error.code
    if (error?.name) safeError.type = error.name
    if (stack) safeError.stack = stack
  }
  
  return safeError
}

/**
 * Handles API response errors safely
 */
export function handleApiError(error: any): SafeError {
  let message = 'An error occurred while processing your request'
  let code: string | number | undefined
  
  if (error?.response) {
    // Server responded with error status
    const status = error.response.status
    code = status
    
    switch (status) {
      case 400:
        message = 'Invalid request. Please check your input and try again.'
        break
      case 401:
        message = 'Authentication required. Please log in again.'
        break
      case 403:
        message = 'Access denied. You do not have permission for this action.'
        break
      case 404:
        message = 'The requested resource was not found.'
        break
      case 409:
        message = 'Conflict. The resource already exists or is in use.'
        break
      case 422:
        message = 'Invalid data provided. Please check your input.'
        break
      case 429:
        message = 'Too many requests. Please wait a moment and try again.'
        break
      case 500:
        message = 'Server error. Please try again later.'
        break
      case 502:
      case 503:
      case 504:
        message = 'Service temporarily unavailable. Please try again later.'
        break
      default:
        message = `Request failed (${status}). Please try again.`
    }
    
    // In development, include more details from response
    if (isDevelopment && error.response.data?.message) {
      message += ` Details: ${error.response.data.message}`
    }
  } else if (error?.request) {
    // Request made but no response received
    message = 'Network error. Please check your connection and try again.'
  } else {
    // Something else happened
    message = sanitizeErrorMessage(error)
  }
  
  return createSafeError({ message, code }, 'API Error')
}

/**
 * Generic user-friendly error handler
 */
export function handleGenericError(error: any, context?: string): SafeError {
  return createSafeError(error, context)
}

/**
 * Logs errors safely without exposing sensitive information
 */
export function logError(error: any, context?: string): void {
  const safeError = createSafeError(error, context)
  
  if (isDevelopment || isTest) {
    console.error('🚨 Error:', safeError)
    if (safeError.stack) {
      console.error('Stack:', safeError.stack)
    }
  } else {
    // In production, log minimal information
    console.error(`Error [${safeError.timestamp}]: ${safeError.message}`)
  }
}

// Security-aware logging utility
// Removes sensitive information from logs and disables console logs in production

const isDevelopment = import.meta.env.MODE === 'development'
const isTest = import.meta.env.MODE === 'test'

// Sensitive patterns to redact
const sensitivePatterns = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /bearer/i,
  /authorization/i,
  /credential/i,
  /jwt/i
]

// Function to redact sensitive information
function redactSensitiveInfo(message: any): any {
  if (typeof message === 'string') {
    // Redact potential JWT tokens (3 parts separated by dots)
    message = message.replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, '[REDACTED_JWT]')
    
    // Redact other sensitive patterns
    sensitivePatterns.forEach(pattern => {
      message = message.replace(new RegExp(`(${pattern.source})\\s*[:=]\\s*[^\\s\\n,}]+`, 'gi'), '$1: [REDACTED]')
    })
  }
  
  return message
}

// Safe logging functions that work in development but are disabled in production
export const logger = {
  log: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment || isTest) {
      const safeMessage = redactSensitiveInfo(message)
      const safeParams = optionalParams.map(param => redactSensitiveInfo(param))
      console.log(safeMessage, ...safeParams)
    }
  },
  
  warn: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment || isTest) {
      const safeMessage = redactSensitiveInfo(message)
      const safeParams = optionalParams.map(param => redactSensitiveInfo(param))
      console.warn(safeMessage, ...safeParams)
    }
  },
  
  error: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment || isTest) {
      const safeMessage = redactSensitiveInfo(message)
      const safeParams = optionalParams.map(param => redactSensitiveInfo(param))
      console.error(safeMessage, ...safeParams)
    }
  },
  
  debug: (message?: any, ...optionalParams: any[]) => {
    if (isDevelopment) {
      const safeMessage = redactSensitiveInfo(message)
      const safeParams = optionalParams.map(param => redactSensitiveInfo(param))
      console.debug(safeMessage, ...safeParams)
    }
  },
  
  // For critical errors that should always be logged (but still redacted)
  criticalError: (message?: any, ...optionalParams: any[]) => {
    const safeMessage = redactSensitiveInfo(message)
    const safeParams = optionalParams.map(param => redactSensitiveInfo(param))
    console.error('[CRITICAL]', safeMessage, ...safeParams)
  }
}

// Export individual functions for easier migration
export const { log, warn, error, debug, criticalError } = logger

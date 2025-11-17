// Environment configuration with security validations
// Ensures proper environment variable handling and validates security settings

import { logger } from './logger'

// Environment validation
const ENV_MODE = import.meta.env.MODE
const IS_DEVELOPMENT = ENV_MODE === 'development'
const IS_PRODUCTION = ENV_MODE === 'production'
const IS_TEST = ENV_MODE === 'test'

interface EnvironmentConfig {
  // API Configuration
  apiBaseUrl: string
  frontendBaseUrl: string
  wsBaseUrl: string
  
  // Security Settings
  maxLoginAttempts: number
  showSecurityWarnings: boolean
  clientSideValidation: boolean
  sessionTimeout: number
  
  // Feature Flags
  environment: string
  debugMode: boolean
  websocketEnabled: boolean
  
  // Input Validation Limits
  inputMaxLengths: {
    title: number
    description: number
    question: number
    option: number
  }
}

class EnvironmentManager {
  private config: EnvironmentConfig
  private validated: boolean = false

  constructor() {
    this.config = this.loadConfiguration()
    this.validateConfiguration()
  }

  private loadConfiguration(): EnvironmentConfig {
    // Check if WebSocket is enabled first
    const websocketEnabled = import.meta.env.VITE_WEBSOCKET_ENABLED === 'true'
    
    // Load environment variables with secure defaults
    const config: EnvironmentConfig = {
      // API Configuration - NO fallbacks in production
      apiBaseUrl: this.getRequiredEnvVar('VITE_API_BASE_URL', !IS_PRODUCTION ? 'http://127.0.0.1:8000/api/' : ''),
      frontendBaseUrl: this.getRequiredEnvVar('VITE_FRONTEND_BASE_URL', !IS_PRODUCTION ? 'http://localhost:5173' : ''),
      wsBaseUrl: websocketEnabled ? this.getRequiredEnvVar('VITE_WS_URL', !IS_PRODUCTION ? 'ws://127.0.0.1:8000' : '') : '',
      
      // Security Settings
      maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '3'),
      showSecurityWarnings: import.meta.env.VITE_SHOW_SECURITY_WARNINGS === 'true',
      clientSideValidation: import.meta.env.VITE_CLIENT_SIDE_VALIDATION !== 'false',
      sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || '30'),
      
      // Environment
      environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      websocketEnabled: import.meta.env.VITE_WEBSOCKET_ENABLED === 'true',
      
      // Input Validation
      inputMaxLengths: this.parseInputLimits(import.meta.env.VITE_INPUT_MAX_LENGTHS)
    }

    return config
  }

  private getRequiredEnvVar(key: string, fallback: string): string {
    const value = import.meta.env[key]
    
    if (!value && IS_PRODUCTION && !fallback) {
      const error = `Critical: Required environment variable ${key} is not set in production`
      logger.criticalError(error)
      throw new Error(error)
    }
    
    if (!value && fallback && !IS_PRODUCTION) {
      logger.warn(`Environment variable ${key} not set, using fallback: ${fallback}`)
    }
    
    return value || fallback
  }

  private parseInputLimits(limitString: string | undefined): EnvironmentConfig['inputMaxLengths'] {
    const defaults = {
      title: 255,
      description: 1000,
      question: 500,
      option: 200
    }
    
    if (!limitString) return defaults
    
    try {
      const parsed = JSON.parse(limitString)
      return {
        title: parseInt(parsed.title || defaults.title),
        description: parseInt(parsed.description || defaults.description),
        question: parseInt(parsed.question || defaults.question),
        option: parseInt(parsed.option || defaults.option)
      }
    } catch (error) {
      logger.warn('Failed to parse VITE_INPUT_MAX_LENGTHS, using defaults:', error)
      return defaults
    }
  }

  private validateConfiguration(): void {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate API URLs
    if (!this.isValidUrl(this.config.apiBaseUrl)) {
      errors.push(`Invalid API base URL: ${this.config.apiBaseUrl}`)
    }

    if (!this.isValidUrl(this.config.frontendBaseUrl)) {
      errors.push(`Invalid frontend base URL: ${this.config.frontendBaseUrl}`)
    }

    // Security validations for production
    if (IS_PRODUCTION) {
      // Ensure HTTPS in production
      if (!this.config.apiBaseUrl.startsWith('https://')) {
        errors.push('API base URL must use HTTPS in production')
      }

      if (!this.config.frontendBaseUrl.startsWith('https://')) {
        errors.push('Frontend base URL must use HTTPS in production')
      }

      // Only validate WebSocket URL if WebSocket is enabled
      if (this.config.websocketEnabled && this.config.wsBaseUrl && !this.config.wsBaseUrl.startsWith('wss://')) {
        errors.push('WebSocket URL must use WSS (secure WebSocket) in production')
      }

      // Check for localhost/development URLs in production
      const developmentHosts = ['localhost', '127.0.0.1', '0.0.0.0']
      developmentHosts.forEach(host => {
        if (this.config.apiBaseUrl.includes(host)) {
          errors.push(`Production API URL should not contain development host: ${host}`)
        }
        if (this.config.frontendBaseUrl.includes(host)) {
          errors.push(`Production frontend URL should not contain development host: ${host}`)
        }
      })
    }

    // Validate security settings
    if (this.config.maxLoginAttempts < 3 || this.config.maxLoginAttempts > 10) {
      warnings.push(`Max login attempts (${this.config.maxLoginAttempts}) should be between 3-10`)
    }

    if (this.config.sessionTimeout < 15 || this.config.sessionTimeout > 120) {
      warnings.push(`Session timeout (${this.config.sessionTimeout} minutes) should be between 15-120 minutes`)
    }

    // Validate input limits
    const limits = this.config.inputMaxLengths
    if (limits.title > 500 || limits.description > 2000 || 
        limits.question > 1000 || limits.option > 500) {
      warnings.push('Input length limits may be too high for security')
    }

    // Log results
    if (errors.length > 0) {
      errors.forEach(error => logger.criticalError('Environment validation error:', error))
      throw new Error('Environment configuration validation failed')
    }

    if (warnings.length > 0) {
      warnings.forEach(warning => logger.warn('Environment validation warning:', warning))
    }

    this.validated = true
    logger.log('Environment configuration validated successfully')
  }

  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString)
      return true
    } catch {
      return false
    }
  }

  // Public getters
  get apiBaseUrl(): string {
    return this.config.apiBaseUrl
  }

  get frontendBaseUrl(): string {
    return this.config.frontendBaseUrl
  }

  get wsBaseUrl(): string {
    return this.config.wsBaseUrl
  }

  get maxLoginAttempts(): number {
    return this.config.maxLoginAttempts
  }

  get showSecurityWarnings(): boolean {
    return this.config.showSecurityWarnings
  }

  get clientSideValidation(): boolean {
    return this.config.clientSideValidation
  }

  get sessionTimeout(): number {
    return this.config.sessionTimeout
  }

  get environment(): string {
    return this.config.environment
  }

  get websocketEnabled(): boolean {
    return this.config.websocketEnabled
  }

  get debugMode(): boolean {
    return this.config.debugMode
  }

  get inputMaxLengths(): EnvironmentConfig['inputMaxLengths'] {
    return this.config.inputMaxLengths
  }

  get isDevelopment(): boolean {
    return IS_DEVELOPMENT
  }

  get isProduction(): boolean {
    return IS_PRODUCTION
  }

  get isTest(): boolean {
    return IS_TEST
  }

  get isValidated(): boolean {
    return this.validated
  }

  // Get the full configuration (for debugging)
  getConfig(): EnvironmentConfig {
    return { ...this.config }
  }

  // Security check methods
  isSecureContext(): boolean {
    return window.isSecureContext || (!IS_PRODUCTION && !this.config.showSecurityWarnings)
  }

  requiresHttps(): boolean {
    return IS_PRODUCTION
  }

  shouldShowSecurityWarnings(): boolean {
    return this.config.showSecurityWarnings && !IS_PRODUCTION
  }
}

// Export singleton instance
export const envConfig = new EnvironmentManager()

// Convenience exports
export const {
  apiBaseUrl,
  frontendBaseUrl,
  wsBaseUrl,
  maxLoginAttempts,
  showSecurityWarnings,
  clientSideValidation,
  sessionTimeout,
  environment,
  debugMode,
  inputMaxLengths,
  isDevelopment,
  isProduction,
  isTest
} = envConfig

// Runtime environment checks
export function checkSecurityContext(): void {
  if (!envConfig.isSecureContext() && envConfig.requiresHttps()) {
    logger.criticalError('Application must be served over HTTPS in production')
    throw new Error('Insecure context detected in production environment')
  }
  
  if (envConfig.shouldShowSecurityWarnings() && !envConfig.isSecureContext()) {
    logger.warn('Warning: Application is not running in a secure context (HTTPS)')
  }
}

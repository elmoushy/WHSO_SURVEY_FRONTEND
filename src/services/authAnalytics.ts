// Performance monitoring and analytics for authentication flows

export interface AuthMetrics {
  event: string
  timestamp: number
  duration?: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

export interface AuthPerformanceData {
  initializationTime: number
  loginTime: number
  backendSyncTime: number
  tokenRefreshTime: number
  totalAuthTime: number
  errorCount: number
  retryCount: number
}

class AuthAnalytics {
  private metrics: AuthMetrics[] = []
  private timers: Map<string, number> = new Map()
  private performanceData: AuthPerformanceData = {
    initializationTime: 0,
    loginTime: 0,
    backendSyncTime: 0,
    tokenRefreshTime: 0,
    totalAuthTime: 0,
    errorCount: 0,
    retryCount: 0
  }

  // Start timing an operation
  startTimer(operation: string): void {
    this.timers.set(operation, performance.now())
  }

  // End timing and record metric
  endTimer(operation: string, success: boolean = true, error?: string, metadata?: Record<string, any>): void {
    const startTime = this.timers.get(operation)
    if (!startTime) return

    const duration = performance.now() - startTime
    this.timers.delete(operation)

    const metric: AuthMetrics = {
      event: operation,
      timestamp: Date.now(),
      duration,
      success,
      error,
      metadata
    }

    this.metrics.push(metric)
    this.updatePerformanceData(operation, duration, success)

    // Log to console in development
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      // Removed console.log for production - Release One
    }

    // Send to external analytics service
    this.sendToAnalytics(metric)
  }

  // Track event without timing
  trackEvent(event: string, success: boolean = true, error?: string, metadata?: Record<string, any>): void {
    const metric: AuthMetrics = {
      event,
      timestamp: Date.now(),
      success,
      error,
      metadata
    }

    this.metrics.push(metric)
    
    if (!success) {
      this.performanceData.errorCount++
    }

    if (event.includes('retry')) {
      this.performanceData.retryCount++
    }

    // Log to console in development
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      
    }

    this.sendToAnalytics(metric)
  }

  private updatePerformanceData(operation: string, duration: number, success: boolean): void {
    if (!success) {
      this.performanceData.errorCount++
      return
    }

    switch (operation) {
      case 'auth_initialization':
        this.performanceData.initializationTime = duration
        break
      case 'azure_login':
        this.performanceData.loginTime = duration
        break
      case 'backend_sync':
        this.performanceData.backendSyncTime = duration
        break
      case 'token_refresh':
        this.performanceData.tokenRefreshTime = duration
        break
      case 'total_auth_flow':
        this.performanceData.totalAuthTime = duration
        break
    }
  }

  private async sendToAnalytics(metric: AuthMetrics): Promise<void> {
    try {
      // Example: Send to external analytics service
      // await fetch('/api/analytics/auth', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric)
      // })

      // For now, just store locally or send to console
      if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
        await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        }).catch(() => {
          // Error handling removed for production
        })
      }
    } catch (error) {
      // Logging removed for production
    }
  }

  // Get performance summary
  getPerformanceSummary(): AuthPerformanceData & { averageLoginTime: number; successRate: number } {
    const totalMetrics = this.metrics.length
    const successfulMetrics = this.metrics.filter(m => m.success).length
    const loginMetrics = this.metrics.filter(m => m.event.includes('login') && m.duration)
    const averageLoginTime = loginMetrics.length > 0 
      ? loginMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / loginMetrics.length
      : 0

    return {
      ...this.performanceData,
      averageLoginTime,
      successRate: totalMetrics > 0 ? (successfulMetrics / totalMetrics) * 100 : 0
    }
  }

  // Get recent metrics
  getRecentMetrics(limit: number = 10): AuthMetrics[] {
    return this.metrics.slice(-limit)
  }

  // Clear metrics (useful for testing)
  clearMetrics(): void {
    this.metrics = []
    this.timers.clear()
    this.performanceData = {
      initializationTime: 0,
      loginTime: 0,
      backendSyncTime: 0,
      tokenRefreshTime: 0,
      totalAuthTime: 0,
      errorCount: 0,
      retryCount: 0
    }
  }

  // Generate performance report
  generateReport(): string {
    const summary = this.getPerformanceSummary()
    const recentMetrics = this.getRecentMetrics(5)

    return `
AUTH PERFORMANCE REPORT
=======================
Total Auth Time: ${summary.totalAuthTime.toFixed(2)}ms
Initialization: ${summary.initializationTime.toFixed(2)}ms
Azure Login: ${summary.loginTime.toFixed(2)}ms
Backend Sync: ${summary.backendSyncTime.toFixed(2)}ms
Average Login: ${summary.averageLoginTime.toFixed(2)}ms
Success Rate: ${summary.successRate.toFixed(1)}%
Errors: ${summary.errorCount}
Retries: ${summary.retryCount}

RECENT EVENTS:
${recentMetrics.map(m => 
  `${new Date(m.timestamp).toISOString()} - ${m.event} (${m.duration?.toFixed(2) || 'N/A'}ms) - ${m.success ? 'SUCCESS' : 'FAILED'}`
).join('\n')}
    `.trim()
  }
}

// Singleton instance
export const authAnalytics = new AuthAnalytics()

// Helper functions for common auth events
export const trackAuthFlow = {
  startInitialization: () => authAnalytics.startTimer('auth_initialization'),
  endInitialization: (success: boolean, error?: string) => 
    authAnalytics.endTimer('auth_initialization', success, error),

  startLogin: () => authAnalytics.startTimer('azure_login'),
  endLogin: (success: boolean, error?: string, metadata?: Record<string, any>) => 
    authAnalytics.endTimer('azure_login', success, error, metadata),

  startBackendSync: () => authAnalytics.startTimer('backend_sync'),
  endBackendSync: (success: boolean, error?: string) => 
    authAnalytics.endTimer('backend_sync', success, error),

  startTokenRefresh: () => authAnalytics.startTimer('token_refresh'),
  endTokenRefresh: (success: boolean, error?: string) => 
    authAnalytics.endTimer('token_refresh', success, error),

  startTotalFlow: () => authAnalytics.startTimer('total_auth_flow'),
  endTotalFlow: (success: boolean, error?: string) => 
    authAnalytics.endTimer('total_auth_flow', success, error),

  trackError: (error: string, context?: Record<string, any>) => 
    authAnalytics.trackEvent('auth_error', false, error, context),

  trackRetry: (reason?: string) => 
    authAnalytics.trackEvent('auth_retry', true, undefined, { reason }),

  trackLogout: (reason?: string) => 
    authAnalytics.trackEvent('auth_logout', true, undefined, { reason }),

  trackSessionTimeout: () => 
    authAnalytics.trackEvent('session_timeout', false, 'Session expired due to inactivity'),

  trackUserActivity: (activity: string) => 
    authAnalytics.trackEvent('user_activity', true, undefined, { activity })
}

// Performance monitoring utilities
export const performanceUtils = {
  // Measure Core Web Vitals during auth flows
  measureCoreWebVitals: () => {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      authAnalytics.trackEvent('core_web_vitals_lcp', true, undefined, {
        value: lastEntry.startTime,
        metric: 'LCP'
      })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        authAnalytics.trackEvent('core_web_vitals_fid', true, undefined, {
          value: entry.processingStart - entry.startTime,
          metric: 'FID'
        })
      })
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    let clsScore = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value
        }
      })
      authAnalytics.trackEvent('core_web_vitals_cls', true, undefined, {
        value: clsScore,
        metric: 'CLS'
      })
    }).observe({ entryTypes: ['layout-shift'] })
  },

  // Monitor memory usage during auth
  trackMemoryUsage: () => {
    if (typeof window === 'undefined' || !(performance as any).memory) return

    const memory = (performance as any).memory
    authAnalytics.trackEvent('memory_usage', true, undefined, {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    })
  },

  // Network timing for auth API calls
  trackNetworkTiming: (url: string, startTime: number, endTime: number, success: boolean) => {
    authAnalytics.trackEvent('network_timing', success, undefined, {
      url,
      duration: endTime - startTime,
      timestamp: startTime
    })
  }
}

// Error categorization
export const errorAnalyzer = {
  categorizeError: (error: string): string => {
    if (error.includes('network') || error.includes('fetch')) return 'network'
    if (error.includes('timeout')) return 'timeout'
    if (error.includes('authentication') || error.includes('401')) return 'authentication'
    if (error.includes('authorization') || error.includes('403')) return 'authorization'
    if (error.includes('token')) return 'token'
    if (error.includes('backend') || error.includes('server')) return 'backend'
    return 'unknown'
  },

  getErrorSuggestions: (errorCategory: string): string[] => {
    const suggestions: Record<string, string[]> = {
      network: [
        'Check your internet connection',
        'Try connecting to a different network',
        'Disable VPN if active'
      ],
      timeout: [
        'Try again in a few minutes',
        'Check if the service is experiencing high load',
        'Contact support if the issue persists'
      ],
      authentication: [
        'Sign out and sign in again',
        'Clear browser cache and cookies',
        'Try using an incognito/private window'
      ],
      token: [
        'Refresh the page',
        'Sign out and sign in again',
        'Clear stored authentication data'
      ],
      backend: [
        'The service may be temporarily unavailable',
        'Try again in a few minutes',
        'Contact support if the issue continues'
      ]
    }

    return suggestions[errorCategory] || [
      'Refresh the page',
      'Try again later',
      'Contact support if the problem persists'
    ]
  }
}

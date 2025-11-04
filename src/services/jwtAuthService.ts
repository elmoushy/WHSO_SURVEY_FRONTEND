import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import Swal from 'sweetalert2'
import { logger } from '../utils/logger'
import type { 
  HealthCheckResponse,
  UserProfileResponse,
  UserStatsResponse,
  LogoutResponse,
  UserUpdateRequest,
  AuthError,
  LoginResponse,
  TokenRefreshResponse
} from '../types/auth.types'

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Create axios instance for API calls
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // send/receive HttpOnly cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  }
})

// JWT Token Management (in-memory and session storage for refresh token)
let accessToken: string | null = null
let refreshToken: string | null = null
let refreshFailureCount = 0 // Track consecutive refresh failures
let lastRefreshAttempt = 0 // Timestamp of last refresh attempt
let refreshDisabled = false // Hard disable further silent refresh attempts until successful login
let sessionExpiredAlertShown = false // Prevent multiple session expired alerts
const MAX_REFRESH_FAILURES = 3 // Stop trying after 3 consecutive failures
const REFRESH_RETRY_DELAY = 60000 // Wait 1 minute between failed refresh attempts
const REFRESH_TOKEN_KEY = 'weaponpower_refresh_token'

// Initialize tokens from session storage on module load
const initializeTokensFromStorage = (): void => {
  try {
    const storedRefreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)
    if (storedRefreshToken) {
      refreshToken = storedRefreshToken
      // Don't set access token here - it should be refreshed
    }
  } catch (error) {
    logger.warn('Failed to load refresh token from session storage:', error)
  }
}

// Store refresh token in session storage
const storeRefreshToken = (token: string | null): void => {
  try {
    if (token) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
    } else {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  } catch (error) {
    logger.warn('Failed to store refresh token in session storage:', error)
  }
}

// Initialize tokens on module load
initializeTokensFromStorage()

// Track if we're currently in the middle of a refresh to avoid multiple concurrent attempts
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

// Set JWT tokens for API requests (access token only in memory)
export const setAuthTokens = (access: string | null, refresh: string | null = null): void => {
  accessToken = access
  if (refresh) {
    refreshToken = refresh
    storeRefreshToken(refresh) // Store in session storage for persistence
  }
  if (access) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`
    refreshFailureCount = 0 // Reset failure count on successful token set
    refreshDisabled = false // Re-enable refresh attempts
    sessionExpiredAlertShown = false // Reset alert flag for new session
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Attempt to silently obtain a new access token using refresh token
export const silentRefreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  // Allow a silent refresh attempt even if in‑memory tokens are empty.
  // This enables page reload persistence using the stored refresh token.
  if (refreshDisabled) return null

  // Don't attempt refresh if we've failed too many times recently
  if (refreshFailureCount >= MAX_REFRESH_FAILURES) return null

  // Don't attempt refresh if we don't have a refresh token
  if (!refreshToken) return null

  // Backoff window after a failure
  const now = Date.now()
  if (refreshFailureCount > 0 && (now - lastRefreshAttempt) < REFRESH_RETRY_DELAY) return null

  lastRefreshAttempt = now
  isRefreshing = true

  refreshPromise = (async (): Promise<string | null> => {
    try {
      const response = await apiClient.post<TokenRefreshResponse>("auth/token/refresh/", {
        refresh: refreshToken
      }, {
        validateStatus: (status) => status < 500, // treat 4xx as handled
      })
      if (response.status === 200 && response.data.access) {
        setAuthTokens(response.data.access, response.data.refresh || refreshToken)
        return response.data.access
      }
      
      // Handle 401 Unauthorized specifically - token is expired or invalid
      if (response.status === 401) {
        logger.warn('Refresh token expired or invalid, logging out user')
        clearTokens()
        await showSessionExpiredAlert()
        return null
      }
      
      // Non-200 (likely 400) – disable further attempts until explicit login
      refreshFailureCount++
      refreshDisabled = true
      if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
        clearTokens()
        await showSessionExpiredAlert()
      }
      return null
    } catch (error) {
      refreshFailureCount++
      refreshDisabled = true
      logger.warn('Silent token refresh failed:', error)
      if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
        clearTokens()
        await showSessionExpiredAlert()
      }
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Refresh access token using available method
const refreshAccessToken = async (): Promise<string | null> => {
  // Don't attempt refresh if we've failed too many times recently
  if (refreshFailureCount >= MAX_REFRESH_FAILURES || refreshDisabled) return null

  // Try silent refresh first (which now includes the refresh token in body)
  try {
    const token = await silentRefreshAccessToken()
    if (token) return token

    if (!refreshToken) return null
    
    // Legacy fallback (if backend still expects token in body)
    const response = await axios.post(`${API_BASE_URL}auth/token/refresh/`, { 
      refresh: refreshToken 
    }, { 
      withCredentials: true,
      // Suppress network errors from appearing in browser console
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    })
    if (response.status === 200 && response.data?.access) {
      setAuthTokens(response.data.access, response.data.refresh || refreshToken)
      return response.data.access
    }
    
    // Handle 401 Unauthorized specifically - token is expired or invalid
    if (response.status === 401) {
      console.warn('Refresh token expired or invalid, logging out user')
      clearTokens()
      await showSessionExpiredAlert()
      return null
    }
    
    // Handle non-200 responses
    refreshFailureCount++
    refreshDisabled = true
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
      clearTokens()
      await showSessionExpiredAlert()
      redirectToLogin()
    }
    return null
  } catch (error) {
    refreshFailureCount++
    refreshDisabled = true
    console.warn('Token refresh failed:', error)
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
      clearTokens()
      await showSessionExpiredAlert()
    }
    return null
  }
}

// Check if we're on a survey page or making a survey API call - surveys are public!
const isSurveyContext = (url?: string): boolean => {
  // Check current page URL - covers all survey patterns including public surveys
  const currentPath = window.location.pathname
  const isOnSurveyPage = currentPath.startsWith('/survey/') || 
                        currentPath.includes('/survey/public/') ||
                        currentPath.includes('/survey/password/') ||
                        currentPath.includes('/survey/auth/')
  
  // Check API request URL (if provided) - only for PUBLIC survey endpoints
  const isSurveyApiCall = url ? (
    url.includes('/survey/public/') ||
    url.includes('password-access') ||
    url.includes('public-link/') ||
    url.includes('/api/surveys/public/') ||
    url.includes('/api/surveys/password/') ||
    url.includes('/surveys/password-surveys/') ||
    url.includes('/surveys/public/')
  ) : false
  
  return isOnSurveyPage || isSurveyApiCall
}

// Clear all tokens (memory and storage)
const clearTokens = (): void => {
  // Clear JWT tokens and state
  setAuthTokens(null, null)
  accessToken = null
  refreshToken = null
  storeRefreshToken(null) // Clear from session storage
  refreshFailureCount = 0
  lastRefreshAttempt = 0
  refreshDisabled = false
  sessionExpiredAlertShown = false // Reset alert flag for future sessions
  
  // Clear user session data from sessionStorage (from useSimpleAuth)
  try {
    sessionStorage.removeItem('wpc_user')
    sessionStorage.removeItem('wpc_auth_status')
  } catch (error) {
    console.warn('Failed to clear user session data from sessionStorage:', error)
  }
  
  // Clear any other potential auth-related storage
  try {
    // Clear any other authentication keys that might exist
    const keysToRemove = [
      'weaponpower_refresh_token',
      'auth_token',
      'access_token', 
      'user_data',
      'auth_state'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
  } catch (error) {
    console.warn('Failed to clear additional auth storage:', error)
  }
  
  // Clear all cookies that might contain auth data
  try {
    // Get all cookies and clear any that might contain auth data
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      // Clear common auth-related cookie names
      if (name.includes('auth') || name.includes('token') || name.includes('session') || 
          name.includes('refresh') || name.includes('access') || name.includes('jwt') ||
          name.includes('csrf') || name.includes('weaponpower')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
      }
    })
  } catch (error) {
    console.warn('Failed to clear auth cookies:', error)
  }
}

// Show session expired alert with SweetAlert2
const showSessionExpiredAlert = async (): Promise<void> => {
  // Prevent multiple session expired alerts
  if (sessionExpiredAlertShown) {
    return
  }
  
  // CRITICAL: Don't show session expired alert on survey pages - surveys are public!
  if (isSurveyContext()) {
    return
  }
  
  // Additional safety check for public survey URLs
  const currentPath = window.location.pathname
  if (currentPath.includes('/survey/public/') || 
      currentPath.includes('/survey/password/') ||
      currentPath.includes('/survey/auth/') ||
      currentPath.startsWith('/survey/')) {
    return
  }
  
  sessionExpiredAlertShown = true
  
  const result = await Swal.fire({
    title: 'Session Expired',
    text: 'Your session has ended. Access and refresh tokens have been cleared. Please log in again to continue.',
    icon: 'warning',
    confirmButtonText: 'Go to Login',
    confirmButtonColor: '#3085d6',
    allowOutsideClick: false,
    allowEscapeKey: false
  })
  
  // After user clicks the button, redirect to login with a hard refresh
  if (result.isConfirmed) {
    // Add a small delay to ensure the alert is properly dismissed
    setTimeout(() => {
      // Force a hard redirect to login page to clear all JavaScript state
      window.location.replace('/login')
      
      // As a backup, also try to reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }, 100)
  }
}

// Redirect to login page
const redirectToLogin = (): void => {
  // CRITICAL: Don't redirect if we're on a survey page - surveys are public!
  if (isSurveyContext()) {
    return
  }
  
  // Additional safety check for public survey URLs
  const currentPath = window.location.pathname
  if (currentPath.includes('/survey/public/') || 
      currentPath.includes('/survey/password/') ||
      currentPath.includes('/survey/auth/') ||
      currentPath.startsWith('/survey/')) {
    return
  }
  
  // Use replace() to force a hard redirect and clear JavaScript state
  window.location.replace('/login')
}

// Request interceptor to ensure token is present
apiClient.interceptors.request.use(
  async (config) => {
    // CRITICAL: Skip auth token injection for survey contexts - surveys are public!
    if (isSurveyContext(config.url)) {
      return config
    }
    
    // Extra safety check for survey URLs in the current page
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/survey/')) {
      return config
    }
    
    // If we don't have an access token but have a refresh token, try to get one
    if (!accessToken && refreshToken && !isRefreshing) {
      try {
        const newToken = await silentRefreshAccessToken()
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
      } catch (error) {
        console.warn('Failed to refresh token in request interceptor:', error)
      }
    } else if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<AuthError>) => {
    const originalRequest = error.config as any
    
    // CRITICAL: Don't attempt refresh or show alerts for survey API endpoints - surveys are public!
    if (isSurveyContext(originalRequest?.url)) {
      return Promise.reject(error)
    }
    
    // Extra safety check for survey URLs in the current page
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/survey/')) {
      return Promise.reject(error)
    }
    
    // Don't attempt refresh if we've failed too many times recently
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
      clearTokens()
      await showSessionExpiredAlert()
      return Promise.reject(error)
    }
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Check if this is a refresh token endpoint request that failed
      if (originalRequest.url?.includes('auth/token/refresh/')) {
        console.warn('Refresh token request failed with 401, logging out user')
        clearTokens()
        await showSessionExpiredAlert()
        return Promise.reject(error)
      }
      
      const newToken = await refreshAccessToken()
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        // Ensure the config is properly cloned for retry
        return apiClient.request(originalRequest)
      } else {
        // Failed to refresh token, redirect to login
        clearTokens()
        await showSessionExpiredAlert()
      }
    }
    return Promise.reject(error)
  }
)

// Authentication API Service
export const authAPI = {
  // Login with email and password
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/', { 
        email, 
        password 
      }, {
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      })
      
      if (response.status === 200) {
        const { tokens, user } = response.data
        // Store both access and refresh tokens
        setAuthTokens(tokens.access || null, tokens.refresh || null)
        // Reset refresh failure count on successful login
        refreshFailureCount = 0
        lastRefreshAttempt = 0
        refreshDisabled = false
        return { ...response.data, user }
      }
      
      // Handle specific error responses
      if (response.status === 429) {
        // Rate limit error - preserve the response data for handling
        const error = new Error('Rate limit exceeded') as any
        error.response = response
        throw error
      }
      
      if (response.status === 400) {
        // Validation error - preserve field errors and rate limit info
        const error = new Error('Validation failed') as any
        error.response = response
        throw error
      }
      
      throw new Error('Login failed')
    } catch (error: any) {
      // For axios errors, preserve the original error structure
      if (error.response) {
        throw error
      }
      
      // For other errors, wrap in our format
      throw { general: ['Login failed. Please try again.'] }
    }
  },

  // Refresh access token (uses refresh token in body)
  refreshToken: async (): Promise<TokenRefreshResponse> => {
    // Don't attempt refresh if we've failed too many times recently
    if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
      throw new Error('Max refresh attempts exceeded')
    }

    // Check if we have a refresh token
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await apiClient.post<TokenRefreshResponse>('auth/token/refresh/', {
      refresh: refreshToken
    }, {
      // Suppress network errors from appearing in browser console
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    })
    
    if (response.status === 200) {
      setAuthTokens(response.data.access || null, response.data.refresh || refreshToken)
      return response.data
    } else if (response.status === 401) {
      // Token is expired or invalid
      console.warn('Refresh token expired or invalid, logging out user')
      clearTokens()
      await showSessionExpiredAlert()
      throw new Error('Refresh token expired')
    } else {
      refreshFailureCount++
      throw new Error(`Token refresh failed with status ${response.status}`)
    }
  },

  // Logout user and invalidate refresh cookie
  logout: async (): Promise<LogoutResponse> => {
    try {
      const response = await apiClient.post<LogoutResponse>('/auth/logout/', {})
      clearTokens() // always clear local state
      return response.data
    } catch (error) {
      clearTokens()
      throw error
    }
  },

  // Get current authenticated user information
  getCurrentUser: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/auth/me/')
    return response.data
  },

  // Update user profile
  updateUserProfile: async (userData: UserUpdateRequest): Promise<UserProfileResponse> => {
    const response = await apiClient.patch<UserProfileResponse>('/auth/me/', userData)
    return response.data
  },

  // Get user stats
  getUserStats: async (): Promise<UserStatsResponse> => {
    const response = await apiClient.get<UserStatsResponse>('/auth/me/stats/')
    return response.data
  },

  // Health check endpoint
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/health/')
    return response.data
  }
}

// Error handling utility
export const handleApiError = (error: AxiosError<AuthError>): string => {
  // Handle rate limiting specifically
  if (error.response?.status === 429) {
    const retryAfter = error.response.data?.retry_after_seconds || 0
    if (retryAfter > 0) {
      const minutes = Math.ceil(retryAfter / 60)
      return `Account locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    }
    return 'Too many failed attempts. Please try again later.'
  }
  
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors
    if (errors.non_field_errors && errors.non_field_errors.length > 0) {
      return errors.non_field_errors[0]
    }
    if (errors.email && errors.email.length > 0) {
      return errors.email[0]
    }
    if (errors.password && errors.password.length > 0) {
      return errors.password[0]
    }
    return 'An error occurred'
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error.message) {
    return error.message
  }
  return 'Network error occurred'
}

// Enhanced security error handler
export const handleSecurityApiError = (error: any): {
  type: 'rate_limit' | 'validation' | 'authentication' | 'network'
  message: string
  remainingAttempts?: number
  retryAfter?: number
  fieldErrors?: Record<string, string[]>
} => {
  if (!error.response) {
    return {
      type: 'network',
      message: 'Network error occurred'
    }
  }
  
  const status = error.response.status
  const data = error.response.data
  
  if (status === 429) {
    return {
      type: 'rate_limit',
      message: 'Too many failed attempts. Account locked.',
      retryAfter: data.retry_after_seconds || 0
    }
  }
  
  if (status === 400) {
    return {
      type: 'validation',
      message: data.detail || 'Invalid input provided',
      remainingAttempts: data.remaining_attempts,
      fieldErrors: data.errors
    }
  }
  
  if (status === 401) {
    return {
      type: 'authentication', 
      message: data.detail || 'Invalid credentials'
    }
  }
  
  return {
    type: 'authentication',
    message: data.detail || 'Authentication failed'
  }
}

export { apiClient, clearTokens }

// Function to reset refresh failure count (useful after successful login)
export const resetRefreshFailureCount = (): void => {
  refreshFailureCount = 0
  lastRefreshAttempt = 0
}

// Function to check if we have a refresh token available
export const hasRefreshToken = (): boolean => {
  return !!refreshToken
}

// Function to get current access token
export const getAccessToken = (): string | null => {
  return accessToken
}

// Function to initialize auth state (useful for app startup)
export const initializeAuth = async (): Promise<boolean> => {
  // If we have a refresh token but no access token, try to refresh
  if (refreshToken && !accessToken && !isRefreshing) {
    try {
      const newToken = await silentRefreshAccessToken()
      return !!newToken
    } catch (error) {
      console.warn('Failed to refresh token on initialization:', error)
      return false
    }
  }
  return !!accessToken
}

// Auto-initialize when module loads
setTimeout(() => {
  if (refreshToken && !accessToken) {
    initializeAuth().catch(error => {
      console.warn('Auto-initialization failed:', error)
    })
  }
}, 0)

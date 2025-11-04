import { ref, computed, watch } from 'vue'
import { authAPI, handleApiError, handleSecurityApiError, silentRefreshAccessToken } from '../services/jwtAuthService'
import type { UserProfile, LoginResponse } from '../types/auth.types'
import { storeLockoutTime, getRemainingLockoutTime, clearLockoutTime } from '../utils/security'

// Reactive state - shared across all composable instances
const isAuthenticated = ref(false)
const user = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isInitialized = ref(false)

// Rate limiting state
const remainingAttempts = ref<number>(0)
const retryAfter = ref<number>(0)
const isLocked = ref(false)
const lockoutInterval = ref<number | null>(null)

// Session storage keys
const STORAGE_KEYS = {
  USER: 'wpc_user',
  AUTH_STATUS: 'wpc_auth_status'
} as const

// Session persistence helpers
const saveUserToSession = (userData: UserProfile | null) => {
  try {
    if (userData) {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
      sessionStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'authenticated')
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.USER)
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATUS)
    }
  } catch (error) {
    console.warn('Failed to save user to session storage:', error)
  }
}

const loadUserFromSession = (): UserProfile | null => {
  try {
    const userData = sessionStorage.getItem(STORAGE_KEYS.USER)
    const authStatus = sessionStorage.getItem(STORAGE_KEYS.AUTH_STATUS)
    
    if (userData && authStatus === 'authenticated') {
      return JSON.parse(userData)
    }
  } catch (error) {
    console.warn('Failed to load user from session storage:', error)
  }
  return null
}

const clearSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.USER)
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_STATUS)
  } catch (error) {
    console.warn('Failed to clear session storage:', error)
  }
}

// Initialize authentication state
const initializeAuth = async (): Promise<void> => {
  if (isInitialized.value) {
    return
  }

  try {
    isLoading.value = true
    
    // First, try to load user from session storage (for page refresh)
    const sessionUser = loadUserFromSession()
    if (sessionUser) {
      user.value = sessionUser
      isAuthenticated.value = true
    }

    // Then attempt silent refresh to get a new access token
    const token = await silentRefreshAccessToken()
    if (token) {
      try {
        // Verify token is still valid by fetching current user
        const profile = await authAPI.getCurrentUser()
        
        // Update state with fresh data
        user.value = profile.user
        isAuthenticated.value = true
        
        // Update session storage with fresh data
        saveUserToSession(profile.user)
      } catch (profileError) {
        console.warn('Failed to fetch user profile during initialization:', profileError)
        
        // If we have session data but can't fetch profile, still consider authenticated
        // The token might be expired but refresh token might still work
        if (sessionUser) {
          user.value = sessionUser
          isAuthenticated.value = true
        } else {
          // No session data and can't fetch profile
          isAuthenticated.value = false
          user.value = null
          clearSession()
        }
      }
    } else {
      // No token available
      if (!sessionUser) {
        isAuthenticated.value = false
        user.value = null
        clearSession()
      }
      // If we have session user but no token, keep the user data but mark as potentially expired
    }
  } catch (error) {
    console.warn('Authentication initialization failed:', error)
    isAuthenticated.value = false
    user.value = null
    clearSession()
  } finally {
    isLoading.value = false
    isInitialized.value = true
  }
}

export const useSimpleAuth = () => {
  // Rate limiting helpers
  const startLockoutCountdown = (seconds: number) => {
    retryAfter.value = seconds
    isLocked.value = true
    
    if (lockoutInterval.value) {
      clearInterval(lockoutInterval.value)
    }
    
    lockoutInterval.value = window.setInterval(() => {
      retryAfter.value--
      if (retryAfter.value <= 0) {
        clearLockoutCountdown()
      }
    }, 1000)
    
    // Store in localStorage for persistence across page refreshes
    storeLockoutTime(seconds)
  }
  
  const clearLockoutCountdown = () => {
    if (lockoutInterval.value) {
      clearInterval(lockoutInterval.value)
      lockoutInterval.value = null
    }
    retryAfter.value = 0
    isLocked.value = false
    remainingAttempts.value = 0
    clearLockoutTime()
  }
  
  // Check for existing lockout on initialization
  const checkExistingLockout = () => {
    const remaining = getRemainingLockoutTime()
    if (remaining > 0) {
      startLockoutCountdown(remaining)
    }
  }

  // Login with email and password
  const login = async (email: string, password: string): Promise<{ success: boolean; errors?: any }> => {
    try {
      // Check if currently locked
      if (isLocked.value && retryAfter.value > 0) {
        return { 
          success: false, 
          errors: { 
            general: [`Account locked. Try again in ${Math.ceil(retryAfter.value / 60)} minute(s).`] 
          }
        }
      }

      isLoading.value = true
      error.value = null
      
      const response: LoginResponse = await authAPI.login(email, password)
      
      // Clear any previous rate limiting state on successful login
      clearLockoutCountdown()
      
      // Update reactive state
      user.value = response.user
      isAuthenticated.value = true
      
      // Save to session storage
      saveUserToSession(response.user)
      
      return { success: true }
    } catch (err: any) {
      const securityError = handleSecurityApiError(err)
      
      // Handle rate limiting
      if (securityError.type === 'rate_limit' && securityError.retryAfter) {
        startLockoutCountdown(securityError.retryAfter)
        error.value = securityError.message
        return { 
          success: false, 
          errors: { general: [securityError.message] }
        }
      }
      
      // Handle validation errors with remaining attempts
      if (securityError.type === 'validation') {
        if (securityError.remainingAttempts !== undefined) {
          remainingAttempts.value = securityError.remainingAttempts
        }
        error.value = securityError.message
        return { 
          success: false, 
          errors: securityError.fieldErrors || { general: [securityError.message] }
        }
      }
      
      // Handle other authentication errors  
      error.value = securityError.message
      isAuthenticated.value = false
      user.value = null
      clearSession()
      return { 
        success: false, 
        errors: securityError.fieldErrors || { general: [securityError.message] }
      }
    } finally {
      isLoading.value = false
    }
  }

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      // Call backend logout
      await authAPI.logout()
    } catch (logoutError) {
      console.warn('Logout API call failed:', logoutError)
      // Continue with local logout even if backend call fails
    } finally {
      // Always clear local state and session
      user.value = null
      isAuthenticated.value = false
      isInitialized.value = false
      isLoading.value = false
      clearSession()
      
      // Redirect to login
      window.location.href = '/login'
    }
  }

  // Get current user profile (refresh user data)
  const getCurrentUser = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authAPI.getCurrentUser()
      
      user.value = response.user
      isAuthenticated.value = true
      saveUserToSession(response.user)
    } catch (err: any) {
      error.value = handleApiError(err)
      
      if (err.response?.status === 401) {
        // Unauthorized - clear everything
        user.value = null
        isAuthenticated.value = false
        clearSession()
      }
    } finally {
      isLoading.value = false
    }
  }

  // Update user profile
  const updateProfile = async (userData: { first_name?: string; last_name?: string }): Promise<{ success: boolean; errors?: any }> => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await authAPI.updateUserProfile(userData)
      
      user.value = response.user
      saveUserToSession(response.user)
      
      return { success: true }
    } catch (err: any) {
      error.value = handleApiError(err)
      return { success: false, errors: err }
    } finally {
      isLoading.value = false
    }
  }

  // Clear error
  const clearError = (): void => {
    error.value = null
    // Also clear rate limiting warnings but not lockout state
    if (!isLocked.value) {
      remainingAttempts.value = 0
    }
  }
  
  // Initialize and check for existing lockout
  const initializeWithLockoutCheck = async (): Promise<boolean> => {
    checkExistingLockout()
    await initializeAuth()
    return isAuthenticated.value
  }

  // Watch for authentication changes and update session storage
  watch([isAuthenticated, user], () => {
    if (isAuthenticated.value && user.value) {
      saveUserToSession(user.value)
    } else {
      clearSession()
    }
  })

  // Computed properties
  const isLoggedIn = computed(() => isAuthenticated.value)
  const currentUser = computed(() => user.value)
  const hasError = computed(() => !!error.value)
  const isAccountLocked = computed(() => isLocked.value)
  const attemptsRemaining = computed(() => remainingAttempts.value)
  const lockoutTimeRemaining = computed(() => retryAfter.value)
  const userFullName = computed(() => {
    if (!user.value) return ''
    return user.value.full_name || `${user.value.first_name} ${user.value.last_name}`.trim()
  })
  const userInitials = computed(() => {
    if (!user.value) return ''
    const firstName = user.value.first_name?.charAt(0) || ''
    const lastName = user.value.last_name?.charAt(0) || ''
    return (firstName + lastName).toUpperCase()
  })

  return {
    // Reactive state
    isAuthenticated: isLoggedIn,
    user: currentUser,
    isLoading,
    error,
    hasError,
    userFullName,
    userInitials,
    isInitialized: computed(() => isInitialized.value),
    
    // Rate limiting state
    isAccountLocked,
    attemptsRemaining,
    lockoutTimeRemaining,

    // Methods
    login,
    logout,
    getCurrentUser,
    updateProfile,
    checkAuth: initializeWithLockoutCheck, // Use initialize instead for lockout check
    clearError,
    initializeAuth,
    clearLockoutCountdown
  }
}

// Auto-initialize on module load (for page refresh scenarios)  
// Check for existing lockout and initialize auth
const globalInitialize = async () => {
  const remaining = getRemainingLockoutTime()
  if (remaining > 0) {
    retryAfter.value = remaining
    isLocked.value = true
  }
  await initializeAuth()
}

globalInitialize()

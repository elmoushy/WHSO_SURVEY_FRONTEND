import { ref, computed } from 'vue'
import { authAPI, handleApiError, initializeAuth as initAuthState } from '../services/jwtAuthService'
import type { UserProfile, LoginResponse } from '../types/auth.types'

// Reactive state
const isAuthenticated = ref(false)
const user = ref<UserProfile | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isInitialized = ref(false)
const initPromise = ref<Promise<void> | null>(null)

// Initialize auth state (attempt silent refresh then load profile)
const initializeAuth = async (): Promise<void> => {
  // If already initialized and authenticated, skip
  if (isInitialized.value && isAuthenticated.value) {
    return
  }
  
  // If initialization is already in progress, wait for it
  if (initPromise.value) {
    return initPromise.value
  }
  
  initPromise.value = (async () => {
    try {
      isLoading.value = true
      
      // First try to initialize auth state from storage (this handles token refresh)
      const hasValidToken = await initAuthState()
      if (hasValidToken) {
        // If we have a valid token, try to fetch user profile
        try {
          const profile = await authAPI.getCurrentUser()
          user.value = profile.user
          isAuthenticated.value = true
        } catch {
          // Failed to fetch profile – treat as unauthenticated
          isAuthenticated.value = false
          user.value = null
        }
      } else {
        isAuthenticated.value = false
        user.value = null
      }
    } finally {
      isLoading.value = false
      isInitialized.value = true
      initPromise.value = null
    }
  })()
  
  return initPromise.value
}

export const useJWTAuth = () => {
  // Login with email and password
  const login = async (email: string, password: string): Promise<{ success: boolean; errors?: any }> => {
    try {
      isLoading.value = true
      error.value = null
      const response: LoginResponse = await authAPI.login(email, password)
      user.value = response.user
      isAuthenticated.value = true
      isInitialized.value = true
      return { success: true }
    } catch (err: any) {
      error.value = handleApiError(err)
      return { success: false, errors: err }
    } finally {
      isLoading.value = false
    }
  }

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      await authAPI.logout()
    } catch {
      // continue regardless
    } finally {
      user.value = null
      isAuthenticated.value = false
      isInitialized.value = false
      isLoading.value = false
      window.location.href = '/login'
    }
  }

  // Get current user profile
  const getCurrentUser = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      const response = await authAPI.getCurrentUser()
      user.value = response.user
      isAuthenticated.value = true
    } catch (err: any) {
      error.value = handleApiError(err)
      if (err.response?.status === 401) {
        user.value = null
        isAuthenticated.value = false
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
      return { success: true }
    } catch (err: any) {
      error.value = handleApiError(err)
      return { success: false, errors: err }
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated (ensure access token present by trying profile fetch)
  const checkAuth = async (): Promise<boolean> => {
    // Always run initialization to attempt silent refresh, especially on page refresh
    await initializeAuth()
    return isAuthenticated.value
  }

  // Clear error
  const clearError = (): void => {
    error.value = null
  }

  // Computed properties
  const isLoggedIn = computed(() => isAuthenticated.value)
  const currentUser = computed(() => user.value)
  const hasError = computed(() => !!error.value)
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

    // Methods
    login,
    logout,
    getCurrentUser,
    updateProfile,
    checkAuth,
    clearError,
    initializeAuth
  }
}

// Kick off initial silent auth attempt (do not await)
initializeAuth()

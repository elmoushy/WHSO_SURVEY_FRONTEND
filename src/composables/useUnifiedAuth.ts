import { ref, computed, watch } from 'vue'
import { useJWTAuth } from './useJWTAuth'

// Unified authentication state
const isInitialized = ref(false)
const initializationPromise = ref<Promise<void> | null>(null)

export const useUnifiedAuth = () => {
  // Import authentication system
  const jwtAuth = useJWTAuth()

  // Initialization state
  const isLoading = computed(() => jwtAuth.isLoading.value)
  const error = computed(() => jwtAuth.error.value)

  // Primary authentication check - use JWT
  const isAuthenticated = computed(() => {
    return jwtAuth.isAuthenticated.value
  })

  // User info from JWT
  const user = computed(() => {
    return jwtAuth.user.value
  })

  // Initialize both authentication systems
  const initialize = async (): Promise<void> => {
    // If already initialized, return immediately
    if (isInitialized.value) {
      return
    }

    // If initialization is in progress, wait for it
    if (initializationPromise.value) {
      return initializationPromise.value
    }

    initializationPromise.value = (async () => {
      try {
        // Initialize JWT authentication
        await jwtAuth.initializeAuth()

      } catch (error) {
        console.warn('Authentication initialization failed:', error)
      } finally {
        isInitialized.value = true
        initializationPromise.value = null
      }
    })()

    return initializationPromise.value
  }

  // Check authentication status (ensures initialization)
  const checkAuth = async (): Promise<boolean> => {
    await initialize()
    return isAuthenticated.value
  }

  // Login methods - use JWT login
  const login = async (email?: string, password?: string): Promise<{ success: boolean; errors?: any }> => {
    if (email && password) {
      // JWT login
      return await jwtAuth.login(email, password)
    } else {
      // No email/password provided
      return { success: false, errors: ['Email and password required'] }
    }
  }

  // Logout from JWT system
  const logout = async (): Promise<void> => {
    try {
      // Logout from JWT system
      if (jwtAuth.isAuthenticated.value) {
        await jwtAuth.logout()
      }
    } catch (error) {
      console.warn('Logout error:', error)
      // Force redirect to login regardless of errors
      window.location.href = '/login'
    }
  }

  // Clear errors from JWT system
  const clearError = (): void => {
    jwtAuth.clearError()
  }

  // Watch for authentication state changes
  watch(
    [() => jwtAuth.isAuthenticated.value],
    ([jwtAuthStatus]) => {
      // If we lose authentication, redirect to login
      if (!jwtAuthStatus && isInitialized.value) {
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
  )

  return {
    // State
    isAuthenticated,
    user,
    isLoading,
    error,
    isInitialized: computed(() => isInitialized.value),

    // Methods
    initialize,
    checkAuth,
    login,
    logout,
    clearError,

    // Direct access to auth system
    jwtAuth
  }
}

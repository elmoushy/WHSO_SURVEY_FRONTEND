<template>
  <div id="app">
    <!-- Global Authentication Loading State -->
    <AuthLoading
      v-if="isInitializing"
      :title="loadingTitle"
      :message="loadingMessageText"
      :debug-info="isDev ? authContext : undefined"
    />

    <!-- Global Authentication Error State -->
    <AuthError
      v-else-if="shouldShowGlobalError"
      :title="errorTitle"
      :message="errorMessage"
      :details="isDev && error ? error : undefined"
      :on-retry="handleRetry"
      :on-go-home="handleGoHome"
      :tips="errorTips"
    />

    <!-- Main Application -->
    <router-view v-else />

    <!-- Global Loading Overlay for Token Refresh -->
    <Transition name="fade">
      <div 
        v-if="isTokenRefreshing" 
        :class="$style.tokenRefreshOverlay"
      >
        <div :class="$style.refreshIndicator">
          <div :class="$style.refreshSpinner"></div>
          <span>Refreshing session...</span>
        </div>
      </div>
    </Transition>

    <!-- Session Timeout Warning -->
    <Transition name="slide-up">
      <div 
        v-if="showSessionWarning" 
        :class="$style.sessionWarning"
      >
        <div :class="$style.warningContent">
          <svg :class="$style.warningIcon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div>
            <h4>Session Expiring Soon</h4>
            <p>Your session will expire in {{ sessionTimeRemaining }} minutes.</p>
          </div>
          <div :class="$style.warningActions">
            <button @click="extendSession" :class="$style.extendButton">
              Extend Session
            </button>
            <button @click="dismissWarning" :class="$style.dismissButton">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AuthState } from './services/authService'
import AuthLoading from './components/AuthLoading/AuthLoading.vue'
import AuthError from './components/AuthError/AuthError.vue'

const router = useRouter()
// Minimal auth state for unused component
const authContext = ref<any>(null)
const state = ref(AuthState.AUTHENTICATED)
const error = ref<string | null>(null)
const isInitializing = ref(false)
const authLoadingMessage = ref('')
const initialize = () => {}
const retry = () => {}
const clearError = () => {}

const isDev = computed(() => import.meta.env.VITE_ENVIRONMENT === 'development')
const showSessionWarning = ref(false)
const sessionTimeRemaining = ref(0)

// Global loading states
const isTokenRefreshing = computed(() => state.value === AuthState.TOKEN_REFRESH)

// Error handling
const shouldShowGlobalError = computed(() => {
  return state.value === AuthState.FAILED && 
         !['/login', '/register'].includes(router.currentRoute.value.path)
})

const loadingTitle = computed(() => {
  switch (state.value) {
    case AuthState.INITIALIZING:
      return 'Initializing'
    case AuthState.AUTHENTICATING:
      return 'Signing In'
    case AuthState.BACKEND_SYNC:
      return 'Connecting'
    default:
      return 'Loading'
  }
})

const loadingMessageText = computed((): string => {
  return authLoadingMessage.value || 'Please wait while we set up your session...'
})

const errorTitle = computed(() => {
  if (error.value?.includes('network') || error.value?.includes('timeout')) {
    return 'Connection Problem'
  }
  if (error.value?.includes('authentication') || error.value?.includes('unauthorized')) {
    return 'Authentication Error'
  }
  return 'Something Went Wrong'
})

const errorMessage = computed(() => {
  return error.value || 'An unexpected error occurred. Please try again.'
})

const errorTips = computed(() => {
  const tips = []
  
  if (error.value?.includes('network') || error.value?.includes('timeout')) {
    tips.push('Check your internet connection')
    tips.push('Try connecting to a different network')
  }
  
  if (error.value?.includes('authentication')) {
    tips.push('Sign out and sign in again')
    tips.push('Clear your browser cache')
  }
  
  tips.push('Refresh the page')
  tips.push('Wait a few minutes and try again')
  
  return tips
})

// Session management
const setupSessionMonitoring = () => {
  const checkSessionExpiry = () => {
    const context = authContext.value
    if (context.state === AuthState.AUTHENTICATED && context.lastActivity) {
      const inactiveTime = Date.now() - context.lastActivity
      const warningThreshold = 50 * 60 * 1000 // 50 minutes
      const sessionTimeout = 60 * 60 * 1000 // 60 minutes
      
      if (inactiveTime > warningThreshold && inactiveTime < sessionTimeout) {
        const remainingTime = Math.ceil((sessionTimeout - inactiveTime) / (60 * 1000))
        sessionTimeRemaining.value = remainingTime
        showSessionWarning.value = true
      } else {
        showSessionWarning.value = false
      }
    }
  }
  
  // Check every minute
  setInterval(checkSessionExpiry, 60000)
}

// Event handlers
const handleRetry = async () => {
  clearError()
  retry()
}

const handleGoHome = () => {
  clearError()
  router.push('/login')
}

const extendSession = () => {
  // Trigger any user activity to extend session
  document.dispatchEvent(new Event('mousedown'))
  showSessionWarning.value = false
}

const dismissWarning = () => {
  showSessionWarning.value = false
}

// Analytics/Telemetry (optional)
const trackAuthEvent = (_event: string, _data?: any) => {
  if (isDev.value) {
    
  }
  
  // Send to analytics service
  // Example: analytics.track(event, data)
}

// Watch for auth state changes for analytics
watch(state, (newState, oldState) => {
  if (oldState && newState !== oldState) {
    trackAuthEvent('auth_state_change', {
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString()
    })
  }
})

// Watch for successful authentication
watch(
  () => authContext.value.state === AuthState.AUTHENTICATED,
  (isAuthenticated) => {
    if (isAuthenticated) {
      trackAuthEvent('auth_success', {
        user: authContext.value.backendUser?.email,
        timestamp: new Date().toISOString()
      })
    }
  }
)

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    trackAuthEvent('auth_error', {
      error: newError,
      state: state.value,
      timestamp: new Date().toISOString()
    })
  }
})

// Initialize on mount
onMounted(async () => {
  try {
    trackAuthEvent('app_start')
    await initialize()
    setupSessionMonitoring()
  } catch (err) {
    // Logging removed for production
  }
})
</script>

<style module>
.tokenRefreshOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  z-index: 8999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refreshIndicator {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.refreshSpinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid #997A51;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.sessionWarning {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(251, 146, 60, 0.3);
  border-left: 4px solid #f59e0b;
  max-width: 350px;
  z-index: 9000;
}

.warningContent {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warningIcon {
  width: 24px;
  height: 24px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warningContent h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.warningContent p {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #64748b;
}

.warningActions {
  display: flex;
  gap: 0.5rem;
}

.extendButton,
.dismissButton {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.extendButton {
  background: #f59e0b;
  color: white;
}

.extendButton:hover {
  background: #d97706;
}

.dismissButton {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.dismissButton:hover {
  background: rgba(100, 116, 139, 0.15);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sessionWarning {
    bottom: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
  
  .warningContent {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .warningActions {
    align-self: stretch;
  }
  
  .extendButton,
  .dismissButton {
    flex: 1;
  }
}
</style>

<template>
  <header :class="$style.header" :data-theme="currentTheme">
    <nav :class="$style.nav">
    

      <div :class="$style.greetingBlock">
        <h1 :class="$style.greetingTitle">{{ greetingHeading }}</h1>
        <span :class="$style.greetingDate">{{ todayFormatted }}</span>
      </div>
        <div :class="$style.leftCluster">
     

        <div :class="$style.iconButtons">
          <div :class="$style.iconButtonWrap">
            <button
              type="button"
              :class="$style.iconButton"
              @click.stop="toggleNotifications"
              data-dropdown
            >
              <i class="fas fa-bell" :class="{ [$style.wsConnected]: wsConnected, [$style.wsDisconnected]: !wsConnected }"></i>
              <span v-if="notificationCount > 0" :class="$style.badge">{{ notificationCount }}</span>
            </button>

            <div v-if="wsConnecting" :class="$style.wsStatus" title="Connecting to notification service...">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div v-else-if="wsConnectionError" :class="$style.wsError" :title="`Connection error: ${wsConnectionError}`">
              <i class="fas fa-exclamation-triangle"></i>
            </div>

            <div v-if="showNotifications" :class="$style.dropdown" data-dropdown @click.stop>
              <div :class="$style.dropdownHeader">
                <h3>{{ t('notifications.title') }}</h3>
                <div :class="$style.headerActions">
                  <!-- Refresh button -->
                  <button 
                    @click="retryLoadNotifications" 
                    :class="$style.refreshBtn" 
                    :disabled="isLoadingNotifications"
                    :title="currentLanguage === 'ar' ? 'تحديث' : 'Refresh'"
                  >
                    <i :class="isLoadingNotifications ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
                  </button>
                  <button @click="markAllAsRead" :class="$style.markAllRead" :disabled="isMarkingAllRead || notifications.length === 0">
                    <i v-if="isMarkingAllRead" class="fas fa-spinner fa-spin"></i>
                    {{ t('notifications.markAllRead') }}
                  </button>
                </div>
              </div>
              <div :class="$style.notificationsList">
                <!-- Error state with retry option -->
                <div v-if="loadNotificationError && !isLoadingNotifications" :class="$style.errorNotifications" @click="retryLoadNotifications">
                  <i class="fas fa-exclamation-circle"></i>
                  <p>{{ loadNotificationError }}</p>
                  <button :class="$style.retryBtn">
                    <i class="fas fa-redo"></i>
                    {{ currentLanguage === 'ar' ? 'إعادة المحاولة' : 'Retry' }}
                  </button>
                </div>
                <!-- Initial state - not loaded yet -->
                <div v-else-if="!hasLoadedNotifications && !isLoadingNotifications && !loadNotificationError" :class="$style.noNotifications">
                  <i class="fas fa-bell"></i>
                  <p>{{ currentLanguage === 'ar' ? 'انقر لتحميل الإشعارات' : 'Click to load notifications' }}</p>
                </div>
                <!-- Empty state - loaded but no notifications -->
                <div v-else-if="notifications.length === 0 && !isLoadingNotifications && hasLoadedNotifications" :class="$style.noNotifications">
                  <i class="fas fa-bell-slash"></i>
                  <p>{{ t('notifications.noNotifications') }}</p>
                  <span>{{ t('notifications.noNotificationsDesc') }}</span>
                </div>
                <!-- Loading state -->
                <div v-if="isLoadingNotifications" :class="$style.loadingNotifications">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>{{ currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...' }}</p>
                  <span :class="$style.loadingHint">{{ currentLanguage === 'ar' ? 'قد يستغرق بضع ثوان...' : 'This may take a few seconds...' }}</span>
                </div>
                <!-- Notification items -->
                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  :class="[$style.notificationItem, { [$style.unread]: !notification.is_read }]"
                  @click="handleNotificationClick(notification)"
                >
                  <i :class="getNotificationIcon(notification.notification_type)" :style="{ color: getPriorityColor(notification.priority) }"></i>
                  <div :class="$style.notificationContent">
                    <p :class="$style.notificationTitle">{{ notification.title_localized }}</p>
                    <p :class="$style.notificationBody">{{ notification.body_localized }}</p>
                    <span :class="$style.notificationTime">{{ formatTime(notification.created_at) }}</span>
                  </div>
                  <div v-if="!notification.is_read" :class="$style.unreadDot"></div>
                </div>
              </div>
              <div v-if="notifications.length > 0" :class="$style.notificationFooter">
                <router-link to="/notifications" @click="closeAllDropdowns" :class="$style.viewAllLink">
                  {{ t('notifications.viewAll') }}
                </router-link>
              </div>
            </div>
          </div>

          <!-- <button type="button" :class="$style.iconButton">
            <i class="fas fa-search"></i>
          </button> -->

          <!-- <button
            :class="$style.mobileToggle"
            @click.stop="toggleMobileMenu"
            :aria-expanded="showMobileMenu"
            aria-label="Toggle mobile menu"
            data-dropdown
          >
            <i :class="showMobileMenu ? 'fas fa-times' : 'fas fa-bars'"></i>
          </button> -->
        </div>
           <div
          :class="$style.profileCard"
          @click.stop="toggleUserMenu"
          role="button"
          tabindex="0"
          data-dropdown
          @keydown.enter.prevent="toggleUserMenu"
          @keydown.space.prevent="toggleUserMenu"
        >
         <span :class="$style.profileAvatar">
            <img v-if="userDisplayName" :src="generateAvatarUrl(userEmail)" :alt="userDisplayName" />
            <i v-else class="fas fa-user"></i>
          </span>
      
          <span :class="$style.profileInfo">
            <span :class="$style.profileName">{{ userDisplayName || 'زائر' }}</span>
            <span :class="$style.profileEmail">{{ userEmail || 'company@mail.com' }}</span>
          </span>
             <span :class="$style.profileArrow">
            <i class="fas fa-chevron-down" :class="{ [$style.rotated]: showUserMenu }"></i>
          </span>

          <div v-if="showUserMenu" :class="$style.userDropdown" data-dropdown @click.stop>
            <div :class="$style.userDropdownHeader">
              <div :class="$style.userProfileSection">
                <div :class="$style.userAvatarLarge">
                  <img v-if="userDisplayName" :src="generateAvatarUrl(userEmail)" :alt="userDisplayName" />
                  <i v-else class="fas fa-user"></i>
                </div>
                <div :class="$style.userDetailsSection">
                  <div :class="$style.userDisplayName">{{ userDisplayName || 'Guest User' }}</div>
                  <div :class="$style.userEmailText">{{ userEmail || 'No email available' }}</div>
                  <div :class="$style.userRoleText">{{ userRole || 'No role assigned' }}</div>
                  <div :class="$style.userStatus">
                    <div :class="$style.statusIndicator"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
            </div>
            <div :class="$style.userDropdownContent">
              <div :class="$style.dropdownDivider"></div>
              <button @click="handleLogout" :class="[$style.userDropdownLink, $style.logoutButton]">
                <div :class="$style.linkIcon">
                  <i class="fas fa-sign-out-alt"></i>
                </div>
                <div :class="$style.linkContent">
                  <span :class="$style.linkTitle">{{ 'تسجيل الخروج' }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation -->
    <Transition name="mobile-menu">
      <div v-if="showMobileMenu" :class="$style.mobileNav" data-dropdown @click.stop>
        <!-- Mobile User Profile Section -->
        <div :class="$style.mobileUserProfile">
          <div :class="$style.mobileUserInfo">
            <div :class="$style.userAvatar">
              <img v-if="userDisplayName" :src="generateAvatarUrl(userEmail)" :alt="userDisplayName" />
              <i v-else class="fas fa-user"></i>
            </div>
            <div :class="$style.mobileUserDetails">
              <div :class="$style.mobileUserName">{{ userDisplayName || 'Guest User' }}</div>
              <div :class="$style.mobileUserEmail">{{ userEmail || 'No email available' }}</div>
              <div :class="$style.mobileUserRole">{{ userRole || 'No role assigned' }}</div>
            </div>
          </div>
          <button @click="handleLogout" :class="$style.mobileLogoutBtn">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
        
        <div :class="$style.mobileDivider"></div>
        
        <router-link 
          v-for="link in navigationLinks" 
          :key="link.name"
          :to="link.path" 
          :class="[$style.mobileNavLink, { [$style.active]: route.path === link.path }]"
          @click="closeMobileMenu"
        >
          <i :class="link.icon"></i>
          <span>{{ t(link.label) }}</span>
        </router-link>
      </div>
    </Transition>

    <!-- Overlay for dropdowns -->
    <div 
      v-if="showSettings || showNotifications || showMobileMenu || showUserMenu" 
      :class="$style.overlay" 
      @click="closeAllDropdowns"
    ></div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { useSimpleAuth } from '../../composables/useSimpleAuth'
import { notificationService } from '../../services/notificationService'
import { websocketService } from '../../services/websocketService'
import { NOTIFICATION_ICONS, PRIORITY_COLORS } from '../../types/notifications.types'
import type { Notification } from '../../types/notifications.types'

// Navigation link interface
interface NavigationLink {
  name: string
  path: string
  icon: string
  label: string
  title: string
  requiresRole?: string
}

// Store and router
const store = useAppStore()
const router = useRouter()
const route = useRoute()

// JWT Authentication
const { 
  userFullName: userDisplayName, 
  user,
  logout: authLogout
} = useSimpleAuth()

// Computed user email
const userEmail = computed(() => user.value?.email || '')

// Computed user role
const userRole = computed(() => user.value?.role || '')

// Reactive state
const showSettings = ref(false)
const showNotifications = ref(false)
const showMobileMenu = ref(false)
const showUserMenu = ref(false)

// Notifications state - combining HTTP API and WebSocket data
const notifications = ref<Notification[]>([])
const isLoadingNotifications = ref(false)
const isMarkingAllRead = ref(false)
const hasLoadedNotifications = ref(false)
const loadNotificationError = ref<string | null>(null)

// New notification indicator state
const hasNewWebSocketNotification = ref(false)
const newNotificationTimer = ref<NodeJS.Timeout | null>(null)

// Loading timeout and retry configuration
const NOTIFICATION_LOAD_TIMEOUT = 20000 // Increased to 20 seconds for slow connections
const MAX_LOAD_RETRIES = 3 // Increased retries
const loadRetryCount = ref(0)
const loadTimeoutTimer = ref<NodeJS.Timeout | null>(null)

// WebSocket connection state
const wsConnected = ref(false)
const wsConnecting = ref(false)
const wsConnectionError = ref<string | null>(null)

// WebSocket notification count (from real-time updates)
const wsNotificationCount = ref(-1)

// Auto-recovery timer for stuck loading states
const stuckLoadingRecoveryTimer = ref<NodeJS.Timeout | null>(null)

// Combined notification count - prefer WebSocket count, fallback to local state
const notificationCount = computed(() => {
  // If we have a WebSocket count (not -1), use it (it's more accurate)
  // -1 means we haven't received a count from WebSocket yet
  if (wsConnected.value && wsNotificationCount.value > -1) {
    return wsNotificationCount.value
  }
  // Fallback to counting unread from loaded notifications
  return notifications.value.filter(n => !n.is_read).length
})

// Computed properties
// Computed properties for template usage
// @ts-ignore - Used in template
const currentLanguage = computed({
  get: () => store.currentLanguage,
  set: (value) => store.setLanguage(value)
})

const currentTheme = computed(() => store.currentTheme)
const t = computed(() => store.t)

const greetingName = computed(() => {
  const raw = userDisplayName.value?.trim()
  if (raw) {
    const parts = raw.split(/\s+/)
    if (parts.length > 0) return parts[0]
    return raw
  }
  return currentLanguage.value === 'ar' ? 'صديقي' : 'Friend'
})

const greetingHeading = computed(() => {
  return currentLanguage.value === 'ar'
    ? `اهلا بك يا ${greetingName.value}`
    : `Welcome back, ${greetingName.value}`
})

const todayFormatted = computed(() => {
  const now = new Date()
  const formatted = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `${formatted}`
})



// Navigation links - Release One: Only Surveys and Control pages
const baseNavigationLinks = ref<NavigationLink[]>([
  // Commented out for Release One - not required in production
  // { 
  //   name: 'Welcome', 
  //   path: '/welcome', 
  //   icon: 'fas fa-home', 
  //   label: 'navigation.welcome',
  //   title: 'Welcome Page'
  // },
  // { 
  //   name: 'Dashboard', 
  //   path: '/dashboard', 
  //   icon: 'fas fa-tachometer-alt', 
  //   label: 'navigation.dashboard',
  //   title: 'Dashboard'
  // },
  // { 
  //   name: 'Projects', 
  //   path: '/projects', 
  //   icon: 'fas fa-folder', 
  //   label: 'navigation.projects',
  //   title: 'Projects'
  // },
  
  // Release One: Required pages only
  { 
    name: 'Surveys', 
    path: '/surveys', 
    icon: 'fas fa-poll', 
    label: 'navigation.surveys',
    title: 'Surveys'
  },
  // { 
  //   name: 'Notifications', 
  //   path: '/notifications', 
  //   icon: 'fas fa-bell', 
  //   label: 'navigation.notifications',
  //   title: 'Notifications'
  // },
  { 
    name: 'Control', 
    path: '/control', 
    icon: 'fas fa-cogs', 
    label: 'navigation.control',
    title: 'Control Panel',
    requiresRole: 'admin' // Only show for admin users
  }
])

// Computed navigation links based on user role
const navigationLinks = computed(() => {
  if (!user.value) {
    return baseNavigationLinks.value
  }
  
  return baseNavigationLinks.value.filter(link => {
    // If link doesn't require a specific role, show it to everyone
    if (!link.requiresRole) {
      return true
    }
    
    // Check if user has admin privileges (admin or super_admin roles)
    if (link.requiresRole === 'admin') {
      const userRole = user.value?.role
      return userRole === 'admin' || userRole === 'super_admin'
    }
    
    return true
  })
})

// Notification methods

/**
 * Clear all loading timers to prevent memory leaks
 */
const clearLoadingTimers = () => {
  if (loadTimeoutTimer.value) {
    clearTimeout(loadTimeoutTimer.value)
    loadTimeoutTimer.value = null
  }
  if (stuckLoadingRecoveryTimer.value) {
    clearTimeout(stuckLoadingRecoveryTimer.value)
    stuckLoadingRecoveryTimer.value = null
  }
}

/**
 * Reset loading state - called when loading gets stuck or fails
 */
const resetLoadingState = () => {
  clearLoadingTimers()
  isLoadingNotifications.value = false
  loadNotificationError.value = null
}

/**
 * Load notifications with timeout and retry logic
 */
const loadNotifications = async () => {
  // Prevent multiple simultaneous loads
  if (isLoadingNotifications.value) {
    return
  }
  
  // Clear any existing timers
  clearLoadingTimers()
  
  isLoadingNotifications.value = true
  loadNotificationError.value = null
  
  // Set up timeout to prevent infinite loading
  const timeoutPromise = new Promise<never>((_, reject) => {
    loadTimeoutTimer.value = setTimeout(() => {
      reject(new Error('TIMEOUT'))
    }, NOTIFICATION_LOAD_TIMEOUT)
  })
  
  // Set up stuck loading recovery (additional safety net)
  stuckLoadingRecoveryTimer.value = setTimeout(() => {
    if (isLoadingNotifications.value) {
      resetLoadingState()
      loadNotificationError.value = currentLanguage.value === 'ar' 
        ? 'انتهت المهلة، انقر للمحاولة مرة أخرى' 
        : 'Timed out, click to retry'
    }
  }, NOTIFICATION_LOAD_TIMEOUT + 2000) // Extra 2 seconds as safety margin
  
  try {
    const lang = currentLanguage.value as 'en' | 'ar'
    
    // Race between API call and timeout
    const recentNotifications = await Promise.race([
      notificationService.getRecentNotifications(lang),
      timeoutPromise
    ])
    
    // Clear timeout on success
    clearLoadingTimers()
    
    // Sort by created_at
    notifications.value = recentNotifications.sort((a: Notification, b: Notification) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    hasLoadedNotifications.value = true
    loadRetryCount.value = 0 // Reset retry count on success
    loadNotificationError.value = null
    
  } catch (error: any) {
    
    clearLoadingTimers()
    
    // Handle different error types
    if (error.message === 'TIMEOUT') {
      loadNotificationError.value = currentLanguage.value === 'ar' 
        ? 'انتهت المهلة، انقر للمحاولة مرة أخرى' 
        : 'Loading timed out, click to retry'
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or unauthorized
      loadNotificationError.value = currentLanguage.value === 'ar' 
        ? 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى' 
        : 'Session expired, please login again'
      // Don't retry on auth errors
      loadRetryCount.value = MAX_LOAD_RETRIES
    } else {
      loadNotificationError.value = currentLanguage.value === 'ar' 
        ? 'فشل التحميل، انقر للمحاولة مرة أخرى' 
        : 'Failed to load, click to retry'
    }
    
    // Auto-retry if under retry limit (except for auth errors)
    // Now includes TIMEOUT in retry logic
    if (loadRetryCount.value < MAX_LOAD_RETRIES && error.response?.status !== 401 && error.response?.status !== 403) {
      loadRetryCount.value++
      
      // Wait before retrying
      setTimeout(() => {
        if (showNotifications.value) { // Only retry if dropdown still open
          loadNotifications()
        }
      }, 2000)
    }
  } finally {
    isLoadingNotifications.value = false
  }
}

/**
 * Manual retry function for when user clicks on error message
 */
const retryLoadNotifications = () => {
  loadRetryCount.value = 0 // Reset retry count for manual retry
  loadNotificationError.value = null
  loadNotifications()
}

const handleNotificationClick = async (notification: Notification) => {
  try {
    // Mark as read if unread
    if (!notification.is_read) {
      await notificationService.updateNotification(notification.id, true)
      notification.is_read = true
    }
    
    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url)
      closeAllDropdowns()
    }
  } catch (error) {
    console.error('Failed to handle notification click:', error)
  }
}

const markAllAsRead = async () => {
  if (isMarkingAllRead.value) return
  
  isMarkingAllRead.value = true
  try {
    const lang = currentLanguage.value as 'en' | 'ar'
    await notificationService.markAllAsRead(lang)
    
    // Update local state
    notifications.value.forEach(n => {
      n.is_read = true
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  } finally {
    isMarkingAllRead.value = false
  }
}

// Methods
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  showSettings.value = false
  showNotifications.value = false
  showMobileMenu.value = false
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  showSettings.value = false
  showMobileMenu.value = false
  showUserMenu.value = false
  
  // Hide the new notification indicator when notifications are opened
  hideNewNotificationIndicator()
  
  // Load notifications when opening dropdown
  if (showNotifications.value) {
    loadNotifications()
  }
}

// New notification indicator methods
const hideNewNotificationIndicator = () => {
  hasNewWebSocketNotification.value = false
  if (newNotificationTimer.value) {
    clearTimeout(newNotificationTimer.value)
    newNotificationTimer.value = null
  }
}

function toggleMobileMenu() {
  // Use setTimeout to prevent immediate closing due to event bubbling
  setTimeout(() => {
    showMobileMenu.value = !showMobileMenu.value
    showSettings.value = false
    showNotifications.value = false
    showUserMenu.value = false
  }, 0)
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const closeAllDropdowns = () => {
  showSettings.value = false
  showNotifications.value = false
  showMobileMenu.value = false
  showUserMenu.value = false
}

// Generate avatar URL from email (using Gravatar as fallback)
const generateAvatarUrl = (email: string) => {
  if (!email) return ''
  
  // Use UI Avatars service as a fallback
  const name = userDisplayName.value ? encodeURIComponent(userDisplayName.value) : 'User'
  return `https://ui-avatars.com/api/?name=${name}&background=667eea&color=fff&size=128&rounded=true`
}

// Handle JWT logout
const handleLogout = async () => {
  try {
    await authLogout()
    // The authLogout function will handle redirecting to login page
  } catch (error) {
    // Logging removed for production
    // Fallback: redirect to login page
    router.push('/login')
  }
}

defineExpose({
  toggleMobileMenu,
})

// Handle clicks outside dropdowns
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  
  // Don't close if clicking on dropdown elements or mobile toggle
  if (!target.closest('[data-dropdown]')) {
    closeAllDropdowns()
  }
}

// Handle escape key to close dropdowns
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeAllDropdowns()
  }
}

// Prevent body scroll when dropdowns are open on mobile
const preventBodyScroll = () => {
  if (showSettings.value || showNotifications.value || showMobileMenu.value || showUserMenu.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Watch for dropdown state changes to handle body scroll
watch([showSettings, showNotifications, showMobileMenu, showUserMenu], () => {
  preventBodyScroll()
})

// Store the computed reference once to ensure proper reactivity tracking
const wsServiceConnected = computed(() => websocketService.isNotificationConnected.value)

// Watch websocketService connection state and sync local state
// This handles cases where App.vue connects/disconnects the WebSocket
watch(
  wsServiceConnected,
  (isConnected) => {
    if (isConnected) {
      wsConnected.value = true
      wsConnecting.value = false
      wsConnectionError.value = null
    } else {
      wsConnected.value = false
      // Don't set wsConnecting to true here, let the connect function handle it
    }
  },
  { immediate: true }
)

// ============================================
// WEBSOCKET NOTIFICATION COUNT HANDLING
// ============================================

/**
 * Handle notification.count event from WebSocket
 * This is the ONLY event we listen for - just the count update
 */
const handleNotificationCount = (data: { type: string; count: number; timestamp: string }) => {
  const previousCount = wsNotificationCount.value
  wsNotificationCount.value = data.count
  
  // Show new notification indicator if count increased
  if (data.count > previousCount && previousCount >= 0) {
    showNewNotificationIndicator()
  }
}

/**
 * Handle WebSocket connection success
 */
const handleWsConnected = () => {
  wsConnected.value = true
  wsConnecting.value = false
  wsConnectionError.value = null
  
  // If dropdown is open, refresh notifications on reconnect
  if (showNotifications.value && hasLoadedNotifications.value) {
    loadNotifications()
  }
}

/**
 * Handle WebSocket disconnection
 */
const handleWsDisconnected = () => {
  wsConnected.value = false
  wsConnecting.value = false
  
  // If loading was in progress and WS disconnected, it might be due to token issues
  // Reset loading state to prevent stuck loading
  if (isLoadingNotifications.value) {
    console.warn('⚠️ WebSocket disconnected during notification load, resetting state')
    resetLoadingState()
  }
}

/**
 * Handle WebSocket error
 */
const handleWsError = (data: any) => {
  wsConnectionError.value = data?.message || 'Connection error'
  wsConnecting.value = false
  console.error('❌ Notification WebSocket error:', data)
}

/**
 * Show new notification indicator (dot)
 */
const showNewNotificationIndicator = () => {
  hasNewWebSocketNotification.value = true
  
  // Auto-hide after 10 seconds if user doesn't click
  if (newNotificationTimer.value) {
    clearTimeout(newNotificationTimer.value)
  }
  newNotificationTimer.value = setTimeout(() => {
    // Don't auto-hide, keep it visible until user clicks
  }, 10000)
}

/**
 * Connect to notification WebSocket
 */
const connectToNotificationWebSocket = async () => {
  // Check if websocketService is already connected (e.g., from App.vue)
  // This handles HMR/dev server restart scenarios
  if (wsServiceConnected.value) {
    wsConnected.value = true
    wsConnecting.value = false
    wsConnectionError.value = null
    
    // Register listeners (only once)
    registerWebSocketListeners()
    return
  }
  
  if (wsConnected.value || wsConnecting.value) {
    return
  }
  
  wsConnecting.value = true
  wsConnectionError.value = null
  
  // Set a timeout to prevent stuck "connecting" state
  const connectTimeout = setTimeout(() => {
    if (wsConnecting.value && !wsConnected.value) {
      wsConnecting.value = false
      wsConnectionError.value = 'Connection timeout'
    }
  }, 15000) // 15 second timeout
  
  try {
    // Set up event listeners BEFORE connecting (only once)
    registerWebSocketListeners()
    
    await websocketService.connectToNotifications()
    clearTimeout(connectTimeout)
  } catch (error) {
    clearTimeout(connectTimeout)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    wsConnectionError.value = errorMessage
    wsConnecting.value = false
  }
}

/**
 * Disconnect from notification WebSocket
 */
const disconnectFromNotificationWebSocket = () => {
  // Remove event listeners
  websocketService.off('notification.count', handleNotificationCount)
  websocketService.off('notification.connected', handleWsConnected)
  websocketService.off('notification.disconnected', handleWsDisconnected)
  websocketService.off('notification.error', handleWsError)
  listenersRegistered.value = false
  
  websocketService.disconnectFromNotifications()
  wsConnected.value = false
  wsConnecting.value = false
  wsNotificationCount.value = -1 // Reset to "not received" state
}

// Watch for user authentication changes to connect/disconnect WebSocket
watch(
  () => user.value,
  (currentUser, previousUser) => {
    if (currentUser && !previousUser) {
      // User just logged in - connect to WebSocket
      connectToNotificationWebSocket()
    } else if (!currentUser && previousUser) {
      // User just logged out - disconnect from WebSocket
      disconnectFromNotificationWebSocket()
    }
  },
  { immediate: false }
)

// Utility functions for notifications
const getNotificationIcon = (notificationType: string): string => {
  return NOTIFICATION_ICONS[notificationType as keyof typeof NOTIFICATION_ICONS] || 'fas fa-info-circle'
}

const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#667eea'
}

// Format time helper for notifications
const formatTime = (createdAt: string): string => {
  const now = new Date()
  const notificationDate = new Date(createdAt)
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}d ago`
  }
}

// Track if listeners have been registered to prevent duplicates
const listenersRegistered = ref(false)

/**
 * Register WebSocket event listeners (only once)
 */
const registerWebSocketListeners = () => {
  if (listenersRegistered.value) {
    return
  }
  
  websocketService.on('notification.count', handleNotificationCount)
  websocketService.on('notification.connected', handleWsConnected)
  websocketService.on('notification.disconnected', handleWsDisconnected)
  websocketService.on('notification.error', handleWsError)
  listenersRegistered.value = true
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
  
  // Sync WebSocket state with service on mount (handles HMR/dev server restart scenarios)
  // This is crucial: the service might already be connected from App.vue
  if (wsServiceConnected.value) {
    wsConnected.value = true
    wsConnecting.value = false
    wsConnectionError.value = null
    
    // Register event listeners for future events (only once)
    registerWebSocketListeners()
  } else if (user.value) {
    // Connect to notification WebSocket if user is authenticated but not connected
    connectToNotificationWebSocket()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
  
  // Reset body scroll on unmount
  document.body.style.overflow = ''
  
  // Clear any notification timer
  if (newNotificationTimer.value) {
    clearTimeout(newNotificationTimer.value)
  }
  
  // Clear loading timers to prevent memory leaks
  clearLoadingTimers()
  
  // Disconnect from notification WebSocket
  disconnectFromNotificationWebSocket()
})
</script>

<style module src="./Navigation.module.css">
/* CSS Module styles are imported from Navigation.module.css */
</style>

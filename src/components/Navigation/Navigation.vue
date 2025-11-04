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
              <span v-if="hasNewWebSocketNotification" :class="$style.dotIndicator"></span>
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
                <button @click="markAllAsRead" :class="$style.markAllRead" :disabled="isMarkingAllRead">
                  <i v-if="isMarkingAllRead" class="fas fa-spinner fa-spin"></i>
                  {{ t('notifications.markAllRead') }}
                </button>
              </div>
              <div :class="$style.notificationsList">
                <div v-if="!hasLoadedNotifications && !isLoadingNotifications" :class="$style.noNotifications">
                  <i class="fas fa-bell"></i>
                  <p>{{ currentLanguage === 'ar' ? 'انقر لتحميل الإشعارات' : 'Click to load notifications' }}</p>
                </div>
                <div v-else-if="notifications.length === 0 && !isLoadingNotifications" :class="$style.noNotifications">
                  <i class="fas fa-bell-slash"></i>
                  <p>{{ t('notifications.noNotifications') }}</p>
                  <span>{{ t('notifications.noNotificationsDesc') }}</span>
                </div>
                <div v-if="isLoadingNotifications" :class="$style.loadingNotifications">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>{{ currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...' }}</p>
                </div>
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
import { useWebSocketNotifications } from '../../composables/useWebSocketNotifications'
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

// New notification indicator state
const hasNewWebSocketNotification = ref(false)
const newNotificationTimer = ref<NodeJS.Timeout | null>(null)

// WebSocket Notifications
const {
  realtimeNotifications,
  hasNewNotifications,
  isConnected: wsConnected,
  isConnecting: wsConnecting,
  connectionError: wsConnectionError,
  unreadCount: wsUnreadCount,
  connect: wsConnect,
  disconnect: wsDisconnect,
  markAsRead: wsMarkAsRead,
  requestNotificationPermission
} = useWebSocketNotifications({
  autoConnect: false, // Disable auto-connect, we'll connect manually when ready
  showBrowserNotifications: true,
  subscribeToTypes: ['survey_assigned', 'admin_message', 'system_alert']
})

// Add direct WebSocket service event listener for pong notifications
const handlePongNotificationEvent = (data: any) => {
  
  if (data.trigger === 'new_notification') {
    showNewNotificationIndicator()
    
    // Force reload notifications on next open
    hasLoadedNotifications.value = false
  }
}

// Combined notification count from WebSocket (real-time) and local state
const notificationCount = computed(() => {
  return wsUnreadCount.value || 0
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

// Notification methods - Enhanced with WebSocket integration

// Helper function to convert WebSocket notification to standard Notification type
const convertWebSocketNotification = (wsNotification: any): Notification => ({
  ...wsNotification,
  is_expired: false,
  sent_via_websocket: true
})

const loadNotifications = async () => {
  isLoadingNotifications.value = true
  try {
    const lang = currentLanguage.value as 'en' | 'ar'
    const recentNotifications = await notificationService.getRecentNotifications(lang)
    
    // Convert WebSocket notifications to standard format
    const convertedRealtimeNotifications = realtimeNotifications.value.map(convertWebSocketNotification)
    
    // Merge HTTP API notifications with real-time notifications from WebSocket
    const combinedNotifications = [...convertedRealtimeNotifications, ...recentNotifications]
    
    // Remove duplicates by ID and sort by created_at
    const uniqueNotifications = combinedNotifications
      .filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    notifications.value = uniqueNotifications
    hasLoadedNotifications.value = true
  } catch (error) {
    console.error('Failed to load notifications:', error)
    // Fallback to WebSocket notifications only
    const convertedRealtimeNotifications = realtimeNotifications.value.map(convertWebSocketNotification)
    notifications.value = convertedRealtimeNotifications
  } finally {
    isLoadingNotifications.value = false
  }
}

const handleNotificationClick = async (notification: Notification) => {
  try {
    // Mark as read if unread
    if (!notification.is_read) {
      await notificationService.updateNotification(notification.id, true)
      notification.is_read = true
      
      // Also mark as read in WebSocket service
      wsMarkAsRead(notification.id)
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
    
    // Also mark all real-time notifications as read via WebSocket
    const unreadIds = realtimeNotifications.value
      .filter(n => !n.is_read)
      .map(n => n.id)
    
    if (unreadIds.length > 0) {
      wsMarkAsRead(unreadIds)
    }
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
const showNewNotificationIndicator = () => {
  
  hasNewWebSocketNotification.value = true
  
  // Clear any existing timer
  if (newNotificationTimer.value) {
    clearTimeout(newNotificationTimer.value)
  }
  
  // Auto-hide the indicator after 5 seconds
  newNotificationTimer.value = setTimeout(() => {
    hasNewWebSocketNotification.value = false
  }, 5000)
}

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

// Watch for new WebSocket notifications
watch(
  () => realtimeNotifications.value.length,
  (newLength, oldLength) => {
    // Show indicator when new WebSocket notifications arrive
    if (newLength > (oldLength || 0)) {
      showNewNotificationIndicator()
    }
  }
)

// Watch for hasNewNotifications from WebSocket composable
watch(
  () => hasNewNotifications.value,
  (hasNew) => {
    if (hasNew) {
      showNewNotificationIndicator()
    }
  }
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

// Watch for user authentication to connect WebSocket
watch(
  () => user.value,
  (currentUser) => {
    if (currentUser && !wsConnected.value) {
      // User is authenticated, connect WebSocket
      wsConnect().catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage !== 'WebSocket feature is disabled') {
          console.warn('WebSocket auto-connect on auth failed:', errorMessage)
        }
      })
    } else if (!currentUser && wsConnected.value) {
      // User logged out, disconnect WebSocket
      wsDisconnect()
    }
  }
)

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
  
  // Set up WebSocket service event listener for pong notifications
  websocketService.on('pong_notification', handlePongNotificationEvent)
  
  // Request browser notification permission
  requestNotificationPermission()
  
  // Connect WebSocket when authentication is ready
  // Wait a bit to ensure authentication state is properly initialized
  setTimeout(() => {
    if (user.value && !wsConnected.value) {
      wsConnect().catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage !== 'WebSocket feature is disabled') {
          console.warn('Navigation WebSocket connection failed:', errorMessage)
        }
      })
    }
  }, 500) // Longer delay to ensure auth is ready
  
  // Don't load notifications on mount - only when user clicks
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
  
  // Clean up WebSocket service event listener
  websocketService.off('pong_notification', handlePongNotificationEvent)
  
  // Reset body scroll on unmount
  document.body.style.overflow = ''
  
  // Clear any notification timer
  if (newNotificationTimer.value) {
    clearTimeout(newNotificationTimer.value)
  }
  // WebSocket will be managed by the composable lifecycle
})
</script>

<style module src="./Navigation.module.css">
/* CSS Module styles are imported from Navigation.module.css */
</style>
